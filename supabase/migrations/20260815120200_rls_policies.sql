/*
  Row Level Security — se activa en todas las tablas de contenido.
  El frontend nunca es la barrera de seguridad; estas políticas lo son.
*/

-- PROFILES
alter table public.profiles enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  to authenticated using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update
  to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- (No hay policy de insert: el perfil se crea por trigger al registrarse el
-- usuario en auth.users, ver migración de invitación/alta de usuario. No hay
-- policy de delete: se borra en cascada al borrar la cuenta de auth.users,
-- que solo se hace desde el panel de administración de Supabase.)

-- CATEGORIES
alter table public.categories enable row level security;

drop policy if exists categories_select_public on public.categories;
create policy categories_select_public on public.categories for select
  to anon, authenticated using (true);

drop policy if exists categories_insert_editor on public.categories;
create policy categories_insert_editor on public.categories for insert
  to authenticated with check (public.is_editor_or_admin());

drop policy if exists categories_update_editor on public.categories;
create policy categories_update_editor on public.categories for update
  to authenticated using (public.is_editor_or_admin());

drop policy if exists categories_delete_admin on public.categories;
create policy categories_delete_admin on public.categories for delete
  to authenticated using (public.is_admin());

-- AUTHORS
alter table public.authors enable row level security;

drop policy if exists authors_select_public on public.authors;
create policy authors_select_public on public.authors for select
  to anon, authenticated using (true);

drop policy if exists authors_insert_editor on public.authors;
create policy authors_insert_editor on public.authors for insert
  to authenticated with check (public.is_editor_or_admin());

drop policy if exists authors_update_editor on public.authors;
create policy authors_update_editor on public.authors for update
  to authenticated using (public.is_editor_or_admin());

drop policy if exists authors_delete_admin on public.authors;
create policy authors_delete_admin on public.authors for delete
  to authenticated using (public.is_admin());

-- TAGS — cualquier redactor puede crear una etiqueta al vuelo mientras escribe.
alter table public.tags enable row level security;

drop policy if exists tags_select_public on public.tags;
create policy tags_select_public on public.tags for select
  to anon, authenticated using (true);

drop policy if exists tags_insert_auth on public.tags;
create policy tags_insert_auth on public.tags for insert
  to authenticated with check (true);

drop policy if exists tags_update_editor on public.tags;
create policy tags_update_editor on public.tags for update
  to authenticated using (public.is_editor_or_admin());

drop policy if exists tags_delete_admin on public.tags;
create policy tags_delete_admin on public.tags for delete
  to authenticated using (public.is_admin());

-- ARTICLES
alter table public.articles enable row level security;

drop policy if exists articles_select_public on public.articles;
create policy articles_select_public on public.articles for select
  to anon using (status = 'published');

drop policy if exists articles_select_auth on public.articles;
create policy articles_select_auth on public.articles for select
  to authenticated using (
    user_id = auth.uid() or public.is_editor_or_admin() or status = 'published'
  );

drop policy if exists articles_insert_auth on public.articles;
create policy articles_insert_auth on public.articles for insert
  to authenticated with check (user_id = auth.uid());

drop policy if exists articles_update_auth on public.articles;
create policy articles_update_auth on public.articles for update
  to authenticated using (public.can_edit_article(id)) with check (public.can_edit_article(id));

drop policy if exists articles_delete_auth on public.articles;
create policy articles_delete_auth on public.articles for delete
  to authenticated using (public.can_edit_article(id));

-- ARTICLE_TAGS — visibles si el artículo es público o si quien consulta puede
-- editarlo; escritura solo para quien puede editar el artículo.
alter table public.article_tags enable row level security;

drop policy if exists article_tags_select on public.article_tags;
create policy article_tags_select on public.article_tags for select
  to anon, authenticated using (
    exists (
      select 1 from public.articles a
      where a.id = article_id and (a.status = 'published' or public.can_edit_article(a.id))
    )
  );

drop policy if exists article_tags_insert on public.article_tags;
create policy article_tags_insert on public.article_tags for insert
  to authenticated with check (public.can_edit_article(article_id));

drop policy if exists article_tags_delete on public.article_tags;
create policy article_tags_delete on public.article_tags for delete
  to authenticated using (public.can_edit_article(article_id));

-- ARTICLE_REFERENCES — misma regla que article_tags.
alter table public.article_references enable row level security;

drop policy if exists article_references_select on public.article_references;
create policy article_references_select on public.article_references for select
  to anon, authenticated using (
    exists (
      select 1 from public.articles a
      where a.id = article_id and (a.status = 'published' or public.can_edit_article(a.id))
    )
  );

drop policy if exists article_references_insert on public.article_references;
create policy article_references_insert on public.article_references for insert
  to authenticated with check (public.can_edit_article(article_id));

drop policy if exists article_references_update on public.article_references;
create policy article_references_update on public.article_references for update
  to authenticated using (public.can_edit_article(article_id));

drop policy if exists article_references_delete on public.article_references;
create policy article_references_delete on public.article_references for delete
  to authenticated using (public.can_edit_article(article_id));

-- ARTICLE_IMAGES — sin lectura pública: son metadatos de edición, no contenido.
alter table public.article_images enable row level security;

drop policy if exists article_images_select on public.article_images;
create policy article_images_select on public.article_images for select
  to authenticated using (public.can_edit_article(article_id));

drop policy if exists article_images_insert on public.article_images;
create policy article_images_insert on public.article_images for insert
  to authenticated with check (public.can_edit_article(article_id));

drop policy if exists article_images_delete on public.article_images;
create policy article_images_delete on public.article_images for delete
  to authenticated using (public.can_edit_article(article_id));

-- ARTICLE_REVISIONS — sin lectura pública; sin update/delete desde cliente
-- (log de solo lectura una vez escrito; la poda se hace con service_role).
alter table public.article_revisions enable row level security;

drop policy if exists article_revisions_select on public.article_revisions;
create policy article_revisions_select on public.article_revisions for select
  to authenticated using (public.can_edit_article(article_id));

drop policy if exists article_revisions_insert on public.article_revisions;
create policy article_revisions_insert on public.article_revisions for insert
  to authenticated with check (public.can_edit_article(article_id));
