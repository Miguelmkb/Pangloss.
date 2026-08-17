import { gmailComposeHref } from '@/lib/contact';
import { usePageMeta } from '@/lib/seo';
import { useSiteContent } from '@/context/SiteContentContext';
import { splitParagraphs, splitList } from '@/lib/siteContent/format';

export function CollaboratePage() {
  usePageMeta('Escribe para Pangloss', 'Cómo proponer un artículo o colaborar con la revista.');

  const title = useSiteContent('collaborate.title');
  const intro = useSiteContent('collaborate.intro');
  const topicsLabel = useSiteContent('collaborate.topicsLabel');
  const topics = splitList(useSiteContent('collaborate.topics'));
  const topicsNote = useSiteContent('collaborate.topicsNote');
  const stepsLabel = useSiteContent('collaborate.stepsLabel');
  const steps = splitList(useSiteContent('collaborate.steps'));
  const cta = useSiteContent('collaborate.cta');

  return (
    <div className="max-w-editorial mx-auto px-6 py-24">
      <h1 className="font-serif text-4xl font-semibold text-text-primary mb-8">{title}</h1>

      <div className="space-y-6 text-lg font-serif text-text-primary leading-relaxed">
        {splitParagraphs(intro).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="mt-14">
        <p className="text-xs font-sans uppercase tracking-widest text-text-muted mb-4">{topicsLabel}</p>
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => (
            <span key={t} className="px-3.5 py-1.5 text-sm font-sans rounded-full border border-border text-text-secondary">
              {t}
            </span>
          ))}
        </div>
        <p className="text-sm font-sans text-text-muted mt-4 leading-relaxed">{topicsNote}</p>
      </div>

      <div className="mt-14">
        <p className="text-xs font-sans uppercase tracking-widest text-text-muted mb-4">{stepsLabel}</p>
        <ol className="space-y-4 text-base font-sans text-text-secondary leading-relaxed list-decimal list-inside">
          {steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="mt-14 pt-10 border-t border-border-light">
        <a
          href={gmailComposeHref('Propuesta de colaboración — Pangloss')}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm font-sans uppercase tracking-widest bg-text-primary text-white px-6 py-3 hover:bg-accent transition-colors"
        >
          {cta}
        </a>
      </div>
    </div>
  );
}
