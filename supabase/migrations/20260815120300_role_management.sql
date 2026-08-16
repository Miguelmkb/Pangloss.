/*
  Cambiar el rol de un usuario nunca se hace con un UPDATE directo a
  `profiles` desde el cliente (eso permitiría que cualquiera se autoasigne
  admin manipulando la llamada). Se hace a través de esta función
  SECURITY DEFINER, que:
    - solo puede ejecutarla alguien cuyo perfil ya es admin;
    - valida el rol destino;
    - impide que un admin se degrade a sí mismo por error.
*/

create or replace function public.update_user_role(target_user_id uuid, new_role text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.profiles;
begin
  if new_role not in ('admin', 'editor', 'collaborator') then
    raise exception 'Rol no válido: %', new_role;
  end if;

  if not public.is_admin() then
    raise exception 'Solo los administradores pueden cambiar roles';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'No puedes cambiar tu propio rol';
  end if;

  update public.profiles
  set role = new_role
  where id = target_user_id
  returning * into result;

  if not found then
    raise exception 'Usuario no encontrado';
  end if;

  return result;
end;
$$;

revoke execute on function public.update_user_role(uuid, text) from public, anon;
grant execute on function public.update_user_role(uuid, text) to authenticated;
