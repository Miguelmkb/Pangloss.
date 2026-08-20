/** Formato editorial: "13 de agosto de 2026". */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
}

/** Fecha + hora, para cuando el momento exacto importa (publicación
 * programada) y no solo el día — a diferencia de `formatDate`. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export function readingTimeLabel(minutes: number): string {
  const m = Math.max(1, Math.round(minutes));
  return `${m} min de lectura`;
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // "café" -> "cafe" antes de limpiar el resto
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
