-- Recomendación de lectura al final del artículo: por defecto se calcula
-- sola (mismo criterio que ya usaba `getRelatedArticles` — el artículo
-- publicado más reciente de la misma categoría), pero un editor puede
-- fijar una recomendación concreta a mano. `null` significa "usar la
-- automática" — mismo patrón ya establecido con `reading_time_auto`
-- (automático por defecto, corregible a mano).
--
-- `on delete set null`: si el artículo recomendado se borra de verdad, la
-- fila que lo recomendaba no debe romperse ni arrastrar el borrado — vuelve
-- sola al criterio automático.
alter table public.articles
  add column if not exists recommended_article_id uuid references public.articles(id) on delete set null;

comment on column public.articles.recommended_article_id is
  'Recomendación de lectura manual para el final del artículo. NULL = calcular automáticamente (misma categoría, más reciente).';
