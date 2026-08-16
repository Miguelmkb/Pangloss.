import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { getReferences, createReference, deleteReference } from '@/lib/services/references.admin';
import type { ArticleReference, ReferenceType } from '@/types/database';
import { useToast } from '@/context/ToastContext';

const TYPES: { value: ReferenceType; label: string }[] = [
  { value: 'book', label: 'Libro' },
  { value: 'article', label: 'Artículo' },
  { value: 'report', label: 'Informe' },
  { value: 'document', label: 'Documento' },
  { value: 'website', label: 'Sitio web' },
  { value: 'other', label: 'Otro' },
];

export function ReferencesPanel({ articleId }: { articleId: string }) {
  const { showToast } = useToast();
  const [refs, setRefs] = useState<ArticleReference[]>([]);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [year, setYear] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<ReferenceType>('book');

  useEffect(() => {
    getReferences(articleId).then(setRefs);
  }, [articleId]);

  async function handleAdd() {
    if (!title.trim()) return;
    try {
      const ref = await createReference(articleId, {
        type,
        title: title.trim(),
        authors: authors.trim() || null,
        year: year ? Number(year) : null,
        url: url.trim() || null,
      });
      setRefs((prev) => [...prev, ref]);
      setTitle('');
      setAuthors('');
      setYear('');
      setUrl('');
      setAdding(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo añadir.', 'error');
    }
  }

  async function handleDelete(id: string) {
    setRefs((prev) => prev.filter((r) => r.id !== id));
    try {
      await deleteReference(id);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo eliminar.', 'error');
    }
  }

  return (
    <div className="border border-border p-5">
      <p className="text-xs font-sans uppercase tracking-widest text-text-muted mb-3">Referencias</p>

      {refs.length > 0 && (
        <ul className="space-y-2 mb-3">
          {refs.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-2 text-xs font-sans text-text-secondary">
              <span>
                {r.title}
                {r.year ? ` (${r.year})` : ''}
              </span>
              <button onClick={() => handleDelete(r.id)} className="text-text-muted hover:text-accent transition-colors flex-shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <div className="space-y-2">
          <select value={type} onChange={(e) => setType(e.target.value as ReferenceType)} className="w-full border border-border px-2 py-1.5 text-xs font-sans outline-none focus:border-text-primary">
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className="w-full border border-border px-2 py-1.5 text-xs font-sans outline-none focus:border-text-primary" />
          <input value={authors} onChange={(e) => setAuthors(e.target.value)} placeholder="Autores" className="w-full border border-border px-2 py-1.5 text-xs font-sans outline-none focus:border-text-primary" />
          <div className="flex gap-2">
            <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Año" className="w-16 border border-border px-2 py-1.5 text-xs font-sans outline-none focus:border-text-primary" />
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL (opcional)" className="flex-1 border border-border px-2 py-1.5 text-xs font-sans outline-none focus:border-text-primary" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setAdding(false)} className="text-xs font-sans text-text-muted hover:text-text-primary transition-colors">
              Cancelar
            </button>
            <button onClick={handleAdd} className="text-xs font-sans uppercase tracking-widest bg-text-primary text-white px-3 py-1.5 hover:bg-accent transition-colors">
              Añadir
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 text-xs font-sans text-accent hover:text-accent-hover transition-colors">
          <Plus className="w-3.5 h-3.5" /> Añadir referencia
        </button>
      )}
    </div>
  );
}
