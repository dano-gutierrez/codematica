#!/usr/bin/env python3
"""Bootstrap the isolated runtime; never install into the user's global Python."""
import os,subprocess,sys,shutil
from pathlib import Path
root=Path(__file__).resolve().parents[2]
state=root/'.local/knowledge'
python=state/'python/bin/python'
command=sys.argv[1] if len(sys.argv)>1 else 'status'
if command=='install':
    uv=shutil.which('uv')
    if not uv:
        bootstrap=state/'bootstrap'
        subprocess.run([sys.executable,'-m','venv',str(bootstrap)],check=True)
        subprocess.run([str(bootstrap/'bin/python'),'-m','pip','install','uv==0.12.22'],check=True)
        uv=str(bootstrap/'bin/uv')
    subprocess.run([uv,'venv','--python','3.13',str(state/'python')],cwd=root,check=True)
    subprocess.run([uv,'pip','sync','--python',str(python),str(root/'services/knowledge/requirements.lock')],cwd=root,check=True)
    subprocess.run([str(python),str(root/'services/knowledge/run.py'),'setup'],cwd=root,check=True)
else:
    if not python.exists():sys.exit('Run npm run knowledge -- install first.')
    script='smoke_mcp.py' if command=='smoke' else 'benchmark.py' if command=='benchmark' else 'run.py'
    args=sys.argv[2:] if script!='run.py' else sys.argv[1:]
    os.execv(str(python),[str(python),str(root/'services/knowledge'/script),*args])
