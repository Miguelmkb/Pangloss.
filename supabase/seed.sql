/*
  Taxonomía inicial de Pangloss. Son categorías reales de la publicación
  (no contenido de demostración) — se insertan una sola vez.
  Ejecutar DESPUÉS de las migraciones.
*/

insert into public.categories (name, slug, description, sort_order) values
  ('Ciencia', 'ciencia', 'Conocimiento, método y descubrimiento.', 1),
  ('Cultura', 'cultura', 'Arte, literatura y vida cultural.', 2),
  ('Economía', 'economia', 'Análisis económico, mercados y políticas públicas.', 3),
  ('Filosofía', 'filosofia', 'Ideas, ética y pensamiento crítico.', 4),
  ('Historia', 'historia', 'Pasado, memoria e historiografía.', 5),
  ('Política', 'politica', 'Instituciones, poder y debate democrático.', 6),
  ('Sociología', 'sociologia', 'Estructura social, desigualdad y cambio cultural.', 7),
  ('Tecnología', 'tecnologia', 'Técnica, digitalización y sociedad.', 8),
  ('Otros', 'otros', 'Miscelánea y ensayos personales.', 9)
on conflict (slug) do nothing;
