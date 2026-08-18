import { useEffect } from 'react';

const SITE_NAME = 'Pangloss';

function setMeta(selector: string, attr: string, value: string) {
  let tag = document.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    const [, attrName, attrValue] = selector.match(/meta\[(\w+)="([^"]+)"\]/) ?? [];
    if (attrName && attrValue) tag.setAttribute(attrName, attrValue);
    document.head.appendChild(tag);
  }
  tag.setAttribute(attr, value);
}

/**
 * Meta tags dinámicos del lado del cliente — cubre la pestaña del
 * navegador y cualquier crawler que sí ejecute JS (p. ej. Google). Para
 * compartidos en redes sociales, que necesitan el HTML servido con las
 * etiquetas ya puestas sin ejecutar nada, está la Netlify Edge Function
 * `netlify/edge-functions/prerender.ts` — esta función y aquella cubren
 * casos distintos, no se solapan.
 */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Revista de ideas`;
    document.title = fullTitle;
    setMeta('meta[property="og:title"]', 'content', fullTitle);
    setMeta('meta[name="twitter:title"]', 'content', fullTitle);

    if (description) {
      setMeta('meta[name="description"]', 'content', description);
      setMeta('meta[property="og:description"]', 'content', description);
      setMeta('meta[name="twitter:description"]', 'content', description);
    }
  }, [title, description]);
}
