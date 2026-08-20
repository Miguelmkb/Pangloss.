import { useEffect, useState } from 'react';
import type { Article } from '@/types/database';
import { getRelatedCandidates, getRelatedArticleIds, setRelatedArticles } from '@/lib/services/articles.admin';
import { useToast } from '@/context/ToastContext';

const SLOTS = [0, 1, 2] as const;

/**
 * Hasta 3 artículos relacionados, elegidos a mano — tres selectores
 * independientes en vez de un widget de selección múltiple: mismo patrón
 * ya usado para Autor/Categoría al lado, y el límite de 3 queda impuesto
 * solo con que haya exactamente tres huecos, sin validación aparte.
 * Guarda directamente en `article_related` al cambiar cualquier hueco — es
 * una tabla propia, no un campo de `articles`, así que no pasa por el
 * autoguardado del resto del formulario (mismo patrón que
 * `ReferencesPanel`).
 */
export function RelatedArticlesPicker({ articleId }: { articleId: string }) {
  const { showToast } = useToast();
  const [candidates, setCandidates] = useState<Article[]>([]);
  const [selected, setSelected] = useState<(string | null)[]>([null, null, null]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getRelatedCandidates(articleId), getRelatedArticleIds(articleId)]).then(([cands, ids]) => {
      setCandidates(cands);
      setSelected([ids[0] ?? null, ids[1] ?? null, ids[2] ?? null]);
      setLoading(false);
    });
  }, [articleId]);

  async function updateSlot(slot: number, value: string | null) {
    const next = selected.map((v, i) => (i === slot ? value : v));
    setSelected(next);
    try {
      await setRelatedArticles(
        articleId,
        next.filter((v): v is string => v !== null),
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo guardar el relacionado.', 'error');
    }
  }

  if (loading) return null;

  return (
    <div className="border border-border p-5 space-y-3">
      <p className="text-xs font-sans uppercase tracking-widest text-text-muted">Artículos relacionados</p>
      {SLOTS.map((slot) => {
        const usedElsewhere = selected.filter((v, i) => i !== slot && v !== null);
        return (
          <select
            key={slot}
            value={selected[slot] ?? ''}
            onChange={(e) => updateSlot(slot, e.target.value || null)}
            className="w-full border border-border px-2.5 py-2 text-sm font-sans outline-none focus:border-text-primary"
          >
            <option value="">— Ninguno —</option>
            {candidates
              .filter((c) => !usedElsewhere.includes(c.id))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title || 'Sin título'}
                </option>
              ))}
          </select>
        );
      })}
      <p className="text-[11px] font-sans text-text-muted leading-relaxed">
        Aparecen al final del artículo, en el orden de estos huecos. Si uno deja de estar publicado, se salta solo, sin
        romper la sección.
      </p>
    </div>
  );
}
