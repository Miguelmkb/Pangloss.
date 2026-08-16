import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Author } from '@/types/database';
import { getAuthors } from '@/lib/services/authors';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePageMeta } from '@/lib/seo';

export function AuthorsPage() {
  usePageMeta('Autores', 'Las personas que escriben en Pangloss.');
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuthors().then((data) => {
      setAuthors(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-editorial mx-auto px-6 py-16">
      <h1 className="font-serif text-4xl font-semibold text-text-primary mb-3">Autores</h1>
      <p className="text-base font-sans text-text-secondary mb-10">Las personas que escriben en Pangloss.</p>

      {loading ? (
        <div className="animate-pulse space-y-6" aria-hidden>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-border-light rounded" />
          ))}
        </div>
      ) : authors.length === 0 ? (
        <EmptyState title="Todavía no hay nadie aquí." description="Los autores aparecerán en cuanto se den de alta desde el panel editorial." />
      ) : (
        <div>
          {authors.map((author) => (
            <Link key={author.id} to={`/autor/${author.slug}`} className="flex items-center gap-4 py-5 border-b border-border-light group">
              <AuthorAvatar name={author.name} photoUrl={author.photo_url} />
              <div>
                <p className="font-serif text-lg text-text-primary group-hover:text-accent transition-colors">{author.name}</p>
                {author.bio && <p className="text-sm font-sans text-text-muted mt-0.5 line-clamp-1">{author.bio}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function AuthorAvatar({ name, photoUrl, size = 44 }: { name: string; photoUrl: string | null; size?: number }) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-accent-light text-accent flex items-center justify-center font-serif flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
