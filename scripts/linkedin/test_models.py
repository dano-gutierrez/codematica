"""Lifecycle safety tests use only temporary files and an inert child process."""
import importlib.util
import json
import os
from pathlib import Path
import signal
import socket
import sys
import tempfile
import time
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("editorial_models", Path(__file__).with_name("models.py"))
models = importlib.util.module_from_spec(spec)
spec.loader.exec_module(models)


class ModelsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.runtime = patch.object(models, "RUNTIME", Path(self.temp.name))
        self.runtime.start()

    def tearDown(self):
        self.runtime.stop()
        self.temp.cleanup()

    def test_stale_pid_is_never_owned(self):
        self.assertIsNone(models.owned("writer"))
        models.save(models.RUNTIME / "writer.json", {"pid": os.getpid(), "started": "another process"})
        self.assertIsNone(models.owned("writer"))
        self.assertEqual((models.RUNTIME / "writer.json").stat().st_mode & 0o777, 0o600)

    def test_occupied_port_is_not_taken_over(self):
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            with patch.dict(models.PORTS, writer=sock.getsockname()[1]), patch.object(models.subprocess, "Popen") as spawn:
                with self.assertRaisesRegex(SystemExit, "already occupied"):
                    models.launch("writer", ["never-execute"])
                spawn.assert_not_called()

    def test_manual_launch_is_owned_and_does_not_inherit_service_credentials(self):
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            port = sock.getsockname()[1]
        with patch.dict(models.PORTS, writer=port), patch.dict(os.environ, SUPABASE_SERVICE_ROLE_KEY="synthetic-test-secret"):
            code = 'import json,os,time; print(json.dumps({"offline":os.getenv("HF_HUB_OFFLINE"),"secret":os.getenv("SUPABASE_SERVICE_ROLE_KEY")}),flush=True); time.sleep(15)'
            process = models.launch("writer", [sys.executable, "-u", "-c", code])
            record = json.loads((models.RUNTIME / "writer.json").read_text())
            try:
                self.assertEqual(models.owned("writer"), record["pid"])
                for _ in range(40):
                    text = (models.RUNTIME / "writer.log").read_text()
                    if text:
                        break
                    time.sleep(0.05)
                self.assertEqual(json.loads(text), {"offline": "1", "secret": None})
            finally:
                os.kill(record["pid"], signal.SIGTERM)
                process.wait(timeout=5)


if __name__ == "__main__":
    unittest.main()
