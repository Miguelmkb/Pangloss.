import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories, groupCategories, type CategoryGroup } from '@/lib/services/categories';
import { getAllCategoriesArticleCounts } from '@/lib/services/articles.public';
import { usePageMeta } from '@/lib/seo';

export function CategoriesPage() {
  usePageMeta('Categorías', 'Las áreas de Pangloss.');
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCategories(), getAllCategoriesArticleCounts()]).then(([cats, c]) => {
      setGroups(groupCategories(cats));
      setCounts(c);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-editorial mx-auto px-6 py-16">
      <h1 className="font-serif text-4xl font-semibold text-text-primary mb-3">Categorías</h1>
      <p className="text-base font-sans text-text-secondary mb-10">Las áreas de Pangloss.</p>

      {loading ? (
        <div className="animate-pulse space-y-6" aria-hidden>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-border-light rounded" />
          ))}
        </div>
      ) : (
        <div>
          {groups.map(({ parent, children }) => (
            <div key={parent.id} className="border-b border-border-light py-5">
              <Link to={`/categoria/${parent.slug}`} className="flex items-baseline justify-between group">
                <span>
                  <span className="font-serif text-xl text-text-primary group-hover:text-accent transition-colors">
                    {parent.name}
                  </span>
                  {parent.description && (
                    <span className="block text-sm font-sans text-text-muted mt-1">{parent.description}</span>
                  )}
                </span>
                <span className="text-sm font-sans text-text-muted flex-shrink-0 ml-4">{counts[parent.id] ?? 0}</span>
              </Link>
              {children.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pl-0">
                  {children.map((child) => (
                    <Link
                      key={child.id}
                      to={`/categoria/${child.slug}`}
                      className="text-sm font-sans text-text-secondary hover:text-accent transition-colors"
                    >
                      {child.name} <span className="text-text-muted">({counts[child.id] ?? 0})</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
