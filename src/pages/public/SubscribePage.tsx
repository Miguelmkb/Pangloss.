import { useEffect, useState, type FormEvent } from 'react';
import type { Author } from '@/types/database';
import { getCategories, groupCategories, type CategoryGroup } from '@/lib/services/categories';
import { getAuthors } from '@/lib/services/authors';
import { useSubscribe } from '@/hooks/useSubscribe';
import { usePageMeta } from '@/lib/seo';
import { useSiteContent } from '@/context/SiteContentContext';

type Mode = 'all' | 'specific';

export function SubscribePage() {
  usePageMeta('Recibe Pangloss', 'Un aviso cuando publiquemos algo nuevo — nada más que eso.');

  const title = useSiteContent('subscribe.title');
  const intro = useSiteContent('subscribe.intro');
  const allLabel = useSiteContent('subscribe.allLabel');
  const allDescription = useSiteContent('subscribe.allDescription');
  const authorsLabel = useSiteContent('subscribe.authorsLabel');
  const categoriesLabel = useSiteContent('subscribe.categoriesLabel');
  const emailFieldLabel = useSiteContent('subscribe.emailFieldLabel');
  const disclaimer = useSiteContent('subscribe.disclaimer');
  const successTitle = useSiteContent('subscribe.successTitle');
  const successBodyTemplate = useSiteContent('subscribe.successBody');
  const successNote = useSiteContent('subscribe.successNote');

  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<Mode>('all');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedAuthors, setSelectedAuthors] = useState<Set<string>>(new Set());
  const { status, errorMessage, submit } = useSubscribe();

  useEffect(() => {
    Promise.all([getCategories(), getAuthors()]).then(([cats, aus]) => {
      setGroups(groupCategories(cats));
      setAuthors(aus);
    });
  }, []);

  function selectAll() {
    setMode('all');
    setSelectedCategories(new Set());
    setSelectedAuthors(new Set());
  }

  function toggleCategory(id: string) {
    setMode('specific');
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAuthor(id: string) {
    setMode('specific');
    setSelectedAuthors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const categoryIds = mode === 'all' ? [] : Array.from(selectedCategories);
    const authorIds = mode === 'all' ? [] : Array.from(selectedAuthors);
    submit(email, categoryIds, authorIds);
  }

  if (status === 'success') {
    // El email va en negrita dentro de la frase — se divide el texto por el
    // token {email} en vez de sustituirlo por texto plano, para conservar
    // ese énfasis sea cual sea la redacción que ponga el administrador.
    const [beforeEmail, afterEmail] = successBodyTemplate.split('{email}');
    return (
      <div className="max-w-editorial mx-auto px-6 py-24 text-center">
        <h1 className="font-serif text-3xl font-semibold text-text-primary mb-4">{successTitle}</h1>
        <p className="text-base font-sans text-text-secondary leading-relaxed">
          {afterEmail !== undefined ? (
            <>
              {beforeEmail}
              <strong className="text-text-primary">{email}</strong>
              {afterEmail}
            </>
          ) : (
            successBodyTemplate
          )}
        </p>
        <p className="text-sm font-sans text-text-muted leading-relaxed mt-4">{successNote}</p>
      </div>
    );
  }

  return (
    <div className="max-w-editorial mx-auto px-6 py-24">
      <h1 className="font-serif text-4xl font-semibold text-text-primary mb-3">{title}</h1>
      <p className="text-lg font-sans text-text-secondary leading-relaxed mb-12">{intro}</p>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div>
          <button
            type="button"
            onClick={selectAll}
            className={`w-full text-left px-5 py-4 rounded-lg border transition-colors ${
              mode === 'all' ? 'border-accent bg-accent-light' : 'border-border hover:border-text-primary'
            }`}
          >
            <span className={`block font-serif text-lg ${mode === 'all' ? 'text-accent' : 'text-text-primary'}`}>
              {allLabel}
            </span>
            <span className="block text-sm font-sans text-text-muted mt-0.5">{allDescription}</span>
          </button>
        </div>

        {authors.length > 0 && (
          <div>
            <p className="text-xs font-sans uppercase tracking-widest text-text-muted mb-3">{authorsLabel}</p>
            <div className="flex flex-wrap gap-2">
              {authors.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => toggleAuthor(a.id)}
                  className={`px-3.5 py-1.5 text-sm font-sans rounded-full border transition-colors ${
                    selectedAuthors.has(a.id)
                      ? 'border-accent bg-accent-light text-accent'
                      : 'border-border text-text-secondary hover:border-text-primary hover:text-text-primary'
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {groups.length > 0 && (
          <div>
            <p className="text-xs font-sans uppercase tracking-widest text-text-muted mb-3">{categoriesLabel}</p>
            <div className="space-y-3">
              {groups.map(({ parent, children }) => (
                <div key={parent.id}>
                  <button
                    type="button"
                    onClick={() => toggleCategory(parent.id)}
                    className={`px-3.5 py-1.5 text-sm font-sans rounded-full border transition-colors ${
                      selectedCategories.has(parent.id)
                        ? 'border-accent bg-accent-light text-accent'
                        : 'border-border text-text-secondary hover:border-text-primary hover:text-text-primary'
                    }`}
                  >
                    {parent.name}
                  </button>
                  {/* Subcategorías: solo si existen para este padre — nunca una fila vacía. */}
                  {children.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 ml-5">
                      {children.map((child) => (
                        <button
                          type="button"
                          key={child.id}
                          onClick={() => toggleCategory(child.id)}
                          className={`px-3 py-1 text-xs font-sans rounded-full border transition-colors ${
                            selectedCategories.has(child.id)
                              ? 'border-accent bg-accent-light text-accent'
                              : 'border-border-light text-text-muted hover:border-text-primary hover:text-text-primary'
                          }`}
                        >
                          {child.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <label className="block">
          <span className="text-xs font-sans uppercase tracking-widest text-text-muted">{emailFieldLabel}</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="mt-2 w-full border-b-2 border-border focus:border-text-primary outline-none py-2 text-lg font-serif text-text-primary bg-transparent transition-colors"
          />
        </label>

        {status === 'error' && <p className="text-sm font-sans text-accent">{errorMessage}</p>}

        <div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="text-sm font-sans uppercase tracking-widest bg-text-primary text-white px-6 py-3 hover:bg-accent transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? 'Enviando…' : 'Suscribirme'}
          </button>
          <p className="text-xs font-sans text-text-muted leading-relaxed mt-4">{disclaimer}</p>
        </div>
      </form>
    </div>
  );
}
