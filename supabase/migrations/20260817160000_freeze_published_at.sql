-- `published_at` debe ser la fecha de publicación ORIGINAL de un artículo,
-- no la de su última edición (para eso ya existe `updated_at`, actualizado
-- automáticamente por `tg_articles_bump_version` en cada UPDATE). Hasta
-- ahora, `setArticleStatus` (src/lib/services/articles.admin.ts) reescribía
-- `published_at` en CADA transición a "published", incluida una republicación
-- después de despublicar — lo que desplazaba silenciosamente la fecha que ve
-- el lector, el orden de portada/RSS, y el disparo de aviso por email.
--
-- Se corrige aquí, a nivel de modelo de datos, para que todo lo que ya lee
-- `published_at` (página de artículo, RSS, plantillas de email, ordenación
-- de listados) quede resuelto a la vez, sin parches locales en cada sitio
-- que lo consulta:
--
--   1. Primera vez que un artículo pasa a "published": el propio servidor
--      le pone la fecha (nunca el cliente — evita depender de su reloj).
--   2. Cualquier UPDATE posterior (reenviar a revisión y volver a publicar,
--      archivar, editar contenido...): `published_at` queda exactamente como
--      estaba. Inmutable en cuanto se fija por primera vez.
create or replace function public.tg_articles_freeze_published_at()
returns trigger
language plpgsql
as $$
begin
  if old.published_at is not null then
    new.published_at := old.published_at;
  elsif new.status = 'published' and old.status is distinct from 'published' then
    new.published_at := now();
  else
    new.published_at := old.published_at; -- normalmente null, sin cambios
  end if;
  return new;
end;
$$;

drop trigger if exists articles_freeze_published_at on public.articles;
create trigger articles_freeze_published_at before update on public.articles
  for each row execute function public.tg_articles_freeze_published_at();
