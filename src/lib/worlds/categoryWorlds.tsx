import type { ComponentType } from 'react';
import { SpongeonomicsEndMark } from '@/components/worlds/spongeonomics/SpongeonomicsEndMark';
import { SpongeonomicsBubbles } from '@/components/worlds/spongeonomics/SpongeonomicsBubbles';

/**
 * Identidad contextual: Pangloss tiene un lenguaje visual general; una
 * categoría puede, opcionalmente, tener un "mundo" propio con acentos muy
 * discretos. Este archivo es el ÚNICO lugar de la aplicación que sabe qué
 * categorías tienen mundo propio y qué aspecto tiene — todo lo demás
 * (`ArticlePage`, el renderer, el CSS) solo pregunta "¿esta categoría tiene
 * mundo?" y renderiza lo que ese mundo declare, sin ningún
 * `if (categoria === 'spongeonomics')` disperso por el resto del código.
 *
 * Añadir un mundo nuevo en el futuro es: crear su carpeta en
 * `components/worlds/<nombre>/` y una entrada aquí. No toca nada de lo
 * general.
 */
export interface CategoryWorld {
  key: string;
  /** slugs de categoría que pertenecen a este mundo (normalizado a minúsculas al comparar) */
  categorySlugs: string[];
  /** clase CSS aplicada al contenedor del artículo — único gancho para cursor/estilos propios */
  className?: string;
  /** sustituye al remate editorial genérico al final del artículo */
  EndMark?: ComponentType;
  /** componente montado una vez, sin props, mientras se lee un artículo de este mundo */
  AmbientEffect?: ComponentType;
}

const WORLDS: CategoryWorld[] = [
  {
    key: 'spongeonomics',
    categorySlugs: ['spongeonomics'],
    className: 'world-spongeonomics',
    EndMark: SpongeonomicsEndMark,
    AmbientEffect: SpongeonomicsBubbles,
  },
];

export function getCategoryWorld(categorySlug: string | null | undefined): CategoryWorld | null {
  if (!categorySlug) return null;
  const normalized = categorySlug.toLowerCase();
  return WORLDS.find((w) => w.categorySlugs.includes(normalized)) ?? null;
}
