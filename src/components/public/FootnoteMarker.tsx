import { useState } from 'react';

/**
 * En un artículo largo, saltar al final por cada nota y volver rompe la
 * lectura. En escritorio, pasar el ratón muestra el texto de la nota ahí
 * mismo; el enlace sigue funcionando por si se quiere ir a la lista
 * completa. En táctil, el primer toque muestra la nota en lugar de saltar.
 */
export function FootnoteMarker({ id, number, text }: { id: string; number: number | undefined; text: string }) {
  const [open, setOpen] = useState(false);
  const popoverId = `footnote-popover-${id}`;

  return (
    <sup className="footnote-marker-wrap">
      <a
        href={`#nota-${id}`}
        id={`ref-${id}`}
        className="footnote-ref"
        aria-describedby={text ? popoverId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          if (window.matchMedia('(hover: none)').matches) {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
      >
        [{number ?? '?'}]
      </a>
      {open && text && (
        <span id={popoverId} className="footnote-popover" role="tooltip">
          {text}
        </span>
      )}
    </sup>
  );
}
