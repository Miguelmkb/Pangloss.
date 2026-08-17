import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Article } from '@/types/database';
import { searchArticles } from '@/lib/services/articles.public';
import { ArticleListItem } from '@/components/public/ArticleListItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { NotFoundMark } from '@/components/public/NotFoundMark';
import { usePageMeta } from '@/lib/seo';
import { useSiteContent } from '@/context/SiteContentContext';

export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  usePageMeta('Buscar', 'Buscador de Pangloss.');

  const heading = useSiteContent('search.heading');
  const promptTitle = useSiteContent('search.promptTitle');
  const noResultsTitle = useSiteContent('search.noResultsTitle');
  const noResultsDescription = useSiteContent('search.noResultsDescription');

  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    let active = true;
    setLoading(true);
    searchArticles(q).then((data) => {
      if (active) {
        setResults(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [q]);

  return (
    <div className="max-w-editorial mx-auto px-6 py-16">
      <p className="text-xs font-sans uppercase tracking-widest text-text-muted mb-3">Buscar</p>
      <h1 className="font-serif text-3xl font-semibold text-text-primary mb-10">
        {q ? (
          <>
            Resultados para <span className="text-accent">"{q}"</span>
          </>
        ) : (
          heading
        )}
      </h1>

      {!q ? (
        <EmptyState title={promptTitle} />
      ) : loading ? (
        <div className="animate-pulse space-y-6" aria-hidden>
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-border-light rounded" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState title={noResultsTitle} description={noResultsDescription} illustration={<NotFoundMark />} />
      ) : (
        <div>
          {results.map((a) => (
            <ArticleListItem key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
