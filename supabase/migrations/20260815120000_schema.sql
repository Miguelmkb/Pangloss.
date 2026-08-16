/*
  Pangloss — esquema principal

  Tablas: profiles, categories, authors, tags, articles, article_tags,
  article_references, article_images, article_revisions.

  Notas de diseño:
  - `articles.content` es jsonb (documento Tiptap). Las imágenes se referencian
    por URL de Supabase Storage, nunca en base64 dentro del documento.
  - `articles.version` se incrementa automáticamente en cada UPDATE (ver
    trigger más abajo) y es la base del control de concurrencia optimista
    del autoguardado: el cliente hace
      UPDATE articles SET ... WHERE id = :id AND version = :expected_version
    Si la fila no se actualiza (0 filas afectadas), otra sesión guardó antes
    y el cliente lo detecta sin sobrescribir nada.
  - `article_images` y `article_revisions` no tienen lectura pública: son
    metadatos internos de edición, no contenido de la revista.
*/

-- PROFILES — extiende auth.users con rol e información de perfil.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'collaborator' check (role in ('admin', 'editor', 'collaborator')),
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CATEGORIES — con parent_id para subcategorías (p. ej. "Spongeonomics" bajo "Economía").
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  color text not null default '#8a8a8a',
  parent_id uuid references public.categories(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- AUTHORS — perfil editorial de firma; puede o no estar vinculado a una cuenta.
create table if not exists public.authors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  slug text not null unique,
  bio text,
  photo_url text,
  areas_of_interest text[],
  links jsonb not null default '[]',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- TAGS
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- ARTICLES — tabla principal.
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_id uuid references public.authors(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  title text not null default '',
  subtitle text,
  slug text unique,
  content jsonb not null default '{}',
  excerpt text,
  featured_image_url text,
  featured_image_alt text,
  featured_image_caption text,
  status text not null default 'draft' check (status in ('draft', 'in_review', 'published', 'archived')),
  featured boolean not null default false,
  reading_time_minutes int not null default 1,
  seo_title text,
  seo_description text,
  version int not null default 1,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ARTICLE_TAGS — tabla puente
create table if not exists public.article_tags (
  article_id uuid not null references public.articles(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

-- ARTICLE_REFERENCES — bibliografía por artículo
create table if not exists public.article_references (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  type text not null default 'other' check (type in ('book', 'article', 'report', 'document', 'website', 'other')),
  title text not null,
  authors text,
  year int,
  publisher text,
  journal text,
  url text,
  pages text,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ARTICLE_IMAGES — registro de cada imagen subida a Storage para un artículo
-- (permite reutilizar y limpiar huérfanos; no es contenido público).
create table if not exists public.article_images (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  storage_path text not null,
  url text not null,
  width int,
  height int,
  alt text,
  created_at timestamptz not null default now()
);

-- ARTICLE_REVISIONS — snapshots periódicos del contenido (autosave grueso,
-- publicación, guardado manual). Red de seguridad adicional, no el mecanismo
-- principal de autoguardado (ese vive en articles.content + articles.version).
create table if not exists public.article_revisions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  content jsonb not null,
  version int not null,
  label text not null default 'autosave' check (label in ('autosave', 'publish', 'manual')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Índices
create index if not exists idx_articles_status on public.articles(status);
create index if not exists idx_articles_slug on public.articles(slug);
create index if not exists idx_articles_published_at on public.articles(published_at desc);
create index if not exists idx_articles_category_id on public.articles(category_id);
create index if not exists idx_articles_author_id on public.articles(author_id);
create index if not exists idx_articles_user_id on public.articles(user_id);
create index if not exists idx_articles_featured on public.articles(featured) where featured = true;
create index if not exists idx_authors_slug on public.authors(slug);
create index if not exists idx_categories_slug on public.categories(slug);
create index if not exists idx_categories_parent_id on public.categories(parent_id);
create index if not exists idx_tags_slug on public.tags(slug);
create index if not exists idx_article_references_article_id on public.article_references(article_id);
create index if not exists idx_article_images_article_id on public.article_images(article_id);
create index if not exists idx_article_revisions_article_id on public.article_revisions(article_id, created_at desc);

-- Trigger genérico de updated_at (profiles, authors)
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.tg_set_updated_at();

drop trigger if exists authors_updated_at on public.authors;
create trigger authors_updated_at before update on public.authors
  for each row execute function public.tg_set_updated_at();

-- Trigger de articles: incrementa version SIEMPRE desde el valor actual en
-- servidor (ignora lo que el cliente intente enviar en ese campo) y refresca
-- updated_at. Es la pieza central del control de concurrencia del autosave.
create or replace function public.tg_articles_bump_version()
returns trigger
language plpgsql
as $$
begin
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists articles_bump_version on public.articles;
create trigger articles_bump_version before update on public.articles
  for each row execute function public.tg_articles_bump_version();
