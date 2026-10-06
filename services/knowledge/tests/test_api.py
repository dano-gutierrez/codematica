import tempfile
import unittest
from pathlib import Path
from fastapi.testclient import TestClient
from knowledge.api import create_app
from knowledge.config import token
from knowledge.store import Store
from test_store import snapshot
from test_evaluate import FakeEmbeddings, FakeModels

class ApiTests(unittest.TestCase):
    def test_candidate_validation_preserves_hash_sensitive_whitespace(self):
        from knowledge.api import Candidate
        value={"title":" Draft ","body":"A complete body.\n\n   ","kind":"post"}
        self.assertEqual(Candidate(**value).model_dump(exclude_none=True),value)
        with self.assertRaises(ValueError): Candidate(**{**value,"body":"             "})
    def test_private_routes_require_token_and_submission_stages_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = Store(Path(tmp) / "db"); store.activate(snapshot())
            client = TestClient(create_app(store, FakeEmbeddings(), FakeModels()))
            self.assertEqual(client.get("/v1/status").status_code, 401)
            auth = {"Authorization": "Bearer " + token()}
            self.assertEqual(client.get("/v1/status", headers=auth).status_code, 200)
            job = client.post("/v1/candidates", headers=auth, json={"title": "Indexes", "body": "Indexes make reads faster"})
            self.assertEqual(job.status_code, 202)
            self.assertEqual(client.get("/v1/evaluations/" + job.json()["id"], headers=auth).json()["status"], "pending")
            self.assertEqual(store.status()["snapshot_id"], "s1")
