import tempfile
import unittest
from unittest.mock import AsyncMock, patch
from pathlib import Path
from types import SimpleNamespace
from pydantic import BaseModel
from graphiti_core.prompts.models import Message
from knowledge.qwen import QwenClient, example
from knowledge.store import Store, extraction_batches, batch_key
from knowledge.graph import GraphBackend, inferred_projection
from test_store import snapshot

class Entities(BaseModel):
    entities: list[str]
class QwenTests(unittest.IsolatedAsyncioTestCase):
    async def test_repair_bounds_previous_output_and_token_budget(self):
        with tempfile.TemporaryDirectory() as temp:
            client=QwenClient(Store(Path(temp)/'db'));calls=[]
            async def call(origin,path,body):
                import copy
                calls.append(copy.deepcopy(body))
                return {'choices':[{'finish_reason':'stop','message':{'content':'x'*12001 if len(calls)==1 else '{"entities":[]}'}}]}
            client.local.call=call
            self.assertEqual(await client.generate_response([Message(role='user',content='Source')],Entities,max_tokens=2999),{'entities':[]})
            self.assertEqual(len(calls),2)
            self.assertEqual(len(calls[1]['messages'][-2]['content']),12000)
            self.assertEqual(calls[1]['max_tokens'],3000)

    async def test_short_verbatim_code_evidence_is_retained(self):
        with tempfile.TemporaryDirectory() as temp:
            store=Store(Path(temp)/'db')
            resource={**snapshot()['resources'][0], 'text':'max: 8\nmax limit', 'offset':0}
            async def generate(messages, response_model, **kwargs):
                return response_model.model_validate({'concepts':[
                    {'name':'max','resource_id':resource['id'],'quote':'max: 8'},
                    {'name':'limit','resource_id':resource['id'],'quote':'max limit'},
                    {'name':'remote','resource_id':resource['id'],'quote':'remote'},
                    {'name':'missing','resource_id':resource['id'],'quote':'max: 8'},
                ],'relationships':[
                    {'source':'max','target':'limit','relationship':'related','resource_id':resource['id'],'quote':'max limit'},
                    {'source':'max','target':'remote','relationship':'related','resource_id':resource['id'],'quote':'max remote'},
                ]}).model_dump()
            graph=GraphBackend(store,SimpleNamespace(encode=lambda text:[1.0]))
            graph.graph=SimpleNamespace(llm_client=SimpleNamespace(generate_response=generate,local=SimpleNamespace(versions={})),driver=object())
            with patch('graphiti_core.nodes.EntityNode.save',new=AsyncMock()) as concept_save, patch('graphiti_core.nodes.EpisodicNode.save',new=AsyncMock()), patch('graphiti_core.edges.EntityEdge.save',new=AsyncMock()) as edge_save:
                result=await graph.extract_batch([resource])
            self.assertEqual(result['concepts'][0]['quote'],'max: 8')
            self.assertEqual(result['facts'][0]['quote'],'max limit')
            self.assertEqual(result['rejected'],3)
            self.assertEqual(concept_save.await_count,2)
            self.assertEqual(edge_save.await_count,1)
            self.assertEqual(store.extraction_get(batch_key([resource]))['status'],'complete')

    async def test_schema_echo_is_reprompted_and_validated_then_cached(self):
        with tempfile.TemporaryDirectory() as temp:
            client=QwenClient(Store(Path(temp)/'db'))
            calls=[]
            async def call(origin,path,body):
                calls.append(body)
                return {'choices':[{'finish_reason':'stop','message':{'content':'{"type":"object","properties":{}}' if len(calls)==1 else '{"entities":["indexes"]}'}}]}
            client.local.call=call
            messages=[Message(role='system',content='Extract'),Message(role='user',content='Indexes are technical concepts')]
            self.assertEqual(await client.generate_response(messages,Entities),{'entities':['indexes']})
            self.assertEqual(len(calls),2)
            self.assertEqual(calls[1]['messages'][-2], {'role':'assistant','content':'{"type":"object","properties":{}}'})
            self.assertIn('brief verbatim quotes',calls[1]['messages'][-1]['content'])
            await client.generate_response(messages,Entities)
            self.assertEqual(len(calls),2)
            self.assertEqual(example(Entities.model_json_schema()),{'entities':['']})
    async def test_invalid_or_truncated_local_output_cannot_activate_extraction(self):
        with tempfile.TemporaryDirectory() as temp:
            client=QwenClient(Store(Path(temp)/'db'))
            async def call(*args): return {'choices':[{'finish_reason':'length','message':{'content':'{"entities":[]}'}}]}
            client.local.call=call
            with self.assertRaises(ValueError): await client.generate_response([Message(role='user',content='Source')],Entities)

class ProjectionTests(unittest.TestCase):
    def test_bounded_batches_resume_and_emit_supported_edges(self):
        with tempfile.TemporaryDirectory() as temp:
            store=Store(Path(temp)/'db'); data=snapshot();store.activate(data)
            batch=extraction_batches(data)[0]
            self.assertLessEqual(sum(len(r['text']) for r in batch),5000)
            self.assertNotEqual(batch_key(batch),batch_key([{**batch[0],'hash':'changed'}]))
            store.extraction_put(batch_key(batch),'complete',{'concepts':[{'id':'c','title':'Indexes','summary':'Indexes make reads faster','quote':'Indexes make reads faster','hash':batch[0]['hash'],'resource_id':batch[0]['id']}],'facts':[],'rejected':2})
            projection=inferred_projection(store)
            self.assertTrue(projection['semantic_complete'])
            self.assertEqual(store.status()['rejected_evidence'],2)
            self.assertEqual(projection['resources'][-1]['kind'],'concept')
            self.assertEqual(projection['relationships'][0]['evidence'][0]['quote'],'Indexes make reads faster')
            store.activate(snapshot('s2'))
            self.assertFalse(store.status()['semantic_complete'])
    def test_expired_final_attempt_is_terminal(self):
        with tempfile.TemporaryDirectory() as temp:
            store=Store(Path(temp)/'db');store.activate(snapshot());jid=store.new_job({'title':'A'})
            with store.connect() as db: db.execute("update jobs set status='running',attempts=3,updated=0")
            self.assertIsNone(store.claim())
            self.assertEqual(store.job(jid)['status'],'failed')
