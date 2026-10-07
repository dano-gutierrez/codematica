import os
import unittest
from pathlib import Path
from unittest.mock import patch
import smoke_mcp

class McpSmokeProcessTests(unittest.TestCase):
    def test_child_uses_the_selected_private_state_without_hosted_credentials(self):
        with patch.object(smoke_mcp, 'STATE', Path('/tmp/private-state-with-spaces 42')), patch.dict(os.environ, {'OPENAI_API_KEY':'synthetic-never-forward','ANTHROPIC_API_KEY':'synthetic-never-forward','SUPABASE_SERVICE_ROLE_KEY':'synthetic-never-forward'}):
            parameters=smoke_mcp.parameters()
        self.assertEqual(parameters.env, {'KNOWLEDGE_STATE':'/tmp/private-state-with-spaces 42'})
        self.assertEqual(parameters.command, smoke_mcp.sys.executable)
        self.assertEqual(parameters.args, [str(Path(smoke_mcp.__file__).with_name('mcp_server.py'))])
