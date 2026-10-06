import { validateCss } from "./sandbox";
import type { GridScenario, SqlScenario } from "./schema";
const escapeJson = (value: unknown) =>
  JSON.stringify(value).replaceAll("<", "\\u003c");
/** A self-contained, network-free document used by sandboxed iframe and native WebView. */
export function gameSandboxHtml(
  scenario: GridScenario | SqlScenario,
  source: string,
  workerSource: string,
  nonce: string,
) {
  const validation =
    scenario.kind === "grid" ? validateCss(source) : { ok: true };
  const payload = escapeJson({
    scenario,
    source,
    workerSource,
    nonce,
    validation,
  });
  return `<!doctype html><html lang="en"><head><title>Challenge preview</title><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline' 'wasm-unsafe-eval'; worker-src blob:;"><style>body{margin:0;font:14px system-ui;color:#163d38;background:#edf4e9}#preview{padding:12px;overflow:auto}.board{position:relative;display:grid;margin:0 auto 12px;gap:0;background:#d7e7ca;border:1px solid #557965}.cell{box-sizing:border-box;border:1px solid #91ae8c;min-height:42px;display:grid;place-items:center}.net,.target{pointer-events:none;z-index:2;border:3px solid #c98728;background:#f9ca5860;box-sizing:border-box}.target{border:3px dashed #326658;background:#32665818;z-index:1}.safe{background:#f4dbcf}pre{white-space:pre-wrap;font:13px monospace;padding:12px}.sr-only{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%)}#preview:focus-visible{outline:3px solid #326658;outline-offset:-3px}</style></head><body><main aria-label="Challenge preview"><h1 class="sr-only">Challenge preview</h1><div id="preview" role="group" aria-label="Challenge output" tabindex="0"></div></main><script>
const data=${payload};
const send=result=>{const message={channel:'codematica-game',nonce:data.nonce,result};if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(message));else window.parent.postMessage(message,'*');};
const error=message=>send({passed:false,reasons:[message],events:[]});
if(!data.validation.ok){error(data.validation.error);}else if(data.scenario.kind==='sql'){
 const blob=new Blob([data.workerSource],{type:'text/javascript'}),url=URL.createObjectURL(blob);const worker=new Worker(url);
 let settled=false;
 const finish=(result,render=false)=>{if(settled)return;settled=true;clearTimeout(timer);worker.terminate();URL.revokeObjectURL(url);if(render){const p=document.createElement('pre');p.textContent=result.columns?result.columns.join(' | ')+'\\n'+result.rows.map(r=>r.join(' | ')).join('\\n'):result.reasons.join('\\n');document.getElementById('preview').appendChild(p);}send(result);};
 const fail=message=>finish({passed:false,reasons:[message],events:[]});
 const timer=setTimeout(()=>fail('The local SQL runner took too long. Retry your query.'),2000);
 worker.onmessage=e=>finish(e.data,true);
 worker.onerror=()=>fail('The local SQL runner could not start. Retry this level.');worker.postMessage({scenario:data.scenario,source:data.source});
}else{
 const s=data.scenario,boards=[];
 for(const width of s.widths){const board=document.createElement('div');board.className='board';board.style.width=width+'px';board.style.gridTemplateColumns=s.template;board.style.gridTemplateRows='repeat('+s.rows+',42px)';
 for(let i=0;i<s.rows*s.columns;i++){const cell=document.createElement('div');cell.className='cell'+(s.forbidden.includes(i)?' safe':'');cell.textContent=s.forbidden.includes(i)?'SAFE':String(i%s.columns+1);cell.style.gridColumn=(i%s.columns+1)+' / span 1';cell.style.gridRow=(Math.floor(i/s.columns)+1)+' / span 1';board.appendChild(cell);}
 const target=document.createElement('div');target.className='target';target.style.gridColumn=s.target.column+' / span '+s.target.columnSpan;target.style.gridRow=s.target.row+' / span '+s.target.rowSpan;board.appendChild(target);
 const net=document.createElement('div');net.className='net';net.style.gridColumn='1 / 2';net.style.gridRow='1 / 2';
 const style=document.createElement('div').style;style.cssText=data.source;for(const property of style){if(property==='grid-template-columns')board.style.setProperty(property,style.getPropertyValue(property));else net.style.setProperty(property,style.getPropertyValue(property));}
 board.appendChild(net);document.getElementById('preview').appendChild(board);boards.push({board,target,net,width});}
 (()=>{const reasons=[];for(const {board,target,net,width} of boards){const a=net.getBoundingClientRect(),b=target.getBoundingClientRect();if(['x','y','width','height'].some(k=>Math.abs(a[k]-b[k])>1))reasons.push('At '+width+'px, the net does not cover exactly the target cells.');
 for(const cell of board.querySelectorAll('.safe')){const r=cell.getBoundingClientRect();if(a.left<r.right-1&&a.right>r.left+1&&a.top<r.bottom-1&&a.bottom>r.top+1)reasons.push('The net covers a survivor tile.');}
 const columns=getComputedStyle(board).gridTemplateColumns.split(' ').map(parseFloat),total=columns.reduce((a,b)=>a+b,0);if(columns.length!==s.columns||columns.some(w=>!Number.isFinite(w)||w<6)||Math.abs(total-width)>1)reasons.push('At '+width+'px, keep all grid tracks visible within the container.');
 if(s.expectedColumnFractions){const sum=s.expectedColumnFractions.reduce((a,b)=>a+b,0);if(columns.length!==s.expectedColumnFractions.length||columns.some((w,i)=>Math.abs(w/total-s.expectedColumnFractions[i]/sum)>.01))reasons.push('Column proportions do not match the objective at '+width+'px.');}}
 send({passed:reasons.length===0,reasons:[...new Set(reasons)],events:boards.map(b=>'Checked actual CSS layout at '+b.width+'px.')});})();
}
</script></body></html>`;
}
