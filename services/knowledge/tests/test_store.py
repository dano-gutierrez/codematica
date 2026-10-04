import tempfile
import unittest
from pathlib import Path
from knowledge.store import Store

def snapshot(identifier="s1", text="Indexes make reads faster", resource_id="document:indexes"):
    return {"id": identifier, "resources": [{"id": resource_id, "title": "Database indexes", "kind": "document", "text": text, "hash": identifier * 32, "sourcePath": "content/knowledge/indexes.md", "visibility": "curriculum", "status": "published", "paths": [], "skills": []}], "relationships": [], "counts": {"document": 1}, "exclusions": []}

class StoreTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.store = Store(Path(self.tmp.name) / "state.sqlite")
    def tearDown(self): self.tmp.cleanup()
    def test_atomic_activation_and_retirement(self):
        self.store.activate(snapshot())
        invalid = snapshot("s2")
        invalid["relationships"] = [{"source": "missing", "target": "document:indexes", "type": "related"}]
        with self.assertRaises(ValueError): self.store.activate(invalid)
        self.assertEqual(self.store.status()["snapshot_id"], "s1")
        self.store.activate(snapshot("s2", resource_id="document:other"))
        self.assertIsNone(self.store.resource("document:indexes"))
        self.assertEqual(self.store.status()["retired"], 1)
    def test_snapshot_identity_cannot_be_reused_for_different_sources(self):
        self.store.activate(snapshot())
        with self.assertRaises(ValueError): self.store.activate(snapshot(text="Changed source under the same identifier"))
        self.assertEqual(self.store.resource("document:indexes")["text"],"Indexes make reads faster")
    def test_expired_local_worker_cannot_complete_a_reclaimed_job(self):
        self.store.activate(snapshot())
        key=self.store.new_job({"title":"Indexes","body":"Proposal body","kind":"document"})
        first=self.store.claim()
        with self.store.connect() as db: db.execute("update jobs set updated=0 where id=?",(key,))
        second=self.store.claim()
        self.assertGreaterEqual(len(first),3)
        with self.assertRaises(ValueError): self.store.finish(key,first[2],{"snapshot_id":"s1","candidate_hash":"a"})
        self.assertEqual(self.store.job(key)["status"],"running")
        self.store.finish(key,second[2],{"snapshot_id":"s1","candidate_hash":"a"})
        self.assertEqual(self.store.job(key)["status"],"succeeded")
    def test_search_and_coverage(self):
        self.store.activate(snapshot())
        self.assertEqual(self.store.search("reads faster")[0]["id"], "document:indexes")
        self.assertFalse(self.store.status()["semantic_complete"])
    def test_topic_terms_beat_long_generic_documents_with_punctuation(self):
        data=snapshot()
        data['resources'][0].update(id='document:neural',title='Neural networks and self-attention',text='Backpropagation and optimization for neural networks.')
        for i in range(80):
            data['resources'].append({**data['resources'][0],'id':f'document:generic-{i}','title':'System architecture overview','text':('A practical guide for understanding the existing learning curriculum and system decisions. '*100)})
        self.store.activate(data)
        query='Understanding neural networks, backpropagation and self-attention. A practical guide for the existing learning curriculum.'
        vectors={r['id']:.60 if r['id']=='document:neural' else .65 for r in data['resources']}
        hits=self.store.search(query,12,vectors=vectors)
        self.assertEqual(hits[0]['id'],'document:neural')
        self.assertEqual(self.store.search('BACKPROPAGATION?')[0]['id'],'document:neural')
        self.assertEqual(self.store.search('   '),[])

    def test_cache_is_bound_to_version_and_sources(self):
        self.store.activate(snapshot())
        self.store.cache_put("k", {"value": 1})
        self.assertEqual(self.store.cache_get("k"), {"value": 1})
        self.assertIsNone(self.store.cache_get("other"))
    def test_approval_rejects_stale_candidate_or_snapshot(self):
        self.store.activate(snapshot())
        report = {"snapshot_id": "s1", "candidate_hash": "a", "relationships": []}
        key = self.store.new_job({"title": "Indexes", "body": "Text", "kind": "document"})
        self.store.finish(key, self.store.claim()[2], report)
        with self.assertRaises(ValueError): self.store.approve(key, "wrong", "s1")
        self.store.activate(snapshot("s2"))
        with self.assertRaises(ValueError): self.store.approve(key, "a", "s1")

if __name__ == "__main__": unittest.main()
