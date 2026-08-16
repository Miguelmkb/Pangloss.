/*
  El panel de Usuarios necesita mostrar el email de cada cuenta. `profiles`
  no lo tenía a propósito (evitar duplicar auth.users) pero el esquema
  `auth` no es accesible por PostgREST desde el cliente, así que no hay
  forma de listar usuarios con su email sin esta copia. Se mantiene en
  sincronía por trigger, nunca editable a mano desde el cliente.
*/

alter table public.profiles add column if not exists email text;

-- Rellenar los perfiles que ya existan (tu cuenta admin, si la creaste antes de esto).
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- A partir de ahora, guardar el email también al crear el perfil.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'collaborator'),
    new.email
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
