"""Real stdio integration check; reads local data and stages one inert candidate."""
import asyncio,json,sys
from pathlib import Path
from mcp import ClientSession,StdioServerParameters
from mcp.client.stdio import stdio_client
from knowledge.config import STATE

def parameters():
    # The MCP SDK inherits a limited environment. Bind the child to the same
    # private token directory as this operator-selected runtime explicitly.
    return StdioServerParameters(command=sys.executable,args=[str(Path(__file__).with_name('mcp_server.py'))],env={"KNOWLEDGE_STATE": str(STATE)})

async def main():
    server=parameters()
    async with stdio_client(server) as (read,write):
        async with ClientSession(read,write) as session:
            await session.initialize()
            names=[t.name for t in (await session.list_tools()).tools]
            assert set(names)=={'search_knowledge','get_resource','get_relationships','evaluate_candidate','get_evaluation'}
            resource=await session.call_tool('get_resource',{'identifier':'document:databases/index-fundamentals'})
            assert not resource.isError
            neighbors=await session.call_tool('get_relationships',{'identifier':'document:databases/index-fundamentals'})
            assert not neighbors.isError
            search=await session.call_tool('search_knowledge',{'query':'PostgreSQL indexes write overhead','limit':3})
            assert not search.isError
            staged=await session.call_tool('evaluate_candidate',{'title':'MCP smoke — review only','body':'Indexes can improve read speed and add write overhead.','kind':'document'})
            assert not staged.isError
            result=staged.structuredContent or json.loads(staged.content[0].text)
            status=await session.call_tool('get_evaluation',{'identifier':result['id']})
            assert not status.isError
            print(json.dumps({'tools':names,'search':True,'resource':True,'neighbors':True,'staged_job':result['id']}))
if __name__=='__main__':asyncio.run(main())
