import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Pencil, Trash2, Send, CheckCircle2, Undo2, Archive, Eye } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getMyArticles, getAllArticlesAdmin, getInReviewArticles, setArticleStatus, deleteArticle } from '@/lib/services/articles.admin';
import type { Article, ArticleStatus } from '@/types/database';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatDateTime } from '@/lib/utils';

interface AdminArticlesProps {
  onlyMine?: boolean;
  reviewMode?: boolean;
}

const STATUS_FILTERS: { value: ArticleStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'draft', label: 'Borradores' },
  { value: 'in_review', label: 'En revisión' },
  { value: 'scheduled', label: 'Programados' },
  { value: 'published', label: 'Publicados' },
  { value: 'archived', label: 'Archivados' },
];

export function AdminArticles({ onlyMine, reviewMode }: AdminArticlesProps) {
  const { user, isEditor } = useAuth();
  const { showToast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | 'all'>('all');
  const [toDelete, setToDelete] = useState<Article | null>(null);

  async function reload() {
    if (onlyMine && !user) return; // solo esta rama necesita el usuario
    setLoading(true);
    const data = reviewMode ? await getInReviewArticles() : onlyMine ? await getMyArticles(user!.id) : await getAllArticlesAdmin();
    setArticles(data);
    setLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, onlyMine, reviewMode]);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (query && !a.title.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [articles, statusFilter, query]);

  async function handleStatusChange(a: Article, status: ArticleStatus) {
    try {
      await setArticleStatus(a.id, status);
      showToast(status === 'published' ? 'Artículo publicado.' : 'Estado actualizado.');
      reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo actualizar el estado.', 'error');
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    try {
      await deleteArticle(toDelete.id);
      showToast('Artículo eliminado.');
      setToDelete(null);
      reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo eliminar.', 'error');
    }
  }

  const title = reviewMode ? 'Revisión' : onlyMine ? 'Mis artículos' : 'Todos los artículos';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl font-semibold text-text-primary">{title}</h1>
        <Link to="/admin/articulos/nuevo" className="bg-text-primary text-white px-4 py-2 text-sm font-sans hover:bg-accent transition-colors">
          Nuevo
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título…"
            className="w-full pl-9 pr-3 py-2 text-sm font-sans border border-border outline-none focus:border-text-primary transition-colors"
          />
        </div>
        {!reviewMode && (
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 text-xs font-sans rounded-full border transition-colors ${
                  statusFilter === f.value ? 'bg-text-primary text-white border-text-primary' : 'text-text-secondary border-border hover:border-text-primary'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3" aria-hidden>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-border-light rounded" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Nada por aquí." description={reviewMode ? 'No hay artículos pendientes de revisión.' : 'No hay artículos que coincidan.'} />
      ) : (
        <div className="border-t border-border-light overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-text-muted border-b border-border-light">
                <th className="py-3 pr-4 font-medium">Título</th>
                <th className="py-3 pr-4 font-medium hidden md:table-cell">Categoría</th>
                <th className="py-3 pr-4 font-medium">Estado</th>
                <th className="py-3 pr-4 font-medium hidden sm:table-cell">Modificado</th>
                <th className="py-3 pr-2 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <ArticleRow
                  key={a.id}
                  article={a}
                  isEditor={isEditor}
                  isOwner={a.user_id === user?.id}
                  onStatusChange={handleStatusChange}
                  onDelete={() => setToDelete(a)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Eliminar artículo"
          description={`«${toDelete.title || 'Sin título'}» se eliminará permanentemente. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          danger
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}

function ArticleRow({
  article,
  isEditor,
  isOwner,
  onStatusChange,
  onDelete,
}: {
  article: Article;
  isEditor: boolean;
  isOwner: boolean;
  onStatusChange: (a: Article, status: ArticleStatus) => void;
  onDelete: () => void;
}) {
  const ownerEditableStatus = article.status === 'draft' || article.status === 'in_review' || article.status === 'scheduled';
  const canEdit = isEditor || (isOwner && ownerEditableStatus);
  const canDelete = isEditor || (isOwner && ownerEditableStatus);

  return (
    <tr className="border-b border-border-light hover:bg-surface transition-colors">
      <td className="py-3 pr-4">
        <Link to={`/admin/articulos/${article.id}/editar`} className="text-text-primary hover:text-accent transition-colors font-medium">
          {article.title || 'Sin título'}
        </Link>
      </td>
      <td className="py-3 pr-4 hidden md:table-cell text-text-secondary">{article.category?.name ?? '—'}</td>
      <td className="py-3 pr-4">
        <StatusBadge status={article.status} />
        {article.status === 'scheduled' && article.published_at && (
          <p className="text-[11px] font-sans text-text-muted mt-0.5">{formatDateTime(article.published_at)}</p>
        )}
      </td>
      <td className="py-3 pr-4 hidden sm:table-cell text-text-muted">{formatDate(article.updated_at)}</td>
      <td className="py-3 pr-2">
        <div className="flex items-center justify-end gap-1">
          {canEdit && (
            <IconAction to={`/admin/articulos/${article.id}/editar`} label="Editar" icon={Pencil} />
          )}
          {article.status === 'draft' && (isOwner || isEditor) && (
            <IconAction label="Enviar a revisión" icon={Send} onClick={() => onStatusChange(article, 'in_review')} />
          )}
          {article.status === 'in_review' && isEditor && (
            <>
              <IconAction label="Publicar" icon={CheckCircle2} onClick={() => onStatusChange(article, 'published')} />
              <IconAction label="Devolver a borrador" icon={Undo2} onClick={() => onStatusChange(article, 'draft')} />
            </>
          )}
          {article.status === 'scheduled' && isEditor && (
            <>
              <IconAction label="Publicar ahora" icon={CheckCircle2} onClick={() => onStatusChange(article, 'published')} />
              <IconAction label="Devolver a borrador" icon={Undo2} onClick={() => onStatusChange(article, 'draft')} />
            </>
          )}
          {article.status === 'published' && (
            <>
              <IconAction to={`/articulo/${article.slug}`} label="Ver en el sitio" icon={Eye} external />
              {isEditor && <IconAction label="Archivar" icon={Archive} onClick={() => onStatusChange(article, 'archived')} />}
            </>
          )}
          {article.status === 'archived' && isEditor && (
            <IconAction label="Restaurar a borrador" icon={Undo2} onClick={() => onStatusChange(article, 'draft')} />
          )}
          {canDelete && <IconAction label="Eliminar" icon={Trash2} onClick={onDelete} tone="danger" />}
        </div>
      </td>
    </tr>
  );
}

function IconAction({
  label,
  icon: Icon,
  onClick,
  to,
  external,
  tone,
}: {
  label: string;
  icon: typeof Pencil;
  onClick?: () => void;
  to?: string;
  external?: boolean;
  tone?: 'danger';
}) {
  const className = `p-1.5 rounded transition-colors ${tone === 'danger' ? 'text-text-muted hover:text-accent hover:bg-accent-light' : 'text-text-muted hover:text-text-primary hover:bg-surface'}`;
  if (to) {
    return external ? (
      <a href={to} target="_blank" rel="noopener noreferrer" title={label} aria-label={label} className={className}>
        <Icon className="w-4 h-4" />
      </a>
    ) : (
      <Link to={to} title={label} aria-label={label} className={className}>
        <Icon className="w-4 h-4" />
      </Link>
    );
  }
  return (
    <button onClick={onClick} title={label} aria-label={label} className={className}>
      <Icon className="w-4 h-4" />
    </button>
  );
}
