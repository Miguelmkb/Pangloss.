import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Article, Category } from '@/types/database';
import { getFeaturedArticle, getLatestArticles } from '@/lib/services/articles.public';
import { getCategories } from '@/lib/services/categories';
import { ArticleListItem } from '@/components/public/ArticleListItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, readingTimeLabel } from '@/lib/utils';
import { usePageMeta } from '@/lib/seo';
import { useSiteContent } from '@/context/SiteContentContext';

export function HomePage() {
  usePageMeta('Pangloss', 'Revista digital de ensayo, análisis e ideas.');

  const heroCta = useSiteContent('home.heroCta');
  const latestTitle = useSiteContent('home.latestTitle');
  const viewAll = useSiteContent('home.viewAll');
  const categoriesTitle = useSiteContent('home.categoriesTitle');
  const emptyTitle = useSiteContent('home.emptyTitle');
  const emptyDescription = useSiteContent('home.emptyDescription');

  const [featured, setFeatured] = useState<Article | null>(null);
  const [latest, setLatest] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const feat = await getFeaturedArticle();
      if (!active) return;
      setFeatured(feat);
      const [rest, cats] = await Promise.all([getLatestArticles(6, feat?.id), getCategories()]);
      if (!active) return;
      setLatest(rest);
      // Todas las categorías padre, sin tope — ya vienen ordenadas por
      // `sort_order` desde `getCategories()`.
      setCategories(cats.filter((c) => !c.parent_id));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <HomeSkeleton />;

  if (!featured) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div>
      {/* Artículo destacado */}
      <section className="max-w-6xl mx-auto px-6 pt-14 pb-16">
        <Link to={`/articulo/${featured.slug}`} className="group grid md:grid-cols-2 gap-10 items-center">
          <div>
            {featured.category && (
              <span className="block text-xs font-sans font-medium uppercase tracking-widest text-accent mb-4">
                {featured.category.name}
              </span>
            )}
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-text-primary leading-[1.1] mb-5 group-hover:text-accent transition-colors">
              {featured.title}
            </h1>
            {featured.subtitle && (
              <p className="text-lg font-sans text-text-secondary leading-relaxed mb-6">{featured.subtitle}</p>
            )}
            <div className="flex items-center gap-2 text-sm font-sans text-text-muted mb-8">
              {featured.author && <span>{featured.author.name}</span>}
              <span aria-hidden>·</span>
              <span>{formatDate(featured.published_at)}</span>
              <span aria-hidden>·</span>
              <span>{readingTimeLabel(featured.reading_time_minutes)}</span>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-sans font-medium text-text-primary group-hover:text-accent transition-colors">
              {heroCta}
              <ArrowRight className="w-4 h-4 arrow-nudge" strokeWidth={1.75} />
            </span>
          </div>
          {featured.featured_image_url && (
            <img
              src={featured.featured_image_url}
              alt={featured.featured_image_alt ?? ''}
              className="w-full aspect-[4/3] object-cover rounded-sm"
            />
          )}
        </Link>
      </section>

      {/* Últimos artículos */}
      {latest.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-16 border-t border-border-light">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="font-serif text-2xl font-semibold text-text-primary">{latestTitle}</h2>
            <Link
              to="/articulos"
              className="group inline-flex items-center gap-1.5 link-editorial text-sm font-sans text-text-muted hover:text-accent transition-colors"
            >
              {viewAll}
              <ArrowRight className="w-3.5 h-3.5 arrow-nudge" strokeWidth={1.75} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-x-12">
            {latest.map((a) => (
              <ArticleListItem key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}

      {/* Categorías */}
      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-16 border-t border-border-light">
          <h2 className="font-serif text-2xl font-semibold text-text-primary mb-8">{categoriesTitle}</h2>
          {/* flex-wrap + justify-center, no grid: así una última fila
              incompleta (sobra 1 o 2 categorías de un múltiplo de 3) queda
              centrada sola en vez de pegada a la izquierda — funciona igual
              con 9 categorías que con 15. */}
          <div className="flex flex-wrap justify-center gap-5">
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/categoria/${c.slug}`}
                className="category-tile group block bg-white rounded-lg px-7 py-8 w-full sm:w-[calc((100%-2.5rem)/3)]"
              >
                <p className="font-serif text-xl text-text-primary group-hover:text-accent transition-colors mb-1.5">{c.name}</p>
                {c.description && <p className="text-xs font-sans text-text-muted leading-relaxed">{c.description}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-6 pt-14 pb-16 animate-pulse" aria-hidden>
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="h-3 w-20 bg-border-light rounded mb-5" />
          <div className="h-10 w-full bg-border-light rounded mb-3" />
          <div className="h-10 w-4/5 bg-border-light rounded mb-6" />
          <div className="h-4 w-3/4 bg-border-light rounded" />
        </div>
        <div className="w-full aspect-[4/3] bg-border-light rounded-sm" />
      </div>
    </div>
  );
}
