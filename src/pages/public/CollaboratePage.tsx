import { gmailComposeHref } from '@/lib/contact';
import { usePageMeta } from '@/lib/seo';

const TEMAS = ['Economía', 'Sociología', 'Historia', 'Política', 'Filosofía', 'Cultura', 'Ciencia', 'Tecnología'];

export function CollaboratePage() {
  usePageMeta('Escribe para Pangloss', 'Cómo proponer un artículo o colaborar con la revista.');

  return (
    <div className="max-w-editorial mx-auto px-6 py-24">
      <h1 className="font-serif text-4xl font-semibold text-text-primary mb-8">Escribe para Pangloss</h1>

      <div className="space-y-6 text-lg font-serif text-text-primary leading-relaxed">
        <p>
          Pangloss no es solo de quienes la fundamos. Si tienes una idea que llevas tiempo dándole
          vueltas, un argumento que crees que merece espacio, o simplemente algo que decir y bien
          dicho, nos gustaría leerlo.
        </p>
        <p>
          No buscamos actualidad ni urgencia — buscamos textos pensados, bien argumentados y
          honestos con la complejidad del tema. Un artículo de Pangloss puede tardar una semana en
          escribirse y seguir siendo relevante dentro de cinco años.
        </p>
      </div>

      <div className="mt-14">
        <p className="text-xs font-sans uppercase tracking-widest text-text-muted mb-4">Qué buscamos</p>
        <div className="flex flex-wrap gap-2">
          {TEMAS.map((t) => (
            <span key={t} className="px-3.5 py-1.5 text-sm font-sans rounded-full border border-border text-text-secondary">
              {t}
            </span>
          ))}
        </div>
        <p className="text-sm font-sans text-text-muted mt-4 leading-relaxed">
          Si tu idea no encaja claramente en ninguno de estos temas pero crees que tiene sitio en
          Pangloss, escríbenos igual — el criterio siempre ha sido la calidad del argumento, no la
          etiqueta.
        </p>
      </div>

      <div className="mt-14">
        <p className="text-xs font-sans uppercase tracking-widest text-text-muted mb-4">Cómo proponerlo</p>
        <ol className="space-y-4 text-base font-sans text-text-secondary leading-relaxed list-decimal list-inside">
          <li>
            Escríbenos con una idea, un borrador o un artículo ya terminado — lo que tengas. Un
            par de párrafos contando de qué va y por qué te parece que merece la pena es suficiente
            para empezar.
          </li>
          <li>Lo leemos con calma y te respondemos, seas quien seas y venga de donde venga.</li>
          <li>
            Si sigue adelante, trabajamos el texto contigo hasta que esté listo para publicarse con
            tu nombre.
          </li>
        </ol>
      </div>

      <div className="mt-14 pt-10 border-t border-border-light">
        <a
          href={gmailComposeHref('Propuesta de colaboración — Pangloss')}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm font-sans uppercase tracking-widest bg-text-primary text-white px-6 py-3 hover:bg-accent transition-colors"
        >
          Proponer un artículo
        </a>
      </div>
    </div>
  );
}
