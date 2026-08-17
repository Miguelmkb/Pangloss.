-- El tiempo de lectura pasa a calcularse automáticamente a partir del
-- contenido del artículo por defecto. `reading_time_auto` distingue si el
-- valor actual de `reading_time_minutes` lo ha puesto el cálculo automático
-- (true, el caso por defecto) o si un editor lo ha corregido a mano (false)
-- — en ese caso, seguir escribiendo en el artículo ya no debe pisar el
-- número que el editor ha decidido dejar.
alter table public.articles add column if not exists reading_time_auto boolean not null default true;
