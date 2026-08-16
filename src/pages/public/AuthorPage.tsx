import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Article, Author } from '@/types/database';
import { getAuthorBySlug } from '@/lib/services/authors';
import { getArticlesByAuthorSlug } from '@/lib/services/articles.public';
import { ArticleListItem } from '@/components/public/ArticleListItem';
import { AuthorAvatar } from '@/pages/public/AuthorsPage';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePageMeta } from '@/lib/seo';

export function AuthorPage() {
  const { slug } = useParams();
  const [author, setAuthor] = useState<Author | null | undefined>(undefined);
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setAuthor(undefined);
    getAuthorBySlug(slug).then(async (a) => {
      if (!active) return;
      setAuthor(a);
      if (a) {
        const list = await getArticlesByAuthorSlug(slug);
        if (active) setArticles(list);
      }
    });
    return () => {
      active = false;
    };
  }, [slug]);

  usePageMeta(author?.name || 'Autor', author?.bio || undefined);

  if (author === undefined) return null;

  if (!author) {
    return <EmptyState title="Este autor no existe." description="Puede que el enlace se haya perdido por el camino." />;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex items-center gap-5 mb-4">
        <AuthorAvatar name={author.name} photoUrl={author.photo_url} size={64} />
        <div>
          <h1 className="font-serif text-3xl font-semibold text-text-primary">{author.name}</h1>
          {author.areas_of_interest && author.areas_of_interest.length > 0 && (
            <p className="text-xs font-sans uppercase tracking-widest text-text-muted mt-1">
              {author.areas_of_interest.join(' · ')}
            </p>
          )}
        </div>
      </div>
      {author.bio && <p className="max-w-editorial text-base font-sans text-text-secondary leading-relaxed mb-6">{author.bio}</p>}
      {author.links.length > 0 && (
        <div className="flex flex-wrap gap-x-4 mb-10">
          {author.links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-sans text-accent hover:text-accent-hover transition-colors underline underline-offset-2"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}

      <div className="pt-8 border-t border-border-light">
        {articles.length === 0 ? (
          <EmptyState title="Todavía en blanco." description="Este autor no ha publicado nada por aquí — de momento." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-x-12">
            {articles.map((a) => (
              <ArticleListItem key={a.id} article={a} />
            ))}
          </div>
        )}
      </div>

      <p className="mt-10">
        <Link to="/autores" className="text-sm font-sans text-text-muted hover:text-accent transition-colors">
          ← Todos los autores
        </Link>
      </p>
    </div>
  );
}
