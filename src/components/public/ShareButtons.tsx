import { useState } from 'react';
import { Copy, Check, Mail, Share2 } from 'lucide-react';

/** Glifos oficiales mínimos, monocromos (heredan `currentColor`) — lucide
 * no trae X ni WhatsApp, y un icono de marca a todo color desentonaría con
 * el resto de iconografía del sitio, que es toda monocroma. */
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
      <path d="M13.6 10.6 20.4 3h-1.6l-5.9 6.6L8.2 3H2.5l7.1 10.1L2.5 21h1.6l6.2-7 5 7h5.7l-7.4-10.4Zm-2.2 2.5-.7-1L4.9 4.2h2.5l4.6 6.5.7 1 6 8.4h-2.5l-4.8-6.6Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
      <path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.6l.4-.4c.1-.1.2-.3.2-.4.1-.2 0-.3 0-.5s-.6-1.5-.8-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.5 1.1 2.7c.1.2 2 3 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.6-.7 1.9-1.3.2-.6.2-1.1.2-1.2-.1-.2-.3-.2-.6-.3ZM12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Z" />
    </svg>
  );
}

/**
 * Fila discreta de "compartir" al final del artículo — copiar enlace, X,
 * WhatsApp, email. Sin SDK ni claves de API: cada botón es un enlace de
 * intención (`https://twitter.com/intent/...`, `https://wa.me/...`,
 * `mailto:`), lo mismo que hace cualquier sitio sin integrar el "share
 * kit" propio de cada red. `navigator.share` (el panel nativo del propio
 * sistema) se usa en vez de esta fila cuando el navegador lo soporta —
 * normalmente todos los móviles, casi ningún escritorio — porque ahí da
 * más opciones que estos cuatro enlaces y es la ruta que el usuario ya
 * conoce en su teléfono.
 */
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* portapapeles no disponible (permiso denegado, contexto no seguro…) — sin feedback, no hay más que hacer */
    }
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      /* el usuario cerró el panel del sistema, o falló — no es un error que mostrar */
    }
  }

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  // Con `navigator.share` disponible (prácticamente todo móvil, casi
  // ningún escritorio) un único botón basta y da más opciones que estos
  // cuatro enlaces — mostrar ambos a la vez sería redundante, no "sutil".
  if (canNativeShare) {
    return (
      <button onClick={handleNativeShare} aria-label="Compartir" title="Compartir" className="p-2 text-text-muted hover:text-accent transition-colors">
        <Share2 className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={handleCopy}
        aria-label={copied ? 'Enlace copiado' : 'Copiar enlace'}
        title={copied ? 'Enlace copiado' : 'Copiar enlace'}
        className="p-2 text-text-muted hover:text-accent transition-colors"
      >
        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
      </button>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartir en X"
        title="Compartir en X"
        className="p-2 text-text-muted hover:text-accent transition-colors"
      >
        <XIcon />
      </a>
      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartir por WhatsApp"
        title="Compartir por WhatsApp"
        className="p-2 text-text-muted hover:text-accent transition-colors"
      >
        <WhatsAppIcon />
      </a>
      <a
        href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}
        aria-label="Compartir por email"
        title="Compartir por email"
        className="p-2 text-text-muted hover:text-accent transition-colors"
      >
        <Mail className="w-4 h-4" />
      </a>
    </div>
  );
}
