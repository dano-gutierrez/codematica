"""Replay migrations and pgTAP in a fresh database; never reset shared Supabase data."""
import os
import pathlib
import subprocess
import sys
import time
root = pathlib.Path(__file__).resolve().parents[2]
container = os.environ.get('INTERVIEW_TEST_CONTAINER', 'supabase_db_codematica')
database = 'interview_validation_' + str(int(time.time()))
evidence = root / '.local/interview-preparation/validation' / database
evidence.mkdir(parents=True, exist_ok=True)
def run(args, source=None):
    return subprocess.run(['docker', 'exec', '-i', container, *args], input=source, text=True, capture_output=True, check=True).stdout
run(['createdb', '-U', 'postgres', '--template=template0', database])
run(['psql', '-U', 'postgres', '-d', database, '-v', 'ON_ERROR_STOP=1'], 'alter database ' + database + ' set search_path = public,extensions;')
# Supabase-managed auth functions/tables are infrastructure, separate from app migrations.
auth = run(['pg_dump', '-U', 'postgres', '-d', 'postgres', '--schema-only', '--no-owner', '--section=pre-data', '--schema=auth'])
bootstrap = auth + '\nalter table auth.users add primary key(id); create schema extensions; create extension pgcrypto with schema extensions; create extension pgtap with schema extensions; grant usage on schema auth,extensions,public to anon,authenticated,service_role; grant all on schema public to authenticated,service_role; alter default privileges for role postgres in schema public grant all on tables to anon,authenticated,service_role; alter default privileges for role postgres in schema public grant all on sequences to anon,authenticated,service_role;\n'
log = ''
try:
    log += run(['psql', '-U', 'postgres', '-d', database, '-v', 'ON_ERROR_STOP=1'], bootstrap)
    for file in sorted((root / 'supabase/migrations').glob('*.sql')):
        log += '\n' + file.name + '\n'
        log += run(['psql', '-U', 'postgres', '-d', database, '-v', 'ON_ERROR_STOP=1'], file.read_text())
    # Run every database regression in transactional isolation.
    for file in sorted((root / 'supabase/tests/database').glob('*.sql')):
        output = run(['psql', '-U', 'postgres', '-d', database, '-v', 'ON_ERROR_STOP=1'], file.read_text())
        log += '\n' + file.name + '\n' + output
        if 'not ok ' in output or 'Looks like you failed' in output:
            raise RuntimeError('pgTAP assertions failed: ' + file.name)
    print('Clean replay and all pgTAP suites passed. Database retained:', database)
except subprocess.CalledProcessError as error:
    log += error.stdout + '\n' + error.stderr
    print(error.stderr, file=sys.stderr)
    raise
finally:
    (evidence / 'database.log').write_text(log)
    print('Evidence:', evidence)
