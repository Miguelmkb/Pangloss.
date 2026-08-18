import { Link } from 'react-router-dom';
import { NotFoundMark } from '@/components/public/NotFoundMark';
import { useSiteContent } from '@/context/SiteContentContext';
import { usePageMeta } from '@/lib/seo';

export function NotFoundPage() {
  const title = useSiteContent('notFound.title');
  const subtitle = useSiteContent('notFound.subtitle');
  const link = useSiteContent('notFound.link');
  usePageMeta('Página no encontrada', subtitle);

  return (
    <div className="max-w-editorial mx-auto px-6 py-32 text-center">
      <p className="text-xs font-sans uppercase tracking-widest text-text-muted mb-6">404</p>
      <NotFoundMark />
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-text-primary mb-3 leading-snug">{title}</h1>
      <p className="font-serif text-lg text-text-secondary italic mb-8">{subtitle}</p>
      <Link to="/" className="link-editorial text-sm font-sans text-accent hover:text-accent-hover transition-colors">
        {link}
      </Link>
    </div>
  );
}
