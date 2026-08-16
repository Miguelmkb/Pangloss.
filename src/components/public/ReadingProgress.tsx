import { useEffect, useRef } from 'react';

/**
 * Línea de progreso de lectura — casi imperceptible a propósito. Mide el
 * scroll del propio `<article>`, no del documento entero (así el 100% cae
 * justo al terminar el texto, no al terminar el footer). No usa React
 * state: escribe directamente el estilo en cada frame vía rAF para que sea
 * fluida y no dispare re-renders del árbol de la página en cada scroll.
 */
export function ReadingProgress({ targetRef }: { targetRef: React.RefObject<HTMLElement> }) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId = 0;

    function update() {
      const el = targetRef.current;
      const bar = barRef.current;
      if (!el || !bar) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const pct = total > 0 ? Math.min(100, Math.max(0, (scrolled / total) * 100)) : 0;
      bar.style.width = `${pct}%`;
    }

    function onScroll() {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [targetRef]);

  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[70] bg-transparent" aria-hidden>
      <div ref={barRef} className="reading-progress-bar h-full bg-accent" style={{ width: 0 }} />
    </div>
  );
}
