"""Run the two original Markdown Python labs with isolated, inert inputs."""
from pathlib import Path
import re
import subprocess
import sys
from tempfile import TemporaryDirectory
import unittest

ROOT = Path(__file__).resolve().parents[2]


class AuthoredLabs(unittest.TestCase):
    def run_lab(self, relative_path, expected):
        document = (ROOT / relative_path).read_text()
        blocks = re.findall(r"^```python\n(.*?)^```$", document, re.MULTILINE | re.DOTALL)
        self.assertEqual(len(blocks), 1, relative_path)
        with TemporaryDirectory() as directory:
            result = subprocess.run(
                [sys.executable, "-I", "-W", "error::ResourceWarning", "-c", blocks[0]],
                cwd=directory, env={}, text=True, capture_output=True, timeout=15,
            )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stderr, "", "The inert lab must close resources without ignored destructor errors.")
        self.assertIn(expected, result.stdout)

    def test_neural_gradient_and_descent(self):
        self.run_lab("content/knowledge/ml-systems/neural-computation.md", "maximum gradient error:")

    def test_atomic_receipt_and_crash_boundaries(self):
        self.run_lab(
            "content/knowledge/software-engineering/product-interview-durable-generation-architecture.md",
            "concurrent retry, rollback, lost response, request conflict and tenant scope: passed",
        )


if __name__ == "__main__":
    unittest.main()
