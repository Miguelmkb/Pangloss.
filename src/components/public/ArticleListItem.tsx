import { Link } from 'react-router-dom';
import type { Article } from '@/types/database';
import { formatDate, readingTimeLabel } from '@/lib/utils';

/**
 * Fila editorial para listados (Home, /articulos, categoría, autor).
 * Deliberadamente no es una "card": sin borde, sin sombra, sin fondo propio.
 * La jerarquía la da la tipografía; la separación entre artículos, una
 * línea muy fina. La miniatura es opcional y pequeña — un acento, no el
 * protagonista.
 */
export function ArticleListItem({ article }: { article: Article }) {
  return (
    <Link
      to={`/articulo/${article.slug}`}
      className="group grid grid-cols-[1fr] sm:grid-cols-[1fr_auto] gap-x-8 gap-y-3 items-start py-7 border-b border-border-light"
    >
      <div className="min-w-0">
        {article.category && (
          <span className="block text-xs font-sans font-medium uppercase tracking-widest text-accent mb-2">
            {article.category.name}
          </span>
        )}
        <h3 className="font-serif text-xl sm:text-2xl font-semibold text-text-primary leading-snug mb-2 group-hover:text-accent transition-colors">
          {article.title || 'Sin título'}
        </h3>
        {(article.subtitle || article.excerpt) && (
          <p className="text-sm font-sans text-text-secondary leading-relaxed mb-3 line-clamp-2">
            {article.subtitle || article.excerpt}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-sans text-text-muted">
          {article.author && <span>{article.author.name}</span>}
          {article.author && <span aria-hidden>·</span>}
          <span>{formatDate(article.published_at)}</span>
          <span aria-hidden>·</span>
          <span>{readingTimeLabel(article.reading_time_minutes)}</span>
        </div>
      </div>

      {article.featured_image_url && (
        <img
          src={article.featured_image_url}
          alt={article.featured_image_alt ?? ''}
          loading="lazy"
          className="w-full sm:w-40 h-28 object-cover rounded-sm order-first sm:order-last transition-opacity duration-200 group-hover:opacity-80"
        />
      )}
    </Link>
  );
}
