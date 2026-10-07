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
    def test_private_preparation_is_extractable_but_requires_authenticated_api_access(self):
        from knowledge.store import extraction_resources
        with tempfile.TemporaryDirectory() as tmp:
            store = Store(Path(tmp) / "db")
            data = snapshot()
            private = {**data["resources"][0], "id": "interview-preparation:fixture", "kind": "interview-preparation",
                       "title": "Synthetic private preparation", "text": "Private synthetic study material", "visibility": "private"}
            data["resources"].append(private)
            store.activate(data)
            self.assertIn(private, extraction_resources(data))
            client = TestClient(create_app(store, FakeEmbeddings(), FakeModels()))
            path = "/v1/resources/" + private["id"]
            self.assertEqual(client.get(path).status_code, 401)
            candidate = {"title": private["title"], "body": private["text"], "kind": private["kind"], "existingId": private["id"]}
            self.assertEqual(client.post("/v1/candidates", json=candidate).status_code, 401)
            auth = {"Authorization": "Bearer " + token()}
            self.assertEqual(client.get(path, headers=auth).json()["visibility"], "private")
            job = client.post("/v1/candidates", headers=auth, json=candidate)
            self.assertEqual(job.status_code, 202)
            self.assertEqual(store.job(job.json()["id"])["candidate"], candidate)
            self.assertEqual(store.resource("document:indexes")["id"], "document:indexes")
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
