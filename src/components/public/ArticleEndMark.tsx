/** Remate editorial genérico al final de cualquier artículo — una pequeña
 * marca de cierre, como en una revista impresa, antes de pasar a lo
 * siguiente. Las secciones con identidad propia pueden sustituirla. */
export function ArticleEndMark() {
  return (
    <div className="article-end-mark" aria-hidden="true">
      <span className="font-serif text-lg tracking-[0.4em] text-text-muted">· · ·</span>
    </div>
  );
}
