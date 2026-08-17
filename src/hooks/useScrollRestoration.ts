import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const STORAGE_PREFIX = 'pangloss:scroll:';
// Margen para reintentar la restauración mientras la página todavía está
// creciendo (datos en camino desde Supabase). Pasado esto, se deja de
// insistir — mejor quedarse donde el reintento llegó que perseguir un
// objetivo que quizá nunca aparezca (p. ej. el artículo ya no existe).
const RESTORE_TIMEOUT_MS = 1500;

function saveScroll(key: string) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, String(window.scrollY));
  } catch {
    // Modo privado con almacenamiento agotado, por ejemplo. No es grave:
    // en el peor caso, esa entrada concreta no restaura su scroll.
  }
}

function readScroll(key: string): number | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    return raw === null ? null : Number(raw);
  } catch {
    return null;
  }
}

// Le retiramos al navegador el control de restaurar el scroll. Su intento
// automático ('auto') se dispara en el instante del popstate, usando la
// altura del documento en ESE momento — y todas las páginas de Pangloss
// cargan su contenido de forma asíncrona (fetch a Supabase al montar), así
// que casi siempre esa altura es todavía la del estado de carga, no la
// final. El navegador no reintenta después. Restaurarlo nosotros mismos,
// en cuanto el contenido ya mide lo suficiente, es lo único fiable.
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

/**
 * Lleva el scroll al principio en cada navegación "hacia adelante" real
 * (clic en un enlace, `navigate()`) — cambio de ruta O de query string,
 * nunca solo por cambiar el hash. Y restaura la posición exacta al volver
 * con ← / → del navegador. Se abstiene en un caso:
 *
 * Hay un `hash` en la URL de destino (p. ej. `#nota-3` de una nota al pie):
 * ahí el propio navegador salta al elemento con ese id — cualquier scroll
 * programado por nuestra parte lo cancelaría.
 *
 * Un único hook, usado tanto en el layout público como en el del panel
 * editorial — nunca hay que tocar un enlace concreto para que esto
 * funcione.
 */
export function useScrollRestoration() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const currentKeyRef = useRef(location.key);
  currentKeyRef.current = location.key;

  // Guarda la posición de scroll de la entrada activa mientras el usuario
  // se mueve por ella, con un throttle a un frame por scroll — así siempre
  // hay un valor reciente listo para cuando se vuelva a esta entrada.
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        saveScroll(currentKeyRef.current);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (location.hash) return;

    if (navigationType !== 'POP') {
      window.scrollTo(0, 0);
      return;
    }

    const target = readScroll(location.key);
    if (target === null) return; // Nada guardado para esta entrada: no forzar nada.

    let cancelled = false;
    const start = performance.now();
    const attempt = () => {
      if (cancelled) return;
      window.scrollTo(0, target);
      const closeEnough = Math.abs(window.scrollY - target) < 2;
      if (closeEnough || performance.now() - start > RESTORE_TIMEOUT_MS) return;
      requestAnimationFrame(attempt);
    };
    requestAnimationFrame(attempt);

    return () => {
      cancelled = true;
    };
  }, [location.key, location.pathname, location.search, location.hash, navigationType]);
}
