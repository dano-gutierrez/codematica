import argparse
import asyncio
import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock,patch
from knowledge import cli
from test_store import snapshot
class IndexExitTests(unittest.TestCase):
    def test_failed_full_extraction_exits_unsuccessfully_but_bounded_pilot_is_allowed(self):
        with tempfile.TemporaryDirectory() as temp:
            state=Path(temp);file=state/'catalog.json';file.write_text(json.dumps(snapshot()))
            graph=type('Graph',(),{'project':AsyncMock(),'extract_batch':AsyncMock(side_effect=ValueError('bad local extraction')),'close':AsyncMock()})()
            with patch.object(cli,'STATE',state),patch('knowledge.models.Embeddings'),patch('knowledge.graph.GraphBackend',return_value=graph),contextlib.redirect_stdout(io.StringIO()):
                with self.assertRaisesRegex(SystemExit,'incomplete'):asyncio.run(cli.index(argparse.Namespace(file=str(file),extract=True,limit=None)))
                graph.close.assert_awaited_once()
                asyncio.run(cli.index(argparse.Namespace(file=str(file),extract=True,limit=1)))
                asyncio.run(cli.index(argparse.Namespace(file=str(file),extract=False,limit=None)))
                self.assertEqual(graph.close.await_count,3)
                self.assertEqual(graph.extract_batch.await_count,2)
