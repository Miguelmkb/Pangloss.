import { useSiteContent } from '@/context/SiteContentContext';
import { splitParagraphs } from '@/lib/siteContent/format';

export function AboutPage() {
  const title = useSiteContent('about.title');
  const body = useSiteContent('about.body');

  return (
    <div className="max-w-editorial mx-auto px-6 py-24">
      <h1 className="font-serif text-4xl font-semibold text-text-primary mb-8">{title}</h1>
      <div className="space-y-6 text-lg font-serif text-text-primary leading-relaxed">
        {splitParagraphs(body).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}
