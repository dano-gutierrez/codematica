create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

create table if not exists public.kb_documents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  track text not null,
  topic text not null,
  difficulty text not null check (difficulty in ('foundation', 'practitioner', 'senior', 'principal')),
  tags text[] not null default '{}',
  prerequisites text[] not null default '{}',
  diagram_refs text[] not null default '{}',
  status text not null check (status in ('draft', 'published', 'planned')),
  source_path text not null,
  markdown text not null,
  plain_text text not null,
  headings jsonb not null default '[]'::jsonb,
  mermaid_blocks jsonb not null default '[]'::jsonb,
  content_hash text not null,
  reading_minutes integer not null check (reading_minutes > 0),
  search_document tsvector not null default ''::tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kb_diagrams (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  source_path text not null,
  source text not null,
  content_hash text not null,
  search_document tsvector not null default ''::tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kb_documents_search_document_idx on public.kb_documents using gin (search_document);
create index if not exists kb_documents_title_trgm_idx on public.kb_documents using gin (title extensions.gin_trgm_ops);
create index if not exists kb_documents_plain_text_trgm_idx on public.kb_documents using gin (plain_text extensions.gin_trgm_ops);
create index if not exists kb_documents_tags_idx on public.kb_documents using gin (tags);
create index if not exists kb_diagrams_search_document_idx on public.kb_diagrams using gin (search_document);
create index if not exists kb_diagrams_title_trgm_idx on public.kb_diagrams using gin (title extensions.gin_trgm_ops);
create index if not exists kb_diagrams_source_trgm_idx on public.kb_diagrams using gin (source extensions.gin_trgm_ops);

alter table public.kb_documents enable row level security;
alter table public.kb_diagrams enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_kb_document_search_document()
returns trigger
language plpgsql
as $$
begin
  new.search_document :=
    setweight(to_tsvector('english'::regconfig, coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english'::regconfig, coalesce(array_to_string(new.tags, ' '), '')), 'A') ||
    setweight(to_tsvector('english'::regconfig, coalesce(new.summary, '')), 'B') ||
    setweight(to_tsvector('english'::regconfig, coalesce(new.track, '') || ' ' || coalesce(new.topic, '')), 'B') ||
    setweight(to_tsvector('english'::regconfig, coalesce(new.plain_text, '')), 'C');

  return new;
end;
$$;

create or replace function public.set_kb_diagram_search_document()
returns trigger
language plpgsql
as $$
begin
  new.search_document :=
    setweight(to_tsvector('english'::regconfig, coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english'::regconfig, coalesce(new.source, '')), 'C');

  return new;
end;
$$;

drop trigger if exists kb_documents_set_search_document on public.kb_documents;
create trigger kb_documents_set_search_document
before insert or update of title, summary, track, topic, tags, plain_text
on public.kb_documents
for each row execute function public.set_kb_document_search_document();

drop trigger if exists kb_diagrams_set_search_document on public.kb_diagrams;
create trigger kb_diagrams_set_search_document
before insert or update of title, source
on public.kb_diagrams
for each row execute function public.set_kb_diagram_search_document();

drop trigger if exists kb_documents_set_updated_at on public.kb_documents;
create trigger kb_documents_set_updated_at
before update on public.kb_documents
for each row execute function public.set_updated_at();

drop trigger if exists kb_diagrams_set_updated_at on public.kb_diagrams;
create trigger kb_diagrams_set_updated_at
before update on public.kb_diagrams
for each row execute function public.set_updated_at();

create or replace function public.search_kb(
  search_query text,
  search_mode text default 'fuzzy',
  result_limit integer default 20
)
returns table (
  kind text,
  slug text,
  title text,
  summary text,
  source_path text,
  rank real
)
language sql
stable
as $$
  with normalized as (
    select trim(search_query) as query
  ),
  document_results as (
    select
      'document'::text as kind,
      d.slug,
      d.title,
      d.summary,
      d.source_path,
      case
        when search_mode = 'fuzzy' then greatest(extensions.similarity(d.title, n.query), extensions.similarity(d.plain_text, n.query))
        else ts_rank(d.search_document, plainto_tsquery('english'::regconfig, n.query))
      end::real as rank
    from public.kb_documents d
    cross join normalized n
    where
      n.query <> ''
      and d.status = 'published'
      and (
        (search_mode = 'fuzzy' and (d.title operator(extensions.%) n.query or d.plain_text operator(extensions.%) n.query))
        or
        (search_mode <> 'fuzzy' and d.search_document @@ plainto_tsquery('english'::regconfig, n.query))
      )
  ),
  diagram_results as (
    select
      'diagram'::text as kind,
      g.slug,
      g.title,
      'Mermaid diagram stored in ' || g.source_path as summary,
      g.source_path,
      case
        when search_mode = 'fuzzy' then greatest(extensions.similarity(g.title, n.query), extensions.similarity(g.source, n.query))
        else ts_rank(g.search_document, plainto_tsquery('english'::regconfig, n.query))
      end::real as rank
    from public.kb_diagrams g
    cross join normalized n
    where
      n.query <> ''
      and (
        (search_mode = 'fuzzy' and (g.title operator(extensions.%) n.query or g.source operator(extensions.%) n.query))
        or
        (search_mode <> 'fuzzy' and g.search_document @@ plainto_tsquery('english'::regconfig, n.query))
      )
  )
  select * from document_results
  union all
  select * from diagram_results
  order by rank desc, title asc
  limit greatest(1, least(result_limit, 100));
$$;
