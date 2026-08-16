import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Rss, ArrowRight } from 'lucide-react';
import { CONTACT_EMAIL, gmailComposeHref } from '@/lib/contact';
import { useSubscribe } from '@/hooks/useSubscribe';

const CONTACT_HREF = gmailComposeHref();

const PUBLICACION_LINKS = [
  { to: '/articulos', label: 'Artículos' },
  { to: '/categorias', label: 'Categorías' },
  { to: '/autores', label: 'Autores' },
  { to: '/buscar', label: 'Buscar' },
];

function FooterSubscribeForm() {
  const { status, errorMessage, submit } = useSubscribe();
  const [email, setEmail] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submit(email);
  }

  if (status === 'success') {
    return (
      <p className="text-sm font-sans text-text-primary max-w-xs leading-relaxed">
        Revisa tu bandeja de entrada — te hemos mandado un enlace para confirmar.
      </p>
    );
  }

  return (
    <div className="max-w-xs">
      <p className="text-xs font-sans uppercase tracking-widest text-text-muted mb-3">Recibe los artículos nuevos</p>
      <form onSubmit={handleSubmit} className="flex items-stretch border-b border-border focus-within:border-text-primary transition-colors">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="flex-1 min-w-0 bg-transparent py-2 text-sm font-sans text-text-primary placeholder:text-text-muted outline-none"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          aria-label="Suscribirme"
          className="flex-shrink-0 p-2 text-text-secondary hover:text-accent transition-colors disabled:opacity-40"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
      {status === 'error' && <p className="text-xs font-sans text-accent mt-2">{errorMessage}</p>}
      <Link to="/suscribete" className="inline-block text-xs font-sans text-text-muted hover:text-accent transition-colors mt-2">
        ¿Solo ciertos temas o autores? Elige aquí →
      </Link>
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border mt-24">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.svg" alt="Pangloss" className="h-20 w-20 object-contain" />
              <p className="font-serif text-2xl font-bold tracking-[0.12em] uppercase text-text-primary">
                Pangloss
              </p>
            </div>
            <p className="text-sm font-sans text-text-secondary leading-relaxed max-w-xs mb-6">
              Una revista digital de análisis, ensayo e investigación sobre economía, sociología,
              historia, política, filosofía y cultura.
            </p>
            <FooterSubscribeForm />
          </div>

          <div>
            <p className="text-xs font-sans uppercase tracking-widest text-text-muted mb-4">Publicación</p>
            <ul className="space-y-2">
              {PUBLICACION_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm font-sans text-text-secondary hover:text-text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-sans uppercase tracking-widest text-text-muted mb-4">Pangloss</p>
            <ul className="space-y-2">
              <li>
                <Link to="/sobre" className="text-sm font-sans text-text-secondary hover:text-text-primary transition-colors">
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link to="/colabora" className="text-sm font-sans text-text-secondary hover:text-text-primary transition-colors">
                  Escribe para Pangloss
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-sm font-sans text-text-secondary hover:text-text-primary transition-colors">
                  Acceso privado
                </Link>
              </li>
              <li>
                <a
                  href="/rss.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-sans text-text-secondary hover:text-text-primary transition-colors"
                >
                  <Rss className="w-3.5 h-3.5" />
                  RSS
                </a>
              </li>
              <li>
                <a
                  href={CONTACT_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-sans text-text-secondary hover:text-text-primary transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Contacto
                </a>
              </li>
              <li>
                <a
                  href={CONTACT_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-sans text-text-muted hover:text-accent transition-colors"
                >
                  {CONTACT_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border-light pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-sans text-text-muted">© {year} Pangloss. Todos los derechos reservados.</p>
          <p className="text-xs font-sans text-text-muted italic">«Todo está bien en el mejor de los mundos posibles.»</p>
        </div>
      </div>
    </footer>
  );
}
