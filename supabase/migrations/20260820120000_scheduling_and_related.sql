-- =====================================================================
-- 1) PUBLICACIÓN PROGRAMADA
-- =====================================================================
-- No hace falta una columna nueva para "programado para": `published_at`
-- ya significa "el momento en que este artículo está o estuvo disponible"
-- — programar es simplemente poner ahí una fecha futura con status
-- 'scheduled' en vez de 'published'. Menos columnas, menos ambigüedad
-- sobre cuál manda.
alter table public.articles drop constraint if exists articles_status_check;
alter table public.articles add constraint articles_status_check
  check (status in ('draft', 'in_review', 'scheduled', 'published', 'archived'));

-- Único punto de verdad para "¿este artículo es visible para un lector
-- ahora mismo?" — evita repetir la misma condición status/fecha en cada
-- policy (aquí) y en cada consulta pública (articles.public.ts).
create or replace function public.article_is_live(p_status text, p_published_at timestamptz)
returns boolean
language sql
stable
as $$
  select p_status = 'published'
    or (p_status = 'scheduled' and p_published_at is not null and p_published_at <= now());
$$;

-- Reemplaza al trigger de la migración 20260817160000: mismo espíritu
-- (una fecha de publicación real nunca se pisa sola), pero ahora distingue
-- entre "ya publicado de verdad" (inmutable, como antes) y "programado"
-- (reprogramable — el propio editor puede seguir cambiando la fecha
-- mientras no se haya publicado de verdad). El planificador
-- (`publish-scheduled.ts`, Netlify Scheduled Function) hace
-- `update articles set status = 'published' where ...` SIN tocar
-- `published_at`: como no vale en el UPDATE, Postgres conserva sola la
-- fecha que ya tenía — la que el editor programó —, así que el artículo
-- pasa a "published" con la fecha ORIGINAL programada, no con el momento
-- en que el planificador pasó a comprobarlo.
create or replace function public.tg_articles_freeze_published_at()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'published' and old.published_at is not null then
    new.published_at := old.published_at;
    return new;
  end if;

  if new.status = 'published' and old.status is distinct from 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  return new;
end;
$$;

-- Visibilidad pública: "published" o "scheduled" cuya fecha ya ha llegado
-- — antes de esa fecha, exactamente igual de invisible que un borrador,
-- tanto por RLS (aquí) como por los filtros de cada consulta pública.
drop policy if exists articles_select_public on public.articles;
create policy articles_select_public on public.articles for select
  to anon using (public.article_is_live(status, published_at));

drop policy if exists articles_select_auth on public.articles;
create policy articles_select_auth on public.articles for select
  to authenticated using (
    user_id = auth.uid() or public.is_editor_or_admin() or public.article_is_live(status, published_at)
  );

drop policy if exists article_tags_select on public.article_tags;
create policy article_tags_select on public.article_tags for select
  to anon, authenticated using (
    exists (
      select 1 from public.articles a
      where a.id = article_id and (public.article_is_live(a.status, a.published_at) or public.can_edit_article(a.id))
    )
  );

drop policy if exists article_references_select on public.article_references;
create policy article_references_select on public.article_references for select
  to anon, authenticated using (
    exists (
      select 1 from public.articles a
      where a.id = article_id and (public.article_is_live(a.status, a.published_at) or public.can_edit_article(a.id))
    )
  );

-- =====================================================================
-- 2) ARTÍCULOS RELACIONADOS (hasta 3, ordenados) — sustituye a la
--    recomendación única de la migración 20260818200000.
-- =====================================================================
alter table public.articles drop column if exists recommended_article_id;

create table if not exists public.article_related (
  article_id uuid not null references public.articles(id) on delete cascade,
  related_article_id uuid not null references public.articles(id) on delete cascade,
  sort_order int not null default 0,
  primary key (article_id, related_article_id),
  check (article_id <> related_article_id)
);
create index if not exists idx_article_related_article on public.article_related(article_id, sort_order);

alter table public.article_related enable row level security;

-- Mismo criterio que tags/referencias: visible si el artículo relacionado
-- (el destino, no el que lo lista) está realmente disponible, o si quien
-- consulta puede editar el artículo de origen (para verlo en el editor
-- aunque el destino todavía sea un borrador).
drop policy if exists article_related_select on public.article_related;
create policy article_related_select on public.article_related for select
  to anon, authenticated using (
    exists (
      select 1 from public.articles r
      where r.id = related_article_id and public.article_is_live(r.status, r.published_at)
    )
    or public.can_edit_article(article_id)
  );

drop policy if exists article_related_insert on public.article_related;
create policy article_related_insert on public.article_related for insert
  to authenticated with check (public.can_edit_article(article_id));

drop policy if exists article_related_update on public.article_related;
create policy article_related_update on public.article_related for update
  to authenticated using (public.can_edit_article(article_id)) with check (public.can_edit_article(article_id));

drop policy if exists article_related_delete on public.article_related;
create policy article_related_delete on public.article_related for delete
  to authenticated using (public.can_edit_article(article_id));
