"""Run allowlisted original Markdown Python labs with isolated, inert inputs."""
from pathlib import Path
import re
import subprocess
import sys
from tempfile import TemporaryDirectory
import unittest

ROOT = Path(__file__).resolve().parents[2]


class AuthoredLabs(unittest.TestCase):
    def test_tree_shape_and_cost_contracts(self):
        self.run_lab("content/knowledge/programming/tree-shapes-and-cost-models.md",
                     "shape, ancestor bounds, comparison counts and independent fixtures: passed")

    def test_keypad_dictionary_search(self):
        self.run_lab("content/knowledge/programming/keypad-dictionary-search.md",
                     "closed dictionary, prefix terminals, branch rollback, validation and independent scan: passed")

    def test_progressive_state_history(self):
        self.run_lab("content/knowledge/software-engineering/progressive-state-history.md",
                     "time, rejected state, conserved transfers, retirement and bounded replay: passed")

    def test_array_state_contracts(self):
        self.run_lab("content/knowledge/programming/array-state-invariants.md",
                     "nonempty/ties, unique slots, strict greater, input preservation and bounded oracles: passed")

    def test_rate_window_and_token_contracts(self):
        self.run_lab("content/knowledge/system-design/traffic-rate-contracts.md",
                     "fixed/rolling boundaries, token refill/cap, scopes and invalid clocks: passed")

    def test_webhook_bytes_time_and_retry(self):
        self.run_lab("content/knowledge/system-design/webhook-authenticity-and-replay.md",
                     "raw bytes, signed time, scoped retry, rotation and invalid inputs: passed")

    def test_client_layout_and_data_compatibility(self):
        self.run_lab(
            "content/knowledge/system-design/client-compatibility-contracts.md",
            "fresh, cached, cold-start, unsupported component/data and invalid versions: passed",
        )

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

    def test_routing_signals_and_eligibility(self):
        self.run_lab(
            "content/knowledge/system-design/routing-decision-lab.md",
            "eligibility, capacity normalization, ties and empty pools: passed",
        )

    def test_evidence_bound_session_handoff(self):
        self.run_lab(
            "content/knowledge/ai-engineering/evidence-first-agent-handoffs.md",
            "unchanged, pending, failed, stale candidate/source/model and partial coverage: passed",
        )


if __name__ == "__main__":
    unittest.main()
