import type { ArticleStatus } from '@/types/database';
import { STATUS_LABELS } from '@/types/database';

const STYLES: Record<ArticleStatus, string> = {
  draft: 'text-text-muted',
  in_review: 'text-warning',
  published: 'text-success',
  archived: 'text-text-muted',
};

export function StatusBadge({ status }: { status: ArticleStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-sans font-medium ${STYLES[status]}`}>
      <span className={`status-dot status-dot-${status}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}
