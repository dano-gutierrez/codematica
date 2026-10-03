import tempfile
import unittest
from pathlib import Path
from knowledge.config import loopback
from knowledge.store import Store
from knowledge.evaluate import evaluate
from test_store import snapshot

class FakeEmbeddings:
    def similarities(self, query): return {"document:indexes": .9}
class FakeModels:
    cache_hits = 0
    versions = {"judge": "test", "writer": "test"}
    async def ready(self): return self.versions
    async def decide(self, state, questions):
        return {key: {"choice": "create_path" if key == "action" else "related", "probabilities": {"create_path": .95, "related": .95}} for key in questions}
    async def explain(self, evidence): return {"explanation": "Compare the cited source."}

class EvaluationTests(unittest.IsolatedAsyncioTestCase):
    async def test_readiness_timestamps_do_not_invalidate_cache_but_model_ids_do(self):
        from knowledge.models import LocalModels
        with tempfile.TemporaryDirectory() as tmp:
            models=LocalModels(Store(Path(tmp)/'db'));current={'id':'writer','created':1};runs=[]
            async def call(origin,path,body=None):
                if path=='/v1/models':
                    rows=[current.copy(),{'id':'auxiliary','created':current['created']}]
                    return {'data':rows[::-1] if current['created']==2 else rows}
                if path=='/v1/version':return {'version':'judge-v1'}
                return {}
            async def run():runs.append(True);return {'answer':'cached'}
            models.call=call
            await models.ready();await models.cached('test',{'candidate':'unchanged'},run)
            current['created']=2
            await models.ready();await models.cached('test',{'candidate':'unchanged'},run)
            self.assertEqual(len(runs),1)
            current['id']='different-writer'
            await models.ready();await models.cached('test',{'candidate':'unchanged'},run)
            self.assertEqual(len(runs),2)

    async def test_invalid_writer_inventory_cannot_become_a_cache_version(self):
        from knowledge.models import LocalModels
        for inventory in [None,[],[{}],[{'id':' '}],[123]]:
            with self.subTest(inventory=inventory),tempfile.TemporaryDirectory() as tmp:
                models=LocalModels(Store(Path(tmp)/'db'))
                async def call(origin,path,body=None):return {'data':inventory} if path=='/v1/models' else {}
                models.call=call
                with self.assertRaises(ValueError):await models.ready()

    async def test_incomplete_graph_cannot_establish_novelty(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = Store(Path(tmp) / "db"); store.activate(snapshot())
            report = await evaluate(store, FakeEmbeddings(), FakeModels(), {"title": "Fast indexes", "body": "Indexes improve read speed but cost writes", "kind": "document"})
            self.assertEqual(report["action"], "needs_review")
            self.assertEqual(report["matches"][0]["id"], "document:indexes")
    async def test_exact_duplicate_does_not_require_semantic_completion(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = Store(Path(tmp) / "db"); store.activate(snapshot())
            report = await evaluate(store, FakeEmbeddings(), FakeModels(), {"title": "Indexes", "body": "Indexes make reads faster", "kind": "document"})
            self.assertEqual(report["action"], "skip_duplicate")
    async def test_exact_text_for_a_different_level_or_audience_is_not_interchangeable(self):
        from unittest.mock import patch
        for field in ['difficulty','audience']:
            with self.subTest(field=field),tempfile.TemporaryDirectory() as tmp:
                store=Store(Path(tmp)/'db');data=snapshot();data['resources'][0][field]='beginner';store.activate(data)
                with patch.object(store,'status',return_value={**store.status(),'semantic_complete':True}):
                    report=await evaluate(store,FakeEmbeddings(),FakeModels(),{'title':'Indexes','body':'Indexes make reads faster','kind':'document',field:'advanced'})
                self.assertNotEqual(report['action'],'skip_duplicate')
    async def test_case_sensitive_code_is_not_an_exact_duplicate(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = Store(Path(tmp) / "db"); store.activate(snapshot(text="Call getID() to retrieve an ID"))
            report = await evaluate(store, FakeEmbeddings(), FakeModels(), {"title": "Code", "body": "Call getId() to retrieve an ID", "kind": "document"})
            self.assertNotEqual(report["action"], "skip_duplicate")
    async def test_significant_whitespace_is_not_an_exact_match_or_canonical_source(self):
        source='if ready:\n    send()\naudit()'
        changed='if ready:\n    send()\n    audit()'
        with tempfile.TemporaryDirectory() as tmp:
            store=Store(Path(tmp)/'db');data=snapshot(text=source)
            data['resources'].append({**data['resources'][0],'id':'document:audit','text':'Read audit() output','hash':'other'})
            store.activate(data)
            candidate={'title':'Control flow','body':changed,'kind':'document'}
            report=await evaluate(store,FakeEmbeddings(),FakeModels(),candidate)
            self.assertNotEqual(report['action'],'skip_duplicate')
            edited=await evaluate(store,FakeEmbeddings(),FakeModels(),{**candidate,'existingId':'document:indexes'})
            self.assertTrue(edited['relationships'])
            self.assertTrue(all(edge['source'].startswith('candidate:') for edge in edited['relationships']))
    async def test_python_and_editorial_helper_share_one_os_inference_lock(self):
        import asyncio, sys
        from unittest.mock import patch
        import knowledge.models as module
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/"shared.lock"
            helper=Path(__file__).resolve().parents[3]/"scripts/linkedin/inference-lock.py"
            process=await asyncio.create_subprocess_exec(sys.executable,str(helper),str(path),stdin=asyncio.subprocess.PIPE,stdout=asyncio.subprocess.PIPE)
            self.assertEqual(await process.stdout.readline(),b"ready\n")
            acquired=asyncio.Event()
            async def acquire():
                async with module.inference_lock(): acquired.set()
            with patch.object(module,"INFERENCE_LOCK_PATH",path):
                pending=asyncio.create_task(acquire())
                await asyncio.sleep(.05);self.assertFalse(acquired.is_set())
                process.stdin.close();await process.wait()
                await asyncio.wait_for(pending,2);self.assertTrue(acquired.is_set())
    async def test_truncated_candidate_requires_review_even_with_complete_coverage(self):
        from unittest.mock import patch
        with tempfile.TemporaryDirectory() as tmp:
            store=Store(Path(tmp)/"db");store.activate(snapshot())
            status={**store.status(),"semantic_complete":True}
            with patch.object(store,"status",return_value=status):
                report=await evaluate(store,FakeEmbeddings(),FakeModels(),{"title":"Long proposal","body":"New material "*1100,"kind":"document"})
            self.assertEqual(report["action"],"needs_review")
            self.assertTrue(any("truncated" in warning for warning in report["warnings"]))
    async def test_invalid_explanation_requires_review_even_when_decision_is_confident(self):
        from unittest.mock import patch
        models=FakeModels()
        async def invalid(_): raise ValueError("Malformed explanation")
        models.explain=invalid
        with tempfile.TemporaryDirectory() as tmp:
            store=Store(Path(tmp)/"db");store.activate(snapshot())
            with patch.object(store,"status",return_value={**store.status(),"semantic_complete":True}):
                report=await evaluate(store,FakeEmbeddings(),models,{"title":"New content","body":"A coherent distinct subject","kind":"document"})
            self.assertEqual(report["action"],"needs_review")
            self.assertTrue(any("invalid" in warning for warning in report["warnings"]))
    def test_embedding_cache_invalidates_changed_titles(self):
        from knowledge.models import Embeddings
        with tempfile.TemporaryDirectory() as tmp:
            store=Store(Path(tmp)/"db");embeddings=Embeddings(store);calls=[]
            def encode(text):calls.append(text);return [float(len(text))]
            embeddings.encode=encode
            item=snapshot()["resources"][0]
            embeddings.for_resource(item);embeddings.for_resource(item)
            self.assertEqual(len(calls),1)
            embeddings.for_resource({**item,"title":"Different title"})
            self.assertEqual(len(calls),2)
    def test_hosted_and_redirect_style_endpoints_rejected(self):
        for url in ["https://api.openai.com", "http://localhost:80", "http://127.0.0.1:80/path", "http://user@127.0.0.1", "http://127.0.0.1?redirect=remote"]:
            with self.assertRaises(ValueError): loopback(url)
        self.assertEqual(loopback("http://127.0.0.1:8791/"), "http://127.0.0.1:8791")

if __name__ == "__main__": unittest.main()
