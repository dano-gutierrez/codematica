begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

select has_table('public', 'kb_documents', 'knowledge documents table exists');
select has_table('public', 'kb_diagrams', 'knowledge diagrams table exists');
select has_table('public', 'user_progress_items', 'progress table exists');
select has_table('public', 'user_skill_progress', 'skill mastery table exists');
select has_index('public', 'kb_documents', 'kb_documents_search_document_idx', 'document search index exists');
select has_index('public', 'user_progress_items', 'user_progress_items_user_seen_idx', 'progress resume index exists');
select has_index('public', 'user_skill_progress', 'user_skill_progress_due_idx', 'due review index exists');
select ok(
  exists(select 1 from pg_constraint where conrelid = 'public.kb_documents'::regclass and conname = 'kb_documents_difficulty_check' and contype = 'c'),
  'document difficulty constraint exists'
);
select ok(
  exists(select 1 from pg_constraint where conrelid = 'public.user_skill_progress'::regclass and conname = 'user_skill_progress_best_score_check' and contype = 'c'),
  'skill score constraint exists'
);

select ok((select relrowsecurity from pg_class where oid = 'public.kb_documents'::regclass), 'content RLS is enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.user_progress_items'::regclass), 'progress RLS is enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.user_skill_progress'::regclass), 'skill RLS is enabled');

insert into public.kb_documents (
  slug, title, summary, track, topic, difficulty, tags, prerequisites, diagram_refs,
  status, source_path, markdown, plain_text, headings, mermaid_blocks, content_hash, reading_minutes
) values
  ('test/cache-guide', 'Cache Guide', 'A published cache guide for deterministic search.', 'System Design', 'Caching', 'senior', array['cache'], '{}', '{}', 'published', 'test/cache.md', '# Cache', 'cache invalidation freshness', '[]', '[]', 'hash-1', 2),
  ('test/draft-guide', 'Draft Cache Guide', 'A draft that must not be returned by search.', 'System Design', 'Caching', 'senior', array['cache'], '{}', '{}', 'draft', 'test/draft.md', '# Draft', 'cache draft', '[]', '[]', 'hash-2', 2);

insert into public.kb_diagrams (slug, title, source_path, source, content_hash)
values ('test/cache-architecture', 'Cache Architecture', 'test/cache.mmd', 'flowchart LR; Client --> Cache', 'diagram-hash-1');

select is((select count(*)::integer from public.search_kb('cache', 'exact', 20) where kind = 'document'), 1, 'exact search returns only published documents');
select is((select title from public.search_kb('cache', 'exact', 20) limit 1), 'Cache Guide', 'exact search returns the expected title');
select is((select count(*)::integer from public.search_kb('', 'exact', 20)), 0, 'blank search is empty');
select is((select count(*)::integer from public.search_kb('cache', 'exact', 0)), 1, 'result limit is clamped to at least one');
select is((select title from public.search_kb('Cache Guide', 'fuzzy', 20) limit 1), 'Cache Guide', 'fuzzy search ranks the closest title first');

insert into public.kb_documents (
  slug, title, summary, track, topic, difficulty, tags, prerequisites, diagram_refs,
  status, source_path, markdown, plain_text, headings, mermaid_blocks, content_hash, reading_minutes
)
select
  'limit/' || n, 'Limit Probe ' || n, 'Limit probe document.', 'Testing', 'Limits', 'foundation',
  array['limit-probe'], '{}', '{}', 'published', 'test/limit-' || n || '.md', '# Limit Probe',
  'limitprobe searchable text', '[]', '[]', 'limit-hash-' || n, 1
from generate_series(1, 105) as n;

select is((select count(*)::integer from public.search_kb('limitprobe', 'exact', 1000)), 100, 'result limit is capped at one hundred');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'one@example.com', '', now(), now());

insert into public.user_progress_items (user_id, surface, slug, status, completed_at)
values ('00000000-0000-0000-0000-000000000001', 'document', 'test/cache-guide', 'completed', now());
update public.user_progress_items set status = 'started', completed_at = null where user_id = '00000000-0000-0000-0000-000000000001';
select is((select status from public.user_progress_items where user_id = '00000000-0000-0000-0000-000000000001'), 'completed', 'completion status cannot regress');
select ok((select completed_at is not null from public.user_progress_items where user_id = '00000000-0000-0000-0000-000000000001'), 'completion timestamp is preserved');

insert into public.user_skill_progress (user_id, path_slug, skill_id, best_score, attempt_count)
values ('00000000-0000-0000-0000-000000000001', 'japanese-foundations', 'kana-reading', 0.9, 3);
update public.user_skill_progress set best_score = 0.2, attempt_count = 1 where user_id = '00000000-0000-0000-0000-000000000001';
select is((select best_score from public.user_skill_progress where user_id = '00000000-0000-0000-0000-000000000001'), 0.9::double precision, 'best skill score is preserved');
select is((select attempt_count from public.user_skill_progress where user_id = '00000000-0000-0000-0000-000000000001'), 3, 'attempt count cannot regress');

select * from finish();
rollback;
