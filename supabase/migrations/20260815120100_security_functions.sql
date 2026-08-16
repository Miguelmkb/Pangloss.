/*
  Funciones de seguridad — se definen ANTES que las políticas RLS para evitar
  el problema de recursión que ya se detectó y corrigió en la versión Bolt
  anterior: una política de `profiles` que consulta `profiles` directamente
  provoca un ciclo. Aquí una función SECURITY DEFINER con search_path fijo
  hace la comprobación una sola vez, sin recursión, y el EXECUTE se revoca de
  PUBLIC para que nadie pueda usarla fuera de las políticas de este esquema.
*/

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_editor_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'editor')
  );
$$;

-- Un colaborador puede editar su propio artículo solo mientras está en
-- borrador o en revisión; un editor/admin puede editar cualquier artículo
-- en cualquier estado (incluida la despublicación).
create or replace function public.can_edit_article(target_article_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_editor_or_admin() or exists (
    select 1 from public.articles
    where id = target_article_id
      and user_id = auth.uid()
      and status in ('draft', 'in_review')
  );
$$;

revoke execute on function public.is_admin() from public;
revoke execute on function public.is_editor_or_admin() from public;
revoke execute on function public.can_edit_article(uuid) from public;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_editor_or_admin() to anon, authenticated;
grant execute on function public.can_edit_article(uuid) to anon, authenticated;
