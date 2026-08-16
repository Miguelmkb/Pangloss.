import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, CornerDownRight } from 'lucide-react';
import { getCategories, groupCategories } from '@/lib/services/categories';
import { createCategory, updateCategory, deleteCategory, type CategoryInput } from '@/lib/services/categories.admin';
import type { Category } from '@/types/database';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { slugify } from '@/lib/utils';

export function AdminCategories() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  async function reload() {
    setLoading(true);
    setCategories(await getCategories());
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleDelete() {
    if (!toDelete) return;
    try {
      await deleteCategory(toDelete.id);
      showToast('Categoría eliminada.');
      setToDelete(null);
      reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo eliminar.', 'error');
    }
  }

  const groups = groupCategories(categories);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-text-primary mb-1">Categorías</h1>
          <p className="text-sm font-sans text-text-secondary">Áreas temáticas y subsecciones de Pangloss.</p>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="inline-flex items-center gap-1.5 bg-text-primary text-white px-4 py-2 text-sm font-sans hover:bg-accent transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva
        </button>
      </div>

      {!loading && (
        <div className="border-t border-border-light">
          {groups.map(({ parent, children }) => (
            <div key={parent.id}>
              <CategoryRow category={parent} onEdit={() => setEditing(parent)} onDelete={() => setToDelete(parent)} />
              {children.map((child) => (
                <CategoryRow key={child.id} category={child} nested onEdit={() => setEditing(child)} onDelete={() => setToDelete(child)} />
              ))}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <CategoryFormModal
          category={editing === 'new' ? null : editing}
          parents={categories.filter((c) => !c.parent_id)}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title="Eliminar categoría"
          description={`«${toDelete.name}» se eliminará. Los artículos que la usan quedarán sin categoría.`}
          confirmLabel="Eliminar"
          danger
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}

function CategoryRow({ category, nested, onEdit, onDelete }: { category: Category; nested?: boolean; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className={`flex items-center gap-3 py-3.5 border-b border-border-light ${nested ? 'pl-8' : ''}`}>
      {nested && <CornerDownRight className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-sans font-medium text-text-primary">{category.name}</p>
        <p className="text-xs font-sans text-text-muted">/{category.slug}</p>
      </div>
      <button onClick={onEdit} aria-label="Editar" className="p-1.5 text-text-muted hover:text-text-primary transition-colors">
        <Pencil className="w-4 h-4" />
      </button>
      <button onClick={onDelete} aria-label="Eliminar" className="p-1.5 text-text-muted hover:text-accent transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function CategoryFormModal({
  category,
  parents,
  onClose,
  onSaved,
}: {
  category: Category | null;
  parents: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const [name, setName] = useState(category?.name ?? '');
  const [slug, setSlug] = useState(category?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const [description, setDescription] = useState(category?.description ?? '');
  const [parentId, setParentId] = useState(category?.parent_id ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);
    const input: CategoryInput = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      parent_id: parentId || null,
    };
    try {
      if (category) await updateCategory(category.id, input);
      else await createCategory(input);
      showToast(category ? 'Categoría actualizada.' : 'Categoría creada.');
      onSaved();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo guardar.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={category ? 'Editar categoría' : 'Nueva categoría'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <span className="text-xs font-sans uppercase tracking-widest text-text-muted">Descripción</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1.5 w-full border border-border px-3 py-2 text-sm font-sans outline-none focus:border-text-primary"
          />
        </label>
        <label className="block">
          <span className="text-xs font-sans uppercase tracking-widest text-text-muted">Categoría padre</span>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="mt-1.5 w-full border border-border px-2.5 py-2 text-sm font-sans outline-none focus:border-text-primary"
          >
            <option value="">— Categoría principal —</option>
            {parents
              .filter((p) => p.id !== category?.id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
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
