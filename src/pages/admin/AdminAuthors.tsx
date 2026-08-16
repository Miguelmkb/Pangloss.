import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { getAllAuthorsAdmin, createAuthor, updateAuthor, deleteAuthor, type AuthorInput } from '@/lib/services/authors.admin';
import { uploadPublicImage } from '@/lib/services/storage';
import type { Author } from '@/types/database';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { AuthorAvatar } from '@/pages/public/AuthorsPage';
import { slugify } from '@/lib/utils';

export function AdminAuthors() {
  const { showToast } = useToast();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Author | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<Author | null>(null);

  async function reload() {
    setLoading(true);
    setAuthors(await getAllAuthorsAdmin());
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleDelete() {
    if (!toDelete) return;
    try {
      await deleteAuthor(toDelete.id);
      showToast('Autor eliminado.');
      setToDelete(null);
      reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo eliminar.', 'error');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-text-primary mb-1">Autores</h1>
          <p className="text-sm font-sans text-text-secondary">Perfiles editoriales de Pangloss.</p>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="inline-flex items-center gap-1.5 bg-text-primary text-white px-4 py-2 text-sm font-sans hover:bg-accent transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo autor
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3" aria-hidden>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-border-light rounded" />
          ))}
        </div>
      ) : authors.length === 0 ? (
        <EmptyState title="Todavía no hay autores." description="Crea el primero con “Nuevo autor”." />
      ) : (
        <div className="border-t border-border-light">
          {authors.map((a) => (
            <div key={a.id} className="flex items-center gap-4 py-4 border-b border-border-light">
              <AuthorAvatar name={a.name} photoUrl={a.photo_url} size={40} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-sans font-medium text-text-primary">{a.name}</p>
                <p className="text-xs font-sans text-text-muted">/{a.slug}</p>
              </div>
              <span className={`text-xs font-sans ${a.active ? 'text-success' : 'text-text-muted'}`}>{a.active ? 'Activo' : 'Inactivo'}</span>
              <button
                onClick={() => updateAuthor(a.id, { active: !a.active }).then(reload)}
                className="text-xs font-sans text-text-muted hover:text-text-primary transition-colors"
              >
                {a.active ? 'Desactivar' : 'Activar'}
              </button>
              <button onClick={() => setEditing(a)} aria-label="Editar" className="p-1.5 text-text-muted hover:text-text-primary transition-colors">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => setToDelete(a)} aria-label="Eliminar" className="p-1.5 text-text-muted hover:text-accent transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <AuthorFormModal
          author={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title="Eliminar autor"
          description={`«${toDelete.name}» se eliminará. Los artículos que le pertenecen quedarán sin autor asignado.`}
          confirmLabel="Eliminar"
          danger
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}

function AuthorFormModal({ author, onClose, onSaved }: { author: Author | null; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast();
  const [name, setName] = useState(author?.name ?? '');
  const [slug, setSlug] = useState(author?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(author));
  const [bio, setBio] = useState(author?.bio ?? '');
  const [photoUrl, setPhotoUrl] = useState(author?.photo_url ?? null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handlePhotoChange(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadPublicImage('author-photos', author?.id ?? crypto.randomUUID(), file);
      setPhotoUrl(url);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo subir la foto.', 'error');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);
    const input: AuthorInput = { name: name.trim(), slug: slug.trim(), bio: bio.trim() || null, photo_url: photoUrl };
    try {
      if (author) await updateAuthor(author.id, input);
      else await createAuthor(input);
      showToast(author ? 'Autor actualizado.' : 'Autor creado.');
      onSaved();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo guardar.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={author ? 'Editar autor' : 'Nuevo autor'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-4">
          <AuthorAvatar name={name || '?'} photoUrl={photoUrl} size={56} />
          <label className="text-sm font-sans text-accent hover:text-accent-hover transition-colors cursor-pointer">
            {uploading ? 'Subiendo…' : 'Cambiar foto'}
            <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => handlePhotoChange(e.target.files?.[0])} />
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-sans uppercase tracking-widest text-text-muted">Nombre</span>
          <input
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            className="mt-1.5 w-full border border-border px-3 py-2 text-sm font-sans outline-none focus:border-text-primary"
          />
        </label>
        <label className="block">
          <span className="text-xs font-sans uppercase tracking-widest text-text-muted">Slug</span>
          <input
            required
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            className="mt-1.5 w-full border border-border px-3 py-2 text-sm font-sans outline-none focus:border-text-primary font-mono text-xs"
          />
        </label>
        <label className="block">
          <span className="text-xs font-sans uppercase tracking-widest text-text-muted">Biografía</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="mt-1.5 w-full border border-border px-3 py-2 text-sm font-sans outline-none focus:border-text-primary resize-none"
          />
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-sans text-text-secondary hover:text-text-primary transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-sans uppercase tracking-widest bg-text-primary text-white hover:bg-accent transition-colors disabled:opacity-50">
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
