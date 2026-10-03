"""Local-only, resumable routing benchmark. Private reports stay under .local/."""
import asyncio,json,sys,time,statistics,resource,os
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from knowledge.config import STATE, VERSIONS
from knowledge.store import Store, digest
from knowledge.models import Embeddings,LocalModels
from knowledge.evaluate import evaluate
async def main():
    # Hosted credentials are deliberately absent; all transports are loopback only.
    for key in list(os.environ):
        if any(p in key for p in ['OPENAI','ANTHROPIC','CLAUDE','GOOGLE_API','GEMINI']): os.environ.pop(key)
    store=Store(STATE/'state.sqlite');models=LocalModels(store);embeddings=Embeddings(store)
    cases=json.loads(Path(__file__).with_name('evaluation-cases.json').read_text())
    folder=STATE/'benchmark';folder.mkdir(exist_ok=True,mode=0o700)
    rows=[]
    for case in cases:
        candidate=case['candidate'].copy()
        if case.get('source_body'): candidate['body']=store.resource(case['source_body'])['text']
        path=folder/(case['id']+'.json')
        started=time.monotonic()
        identity=digest([store.status()["snapshot_id"],candidate,case,VERSIONS,Path(__file__).with_name("knowledge").joinpath("evaluate.py").read_text()])
        cached=json.loads(path.read_text()) if path.exists() else None
        if cached and cached.get("identity")==identity and "report" in cached: row=cached
        else:
            try:
                report=await evaluate(store,embeddings,models,candidate)
                found={r.get('parentId',r['id']) for r in report['matches']}|{r['id'] for r in report['matches']}
                row={'id':case['id'],'category':case['category'],'report':report,'retrieval_hit':not case['expected_resources'] or bool(found&set(case['expected_resources'])),'decision_correct':report['action'] in case['expected_actions'],'model_correct':report.get('model_action',report['action']) in case['expected_actions'],'abstained':report['action']=='needs_review','rss_bytes':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,'wall_ms':round((time.monotonic()-started)*1000)}
            except Exception as e: row={'id':case['id'],'category':case['category'],'error':type(e).__name__}
            row['identity']=identity
            path.write_text(json.dumps(row));path.chmod(0o600)
        rows.append(row)
        print(json.dumps({'case':case['id'],'action':row.get('report',{}).get('action'),'error':row.get('error'),'elapsed_ms':row.get('wall_ms')}),flush=True)
    success=[r for r in rows if 'report' in r];answered=[r for r in success if not r['abstained']];retrieval=[r for r in success if r['category']!='new_path']
    summary={'cases':len(rows),'succeeded':len(success),'failures':len(rows)-len(success),'retrieval_recall_at_16':sum(r['retrieval_hit'] for r in retrieval)/max(1,len(retrieval)),'answered':len(answered),'decision_errors':sum(not r['decision_correct'] for r in answered),'abstentions':sum(r['abstained'] for r in success),'raw_model_errors':sum(not r['model_correct'] for r in success),'median_latency_ms':statistics.median([r['wall_ms'] for r in success]) if success else None,'peak_process_rss_bytes':max([r['rss_bytes'] for r in success],default=0),'snapshots':list({r['report']['snapshot_id'] for r in success}),'semantic_complete':all(r['report']['semantic_complete'] for r in success),'labels':'40 initial engineering labels; not an independent human-calibrated reliability claim'}
    (folder/'summary.json').write_text(json.dumps(summary,indent=2));print(json.dumps(summary),flush=True)
if __name__=='__main__':asyncio.run(main())
