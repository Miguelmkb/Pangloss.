import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Article, Category } from '@/types/database';
import { getLatestArticles, getArticlesByCategorySlug } from '@/lib/services/articles.public';
import { getCategories } from '@/lib/services/categories';
import { ArticleListItem } from '@/components/public/ArticleListItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePageMeta } from '@/lib/seo';
import { useSiteContent } from '@/context/SiteContentContext';

export function ArticlesPage() {
  usePageMeta('Artículos', 'Todos los textos publicados en Pangloss.');

  const pageTitle = useSiteContent('articlesPage.title');
  const pageDescription = useSiteContent('articlesPage.description');
  const emptyTitle = useSiteContent('articlesPage.emptyTitle');
  const emptyDescriptionAll = useSiteContent('articlesPage.emptyDescriptionAll');
  const emptyDescriptionFiltered = useSiteContent('articlesPage.emptyDescriptionFiltered');

  const [params, setParams] = useSearchParams();
  const activeSlug = params.get('categoria');

  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories().then((cats) => setCategories(cats.filter((c) => !c.parent_id)));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (activeSlug ? getArticlesByCategorySlug(activeSlug) : getLatestArticles(100)).then((data) => {
      if (active) {
        setArticles(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [activeSlug]);

  function selectCategory(slug: string | null) {
    if (slug) setParams({ categoria: slug });
    else setParams({});
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="font-serif text-4xl font-semibold text-text-primary mb-3">{pageTitle}</h1>
      <p className="text-base font-sans text-text-secondary mb-8">{pageDescription}</p>

      <div className="flex flex-wrap gap-2 mb-10 pb-8 border-b border-border-light">
        <FilterPill label="Todos" active={!activeSlug} onClick={() => selectCategory(null)} />
        {categories.map((c) => (
          <FilterPill key={c.id} label={c.name} active={activeSlug === c.slug} onClick={() => selectCategory(c.slug)} />
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-8" aria-hidden>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-border-light rounded" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={activeSlug ? emptyDescriptionFiltered : emptyDescriptionAll}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-x-12">
          {articles.map((a) => (
            <ArticleListItem key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 text-sm font-sans rounded-full border transition-colors ${
        active
          ? 'bg-text-primary text-white border-text-primary'
          : 'text-text-secondary border-border hover:border-text-primary hover:text-text-primary'
      }`}
    >
      {label}
    </button>
  );
}
