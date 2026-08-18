import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Article } from '@/types/database';
import { getArticleBySlug, getRelatedArticles } from '@/lib/services/articles.public';
import { ArticleContent } from '@/lib/content/renderArticleContent';
import { ArticleListItem } from '@/components/public/ArticleListItem';
import { ReadingProgress } from '@/components/public/ReadingProgress';
import { EmptyState } from '@/components/ui/EmptyState';
import { NotFoundMark } from '@/components/public/NotFoundMark';
import { formatDate, readingTimeLabel } from '@/lib/utils';
import { usePageMeta } from '@/lib/seo';
import { Download } from 'lucide-react';
import { ArticleEndMark } from '@/components/public/ArticleEndMark';
import { getCategoryWorld } from '@/lib/worlds/categoryWorlds';
import { useSiteContent } from '@/context/SiteContentContext';

const REFERENCE_TYPE_LABELS: Record<string, string> = {
  book: 'Libro',
  article: 'Artículo',
  report: 'Informe',
  document: 'Documento',
  website: 'Sitio web',
  other: 'Otro',
};

export function ArticlePage() {
  const { slug } = useParams();
  const notFoundTitle = useSiteContent('articlePage.notFoundTitle');
  const notFoundDescription = useSiteContent('articlePage.notFoundDescription');
  const relatedTitle = useSiteContent('articlePage.relatedTitle');
  const [article, setArticle] = useState<Article | null | undefined>(undefined);
  const [related, setRelated] = useState<Article[]>([]);
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setArticle(undefined);
    getArticleBySlug(slug).then(async (a) => {
      if (!active) return;
      setArticle(a);
      if (a) {
        const r = await getRelatedArticles(a);
        if (active) setRelated(r);
      }
    });
    return () => {
      active = false;
    };
  }, [slug]);

  const isMissing = article !== undefined && (!article || article.status !== 'published');
  usePageMeta(
    isMissing ? notFoundTitle : article?.seo_title || article?.title || '',
    isMissing ? notFoundDescription : article?.seo_description || article?.excerpt || undefined,
  );

  if (article === undefined) return null; // evita parpadeo del "no encontrado" mientras carga

  if (!article || article.status !== 'published') {
    return <EmptyState title={notFoundTitle} description={notFoundDescription} illustration={<NotFoundMark />} />;
  }

  const world = getCategoryWorld(article.category?.slug);
  // El remate ilustrado de Spongeonomics ya no va al final de cada
  // artículo — vive solo en la página de la sección (`CategoryPage`). Aquí
  // se mantiene siempre el remate genérico.
  const AmbientEffect = world?.AmbientEffect;

  return (
    <article ref={articleRef} className={world?.className}>
      <ReadingProgress targetRef={articleRef} />
      {AmbientEffect && <AmbientEffect />}

      <header className="max-w-editorial mx-auto px-6 pt-16 pb-10">
        {article.category && (
          <Link
            to={`/categoria/${article.category.slug}`}
            className="inline-block text-xs font-sans font-medium uppercase tracking-widest text-accent mb-5 hover:text-accent-hover transition-colors"
          >
            {article.category.name}
          </Link>
        )}
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-text-primary leading-[1.12] mb-4">
          {article.title}
        </h1>
        {article.subtitle && (
          <p className="text-xl font-sans text-text-secondary leading-relaxed mb-6">{article.subtitle}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-sans text-text-muted">
          {article.author && (
            <Link to={`/autor/${article.author.slug}`} className="text-text-primary hover:text-accent transition-colors">
              {article.author.name}
            </Link>
          )}
          <span aria-hidden>·</span>
          <span>{formatDate(article.published_at)}</span>
          <span aria-hidden>·</span>
          <span>{readingTimeLabel(article.reading_time_minutes)}</span>
        </div>

        {article.pdf_url && (
          <a
            href={article.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 mt-6 text-sm font-sans text-text-primary border border-border px-4 py-2 hover:border-text-primary transition-colors"
          >
            <Download className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
            Descargar PDF
          </a>
        )}
      </header>

      <div className="max-w-editorial mx-auto px-6 pb-8">
        <ArticleContent content={article.content} />
      </div>

      {article.references && article.references.length > 0 && (
        <div className="max-w-editorial mx-auto px-6 pb-16">
          <div className="pt-8 border-t border-border">
            <p className="text-xs font-sans uppercase tracking-widest text-text-muted mb-4">Referencias</p>
            <ol className="space-y-3">
              {article.references
                .slice()
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((ref) => (
                  <li key={ref.id} className="text-sm font-sans text-text-secondary leading-relaxed">
                    <span className="text-text-muted">[{REFERENCE_TYPE_LABELS[ref.type]}]</span>{' '}
                    {ref.authors && <span>{ref.authors}. </span>}
                    {ref.url ? (
                      <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-text-primary hover:text-accent transition-colors underline underline-offset-2">
                        {ref.title}
                      </a>
                    ) : (
                      <span className="text-text-primary">{ref.title}</span>
                    )}
                    {ref.year && <span>, {ref.year}</span>}
                    {ref.publisher && <span>. {ref.publisher}</span>}
                    {ref.journal && <span>. {ref.journal}</span>}
                    {ref.pages && <span>, pp. {ref.pages}</span>}
                  </li>
                ))}
            </ol>
          </div>
        </div>
      )}

      <ArticleEndMark />

      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-16 border-t border-border-light">
          <h2 className="font-serif text-2xl font-semibold text-text-primary mb-8">{relatedTitle}</h2>
          <div className="grid sm:grid-cols-2 gap-x-12">
            {related.map((a) => (
              <ArticleListItem key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
