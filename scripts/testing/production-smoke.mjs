// Test the built Next artifact with a clean production-only install, never pruning this workspace.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import process from 'node:process';
import console from 'node:console';
import { setTimeout as delay } from 'node:timers/promises';
const root = resolve(import.meta.dirname, '../..');
const target = await mkdtemp(join(tmpdir(), 'codematica-production-'));
for (const path of ['package.json','package-lock.json','apps/web/package.json','apps/web/next.config.ts','apps/web/.next','apps/web/public','apps/mobile/package.json','packages/core','packages/ui']) {
  await mkdir(join(target,path,'..'),{recursive:true});
  await cp(join(root,path),join(target,path),{recursive:true,filter:(source)=> !source.includes('/node_modules/') && !source.endsWith('/node_modules')});
}
const installLog=join(target,'install.log');
try { const output=execFileSync('npm',['ci','--omit=dev'],{cwd:target,encoding:'utf8',stdio:['ignore','pipe','pipe']}); await writeFile(installLog,output); }
catch(error) { await writeFile(installLog,String(error.stdout)+String(error.stderr)); throw new Error(`Production install failed; evidence: ${installLog}`); }
const require=createRequire(join(target,'package.json'));
for(const dependency of ['next','react','@supabase/supabase-js','zod','@codematica/ui/notebook-session']) assert.ok(require.resolve(dependency));
const manifest=JSON.parse(await readFile(join(target,'apps/web/.next/server/app-paths-manifest.json'),'utf8'));
assert.ok(manifest['/admin/linkedin/page']);
// Both server and client artifacts must keep privileged worker code out of HTTP startup.
for (const file of await readdir(join(target,'apps/web/.next'),{recursive:true})) {
  if (!file.endsWith('.js') || file.startsWith('cache/')) continue;
  const code=await readFile(join(target,'apps/web/.next',file),'utf8');
  assert.ok(!code.includes('linkedin_begin_publish') && !code.includes('SUPABASE_SERVICE_ROLE_KEY') && !code.includes('/v1/systemone') && !code.includes('mlx-community/Qwen'), `Privileged worker code leaked into HTTP artifact: ${file}`);
}
const socket=createServer(); await new Promise(resolve=>socket.listen(0,'127.0.0.1',resolve)); const port=socket.address().port; await new Promise(resolve=>socket.close(resolve));
const server=spawn(process.execPath,[join(target,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{cwd:join(target,'apps/web'),env:{PATH:process.env.PATH,NODE_ENV:'production'},stdio:['ignore','pipe','pipe']});
let output='';server.stdout.on('data',d=>output+=d);server.stderr.on('data',d=>output+=d);
try {
  let ready=false;
  for(let i=0;i<100;i++){try{ready=(await globalThis.fetch(`http://127.0.0.1:${port}/`)).ok;}catch{ /* Server is still starting. */ }if(ready)break;if(server.exitCode!==null)break;await delay(200);}
  assert.ok(ready,'Pruned HTTP artifact must reach readiness');
  for(const path of ['/browse','/admin/linkedin','/languages/japanese/notebooks','/practice/languages/japanese-hiragana-vowels-writing']) assert.equal((await globalThis.fetch(`http://127.0.0.1:${port}${path}`)).status,200);
  console.log(`Production-only artifact reached readiness and served public/admin shells. Evidence retained: ${target}`);
}finally{server.kill('SIGTERM');await writeFile(join(target,'runtime.log'),output);}
