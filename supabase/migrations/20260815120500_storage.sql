/*
  Storage — dos buckets públicos en lectura (las imágenes de artículos
  publicados y las fotos de autor son contenido público de la revista),
  con escritura restringida por política sobre storage.objects.

  Convención de rutas:
    article-images/{article_id}/{uuid}.{ext}
    author-photos/{author_id}/{uuid}.{ext}

  El artículo (fila en `articles`) siempre existe ya como borrador antes de
  que se suba la primera imagen — el flujo "Nuevo artículo" crea la fila al
  abrir el editor — así que {article_id} en la ruta siempre es válido y
  `can_edit_article` puede resolverlo.
*/

insert into storage.buckets (id, name, public)
values ('article-images', 'article-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('author-photos', 'author-photos', true)
on conflict (id) do nothing;

-- article-images: solo quien puede editar el artículo de esa carpeta.
drop policy if exists article_images_storage_insert on storage.objects;
create policy article_images_storage_insert on storage.objects for insert
  to authenticated with check (
    bucket_id = 'article-images'
    and public.can_edit_article((storage.foldername(name))[1]::uuid)
  );

drop policy if exists article_images_storage_update on storage.objects;
create policy article_images_storage_update on storage.objects for update
  to authenticated using (
    bucket_id = 'article-images'
    and public.can_edit_article((storage.foldername(name))[1]::uuid)
  );

drop policy if exists article_images_storage_delete on storage.objects;
create policy article_images_storage_delete on storage.objects for delete
  to authenticated using (
    bucket_id = 'article-images'
    and public.can_edit_article((storage.foldername(name))[1]::uuid)
  );

-- author-photos: solo editor/admin.
drop policy if exists author_photos_storage_insert on storage.objects;
create policy author_photos_storage_insert on storage.objects for insert
  to authenticated with check (
    bucket_id = 'author-photos' and public.is_editor_or_admin()
  );

drop policy if exists author_photos_storage_update on storage.objects;
create policy author_photos_storage_update on storage.objects for update
  to authenticated using (
    bucket_id = 'author-photos' and public.is_editor_or_admin()
  );

drop policy if exists author_photos_storage_delete on storage.objects;
create policy author_photos_storage_delete on storage.objects for delete
  to authenticated using (
    bucket_id = 'author-photos' and public.is_editor_or_admin()
  );
