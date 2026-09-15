import { useRef, useState, type KeyboardEvent, type TouchEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '@/types/database';

const SWIPE_THRESHOLD_PX = 40;

/**
 * Hasta 3 artículos relacionados, elegidos a mano en el editor — uno visible
 * a la vez, nunca los tres como tarjetas grandes a la vez (así lo pidió el
 * diseño: "muy limpia", no una parrilla más). Con 2 o 3, unos puntos
 * discretos debajo permiten pasar de uno a otro; con solo 1, ni siquiera se
 * muestran (nada que elegir). Sin autoplay — el lector decide si quiere ver
 * los demás. La transición es un fundido corto (reutiliza `.page-fade-in`,
 * la misma clase ya usada para el cambio de página pública) en vez de un
 * desplazamiento tipo carrusel — se siente como pasar de página, no como un
 * carrusel de tienda online. Altura reservada fija (aspect-ratio en la
 * imagen + `min-height` en el título con `line-clamp`) para que cambiar de
 * artículo nunca mueva nada alrededor.
 */
export function RelatedCarousel({ articles, label }: { articles: Article[]; label: string }) {
  const [active, setActive] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (articles.length === 0) return null;
  const count = articles.length;
  const current = articles[Math.min(active, count - 1)];

  function go(delta: number) {
    if (count < 2) return;
    setActive((i) => (i + delta + count) % count);
  }

  function handleTouchStart(e: TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta > SWIPE_THRESHOLD_PX) go(-1);
    else if (delta < -SWIPE_THRESHOLD_PX) go(1);
  }

  // Flechas de teclado además de Tab+Enter sobre los puntos — cualquier
  // elemento con foco dentro de la sección las recibe por burbujeo.
  function handleKeyDown(e: KeyboardEvent) {
    if (count < 2) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    }
  }

  return (
    <section className="max-w-editorial mx-auto px-6 pb-16" onKeyDown={handleKeyDown}>
      <p className="text-xs font-sans uppercase tracking-widest text-text-muted mb-4">{label}</p>

      <div
        key={current.id}
        className="page-fade-in"
        aria-live="polite"
        onTouchStart={count > 1 ? handleTouchStart : undefined}
        onTouchEnd={count > 1 ? handleTouchEnd : undefined}
      >
        <Link to={`/articulo/${current.slug}`} className="group block">
          <div className="w-full aspect-[16/9] bg-border-light rounded-sm overflow-hidden mb-3">
            {current.featured_image_url && (
              <img
                src={current.featured_image_url}
                alt={current.featured_image_alt ?? ''}
                loading="lazy"
                className="w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-85"
              />
            )}
          </div>
          <h3 className="font-serif text-xl font-semibold text-text-primary leading-snug line-clamp-2 min-h-[3.5rem] group-hover:text-accent transition-colors">
            {current.title || 'Sin título'}
          </h3>
        </Link>
      </div>

      {articles.length > 1 && (
        <div className="flex items-center justify-center gap-2.5 mt-5">
          {articles.map((a, i) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ver artículo relacionado ${i + 1} de ${articles.length}: ${a.title || 'Sin título'}`}
              aria-current={i === active}
              className={`w-2 h-2 rounded-full transition-colors ${i === active ? 'bg-accent' : 'bg-border hover:bg-text-muted'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
