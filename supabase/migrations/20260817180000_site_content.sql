-- CMS editorial: hace editable desde /admin/contenido (solo administradores)
-- el texto público de Pangloss que hoy vive hardcodeado en el código —
-- navegación, portada, footer, Sobre, Colabora, suscripción, estados vacíos
-- y de error, 404. El catálogo de qué claves existen, su etiqueta humana,
-- descripción y VALOR POR DEFECTO (el texto actual, tal cual) vive en
-- código (src/lib/siteContent/manifest.ts) — versionado y revisado como
-- cualquier otro cambio. Esta tabla solo guarda las claves que un admin ha
-- decidido cambiar respecto a ese valor por defecto: si una clave no tiene
-- fila aquí, el sitio usa el valor por defecto del manifiesto, así que la
-- web nunca se rompe por faltar una entrada.
create table if not exists public.site_content (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.site_content enable row level security;

-- Lectura pública: el sitio público (anon) necesita poder leer estos
-- textos para renderizarse.
drop policy if exists site_content_select_public on public.site_content;
create policy site_content_select_public on public.site_content for select
  to anon, authenticated using (true);

-- Escritura solo para administradores — ni editores ni colaboradores, aunque
-- tengan sesión iniciada. Coherente con el resto de RLS del proyecto
-- (is_admin(), ya usado en usuarios/configuración).
drop policy if exists site_content_insert_admin on public.site_content;
create policy site_content_insert_admin on public.site_content for insert
  to authenticated with check (public.is_admin());

drop policy if exists site_content_update_admin on public.site_content;
create policy site_content_update_admin on public.site_content for update
  to authenticated using (public.is_admin());

drop policy if exists site_content_delete_admin on public.site_content;
create policy site_content_delete_admin on public.site_content for delete
  to authenticated using (public.is_admin());

-- updated_at / updated_by los pone el servidor siempre, nunca el cliente
-- (igual que el patrón ya usado en tg_articles_bump_version).
create or replace function public.tg_site_content_stamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists site_content_stamp on public.site_content;
create trigger site_content_stamp before insert or update on public.site_content
  for each row execute function public.tg_site_content_stamp();
