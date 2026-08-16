/*
  Al crear una cuenta en auth.users (por invitación desde el panel de
  Supabase, o desde el flujo de invitación propio que se construye en la
  Fase 5), se crea automáticamente su fila en profiles. Rol por defecto:
  collaborator — los roles privilegiados se asignan a mano después, nunca
  por defecto.
*/

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'collaborator')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
