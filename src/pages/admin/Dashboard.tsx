import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, FileText, Eye, Archive, Users, Tag, PenSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getDashboardCounts, getRecentActivity, type DashboardCounts } from '@/lib/services/articles.admin';
import type { Article } from '@/types/database';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { formatDate } from '@/lib/utils';

export function Dashboard() {
  const { profile } = useAuth();
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [recent, setRecent] = useState<Article[]>([]);

  useEffect(() => {
    Promise.all([getDashboardCounts(), getRecentActivity()]).then(([c, r]) => {
      setCounts(c);
      setRecent(r);
    });
  }, []);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-text-primary mb-1">Dashboard</h1>
          <p className="text-sm font-sans text-text-secondary">Bienvenido, {profile?.display_name ?? 'a Pangloss'}.</p>
        </div>
        <Link
          to="/admin/articulos/nuevo"
          className="inline-flex items-center gap-1.5 bg-text-primary text-white px-4 py-2 text-sm font-sans hover:bg-accent transition-colors"
        >
          <PenSquare className="w-3.5 h-3.5" /> Nuevo artículo
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border-light mb-6">
        <StatTile icon={CheckCircle2} label="Publicados" value={counts?.published} tone="success" />
        <StatTile icon={FileText} label="Borradores" value={counts?.draft} />
        <StatTile icon={Eye} label="En revisión" value={counts?.in_review} tone="warning" />
        <StatTile icon={Archive} label="Archivados" value={counts?.archived} />
      </div>

      <div className="grid grid-cols-3 gap-px bg-border-light mb-10">
        <StatTile icon={Users} label="Autores" value={counts?.authors} compact />
        <StatTile icon={Users} label="Usuarios" value={counts?.users} compact />
        <StatTile icon={Tag} label="Categorías" value={counts?.categories} compact />
      </div>

      <h2 className="font-serif text-xl font-semibold text-text-primary mb-4">Actividad reciente</h2>
      {recent.length === 0 ? (
        <p className="text-sm font-sans text-text-muted py-8">Todavía no hay artículos.</p>
      ) : (
        <div className="border-t border-border-light">
          {recent.map((a) => (
            <Link
              key={a.id}
              to={`/admin/articulos/${a.id}/editar`}
              className="flex items-center justify-between gap-4 py-3.5 border-b border-border-light hover:bg-surface transition-colors px-2 -mx-2"
            >
              <span className="text-sm font-sans text-text-primary truncate">{a.title || 'Sin título'}</span>
              <span className="flex items-center gap-4 flex-shrink-0">
                <span className="text-xs font-sans text-text-muted hidden sm:inline">{formatDate(a.updated_at)}</span>
                <StatusBadge status={a.status} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
  compact,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: number | undefined;
  tone?: 'success' | 'warning';
  compact?: boolean;
}) {
  return (
    <div className="bg-white p-5">
      <div className={`flex items-center gap-1.5 text-xs font-sans uppercase tracking-widest mb-2 ${tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-text-muted'}`}>
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className={`font-serif ${compact ? 'text-2xl' : 'text-3xl'} text-text-primary`}>{value ?? '—'}</p>
    </div>
  );
}
