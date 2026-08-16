import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Article, Category } from '@/types/database';
import { getCategories } from '@/lib/services/categories';
import { getArticlesByCategorySlug, getAllCategoriesArticleCounts } from '@/lib/services/articles.public';
import { ArticleListItem } from '@/components/public/ArticleListItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePageMeta } from '@/lib/seo';
import { getCategoryWorld } from '@/lib/worlds/categoryWorlds';

export function CategoryPage() {
  const { slug } = useParams();
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<Category | null | undefined>(undefined);
  const [articles, setArticles] = useState<Article[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setCategory(undefined);
    Promise.all([getCategories(), getArticlesByCategorySlug(slug), getAllCategoriesArticleCounts()]).then(
      ([cats, list, counts]) => {
        if (!active) return;
        setAllCategories(cats);
        setCategory(cats.find((c) => c.slug === slug) ?? null);
        setArticles(list);
        setCounts(counts);
      },
    );
    return () => {
      active = false;
    };
  }, [slug]);

  usePageMeta(category?.name || 'Categoría', category?.description || undefined);

  if (category === undefined) return null;

  if (!category) {
    return <EmptyState title="Esta categoría no existe." description="Puede que el enlace se haya perdido por el camino." />;
  }

  const parent = category.parent_id ? allCategories.find((c) => c.id === category.parent_id) : null;
  const subcategories = allCategories.filter((c) => c.parent_id === category.id);
  // Remate ilustrado exclusivo de Spongeonomics: vive solo aquí, en la
  // página de la sección, no en cada artículo (único punto de integración,
  // vía el mismo registro de mundos contextuales que usa ArticlePage).
  const EndMark = getCategoryWorld(category.slug)?.EndMark;

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <p className="text-xs font-sans uppercase tracking-widest text-text-muted mb-3">
        <Link to="/categorias" className="hover:text-accent transition-colors">
          Categorías
        </Link>
        {parent && (
          <>
            {' '}
            <span aria-hidden>/</span>{' '}
            <Link to={`/categoria/${parent.slug}`} className="hover:text-accent transition-colors">
              {parent.name}
            </Link>
          </>
        )}
      </p>
      <h1 className="font-serif text-4xl font-semibold text-text-primary mb-3">{category.name}</h1>
      {category.description && <p className="text-base font-sans text-text-secondary mb-10">{category.description}</p>}

      {subcategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10 pb-10 border-b border-border-light">
          {subcategories.map((sub) => (
            <Link
              key={sub.id}
              to={`/categoria/${sub.slug}`}
              className="px-3.5 py-1.5 text-sm font-sans rounded-full border border-border text-text-secondary hover:border-text-primary hover:text-text-primary transition-colors"
            >
              {sub.name} <span className="text-text-muted">({counts[sub.id] ?? 0})</span>
            </Link>
          ))}
        </div>
      )}

      {articles.length === 0 ? (
        <EmptyState
          title="Todavía no hemos escrito sobre esto."
          description={
            subcategories.length > 0
              ? 'Al menos no directamente en esta categoría — prueba con alguna de las subcategorías de arriba.'
              : 'Quizá sea precisamente el momento de hacerlo. Aparecerá aquí en cuanto exista.'
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-x-12">
          {articles.map((a) => (
            <ArticleListItem key={a.id} article={a} />
          ))}
        </div>
      )}

      {EndMark && (
        <div className="mt-16 pt-16 border-t border-border-light">
          <EndMark />
        </div>
      )}
    </div>
  );
}
