alter table public.kb_documents
  add column if not exists complexity_flow_blocks jsonb not null default '[]'::jsonb;
