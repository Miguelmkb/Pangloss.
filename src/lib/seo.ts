import { useEffect } from 'react';

const SITE_NAME = 'Pangloss';

/**
 * Meta tags dinámicos del lado del cliente — cubre la pestaña del navegador
 * y los crawlers que sí ejecutan JS. Para compartidos en redes (que
 * necesitan el HTML servido con las etiquetas ya puestas) está prevista la
 * Netlify Function de la Fase 9/10, según lo acordado.
 */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Revista de ideas`;
    document.title = fullTitle;

    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', 'description');
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', description);
    }
  }, [title, description]);
}
