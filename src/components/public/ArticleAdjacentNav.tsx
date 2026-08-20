import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Article } from '@/types/database';

/**
 * "Artículo anterior" / "Artículo siguiente" — mismo orden cronológico que
 * el resto del sitio (`published_at`, ver `getAdjacentArticles`). Cada
 * lado se omite del todo si no hay artículo (nunca un hueco vacío ni un
 * enlace deshabilitado). `flex justify-between` en vez de un grid de dos
 * columnas fijas: con los dos presentes se reparten solos a los extremos;
 * con solo uno, ese ocupa su sitio natural (el anterior a la izquierda de
 * por sí; el siguiente necesita `ml-auto` porque, sin nada a la izquierda
 * que lo empuje, un flex de un solo hijo se queda pegado al principio) —
 * nunca una columna entera vacía al lado.
 */
export function ArticleAdjacentNav({ previous, next }: { previous: Article | null; next: Article | null }) {
  if (!previous && !next) return null;

  return (
    <nav aria-label="Navegación entre artículos" className="max-w-editorial mx-auto px-6 pb-16">
      <div className="flex items-start justify-between gap-6 pt-8 border-t border-border-light">
        {previous && (
          <Link to={`/articulo/${previous.slug}`} className="group min-w-0 max-w-sm">
            <span className="inline-flex items-center gap-1.5 text-xs font-sans uppercase tracking-widest text-text-muted mb-2">
              <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
              Anterior
            </span>
            <p className="font-serif text-base text-text-primary leading-snug line-clamp-2 group-hover:text-accent transition-colors">
              {previous.title || 'Sin título'}
            </p>
          </Link>
        )}
        {next && (
          <Link to={`/articulo/${next.slug}`} className={`group min-w-0 max-w-sm text-right ${previous ? '' : 'ml-auto'}`}>
            <span className="inline-flex items-center justify-end gap-1.5 text-xs font-sans uppercase tracking-widest text-text-muted mb-2">
              Siguiente
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </span>
            <p className="font-serif text-base text-text-primary leading-snug line-clamp-2 group-hover:text-accent transition-colors">
              {next.title || 'Sin título'}
            </p>
          </Link>
        )}
      </div>
    </nav>
  );
}
