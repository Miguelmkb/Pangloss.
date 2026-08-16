-- URL de un PDF alojado externamente (p. ej. Google Drive compartido) que
-- se ofrece como descarga en la página pública del artículo.
alter table public.articles add column if not exists pdf_url text;
