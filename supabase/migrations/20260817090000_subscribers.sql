/*
  Sistema de suscripción por email. Doble opt-in (nadie recibe nada hasta
  confirmar desde su bandeja de entrada) y preferencias opcionales por
  categoría o autor concretos — sin preferencias, se avisa de todo lo nuevo.

  El cliente nunca lee ni escribe estas tablas directamente (RLS activado,
  cero policies = todo denegado a anon/authenticated): todo pasa por las
  funciones `subscribe`, `confirm_subscription` y `unsubscribe`, en
  SECURITY DEFINER, que es lo único a lo que se concede EXECUTE. Así jamás
  se expone la lista de emails de los suscriptores vía la API pública.
*/

create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  confirmed_at timestamptz,
  confirm_token uuid not null default gen_random_uuid(),
  unsubscribe_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table public.subscriber_categories (
  subscriber_id uuid not null references public.subscribers(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (subscriber_id, category_id)
);

create table public.subscriber_authors (
  subscriber_id uuid not null references public.subscribers(id) on delete cascade,
  author_id uuid not null references public.authors(id) on delete cascade,
  primary key (subscriber_id, author_id)
);

alter table public.subscribers enable row level security;
alter table public.subscriber_categories enable row level security;
alter table public.subscriber_authors enable row level security;

/*
  Crea o actualiza una suscripción (email único). Reemplaza siempre el
  conjunto de preferencias por el que llega — así "guardar preferencias" es
  una sola llamada idempotente, sin tener que calcular altas/bajas en el
  cliente. Actualizar preferencias de alguien ya confirmado no le hace
  perder la confirmación.
*/
create or replace function public.subscribe(
  p_email text,
  p_category_ids uuid[] default '{}',
  p_author_ids uuid[] default '{}'
)
returns table (id uuid, confirm_token uuid, needs_confirmation boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_confirm_token uuid;
  v_needs_confirmation boolean;
begin
  insert into public.subscribers (email)
  values (lower(trim(p_email)))
  on conflict (email) do update set email = excluded.email
  returning subscribers.id, subscribers.confirm_token, (subscribers.confirmed_at is null)
  into v_id, v_confirm_token, v_needs_confirmation;

  delete from public.subscriber_categories where subscriber_id = v_id;
  delete from public.subscriber_authors where subscriber_id = v_id;

  if p_category_ids is not null and array_length(p_category_ids, 1) > 0 then
    insert into public.subscriber_categories (subscriber_id, category_id)
    select v_id, cid from unnest(p_category_ids) as cid;
  end if;

  if p_author_ids is not null and array_length(p_author_ids, 1) > 0 then
    insert into public.subscriber_authors (subscriber_id, author_id)
    select v_id, aid from unnest(p_author_ids) as aid;
  end if;

  return query select v_id, v_confirm_token, v_needs_confirmation;
end;
$$;

create or replace function public.confirm_subscription(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.subscribers set confirmed_at = now() where confirm_token = p_token and confirmed_at is null;
  return found;
end;
$$;

create or replace function public.unsubscribe(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.subscribers where unsubscribe_token = p_token;
  return found;
end;
$$;

revoke all on function public.subscribe(text, uuid[], uuid[]) from public;
revoke all on function public.confirm_subscription(uuid) from public;
revoke all on function public.unsubscribe(uuid) from public;
grant execute on function public.subscribe(text, uuid[], uuid[]) to anon, authenticated;
grant execute on function public.confirm_subscription(uuid) to anon, authenticated;
grant execute on function public.unsubscribe(uuid) to anon, authenticated;

-- Se rellena la primera (y única) vez que se avisa por email de un
-- artículo — evita reenviar el aviso en cada edición posterior a la
-- primera publicación.
alter table public.articles add column if not exists notified_at timestamptz;

/*
  Lista de suscriptores a avisar de un artículo: confirmados, y que o bien
  no tienen preferencias (= todo) o tienen esta categoría/autor entre las
  suyas. Selecciona SIEMPRE desde `subscribers` (nunca un JOIN contra las
  tablas de preferencias) — así cada suscriptor aparece como máximo una vez
  en el resultado aunque coincida por varias vías a la vez (todo + esa
  categoría + ese autor), sin necesidad de deduplicar nada aparte.

  Postgres concede EXECUTE a PUBLIC por defecto al crear una función — a
  diferencia de las tablas, donde no hay ese grant implícito. Por eso aquí
  se revoca explícitamente de PUBLIC (incluye a `anon` y `authenticated`,
  que heredan de PUBLIC) y se concede solo a `service_role`: la única vía
  para llamarla es con la service role key, que solo existe en la función
  de Netlify que manda los avisos, nunca en el navegador. No depende de que
  RLS lo bloquee "de rebote".
*/
-- `matched_via` dice por qué le llega el aviso a cada suscriptor —
-- prioridad autor > categoría > "todo" — para poder personalizar el texto
-- del email según el motivo real de cada uno, no un mensaje genérico.
create or replace function public.subscribers_for_article(p_category_id uuid, p_author_id uuid)
returns table (id uuid, email text, unsubscribe_token uuid, matched_via text)
language sql
stable
as $$
  select s.id, s.email, s.unsubscribe_token,
    case
      when exists (select 1 from public.subscriber_authors sa where sa.subscriber_id = s.id and sa.author_id = p_author_id) then 'author'
      when exists (select 1 from public.subscriber_categories sc where sc.subscriber_id = s.id and sc.category_id = p_category_id) then 'category'
      else 'all'
    end as matched_via
  from public.subscribers s
  where s.confirmed_at is not null
  and (
    (
      not exists (select 1 from public.subscriber_categories sc where sc.subscriber_id = s.id)
      and not exists (select 1 from public.subscriber_authors sa where sa.subscriber_id = s.id)
    )
    or exists (select 1 from public.subscriber_categories sc where sc.subscriber_id = s.id and sc.category_id = p_category_id)
    or exists (select 1 from public.subscriber_authors sa where sa.subscriber_id = s.id and sa.author_id = p_author_id)
  );
$$;

revoke all on function public.subscribers_for_article(uuid, uuid) from public;
grant execute on function public.subscribers_for_article(uuid, uuid) to service_role;
