import { useEffect, useRef, useState } from 'react';

interface Bubble {
  id: number;
  side: 'left' | 'right';
  offset: number; // vw de distancia al borde de esa columna lateral
  size: number;
  duration: number;
  drift: number; // px de deriva lateral total durante el ascenso
  dot: boolean;
  highlights: 1 | 2;
}

let bubbleSeq = 0;

const MAX_PER_SIDE = 12; // tope por lado cuando el scroll va rápido
const MIN_VIEWPORT = 900; // por debajo, la columna editorial ya no deja margen libre a los lados

function randomEnergyThreshold() {
  // Umbral de "energía" de scroll acumulada hasta la siguiente burbuja.
  // Bajo a propósito: con scroll rápido debe poder llenar los MAX_PER_SIDE
  // huecos de un lado en una sola pasada continua, no solo generar una
  // burbuja suelta.
  return 40 + Math.random() * 70;
}

// Nº de burbujas permitidas por lado a la velocidad actual: casi ninguna en
// reposo o scroll lento, hasta MAX_PER_SIDE con scroll rápido sostenido.
function targetPerSide(speed: number) {
  const speedFactor = Math.min(speed / 900, 1); // 0..1
  return Math.max(1, Math.round(1 + speedFactor * (MAX_PER_SIDE - 1)));
}

function makeBubble(side: 'left' | 'right', speed: number): Bubble {
  const speedFactor = Math.min(speed / 900, 1); // 0..1
  return {
    id: ++bubbleSeq,
    side,
    offset: 1 + Math.random() * 7,
    // Sesgada hacia tamaños pequeños (curva de potencia), con alguna más
    // grande ocasional para dar variedad — "algunas más pequeñitas".
    size: 4 + Math.pow(Math.random(), 1.6) * 19,
    // Inercia: cuanto más rápido iba el scroll al nacer, más deprisa sube
    // (duración menor) — luego cada burbuja mantiene su propio ritmo.
    duration: 2.5 - speedFactor * 1.0 + Math.random() * 0.5,
    drift: (8 + Math.random() * 16) * (Math.random() < 0.5 ? -1 : 1),
    dot: Math.random() < 0.4,
    highlights: Math.random() < 0.55 ? 2 : 1,
  };
}

/**
 * Efecto ambiental exclusivo de Spongeonomics: burbujas de trazo fino que
 * emergen a los lados de la pantalla —donde el artículo no tiene texto—
 * mientras el lector hace scroll. Llevan una física muy ligera: tanto la
 * cantidad simultánea (de casi ninguna en reposo/scroll lento hasta
 * MAX_PER_SIDE por lado con scroll rápido sostenido) como la velocidad de
 * ascenso están ligadas a la velocidad real del scroll, con inercia y una
 * pequeña deriva lateral aleatoria por burbuja. Nunca se activa con
 * movimiento reducido ni en viewports estrechos, donde no hay margen libre
 * junto al texto.
 */
export function SpongeonomicsBubbles() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const bubblesRef = useRef<Bubble[]>([]);
  const energyRef = useRef(0);
  const nextThresholdRef = useRef(randomEnergyThreshold());
  const lastYRef = useRef(0);
  const lastTRef = useRef(0);
  const smoothVRef = useRef(0);
  const lastDirRef = useRef(0);
  const activeRef = useRef(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const wide = window.matchMedia(`(min-width: ${MIN_VIEWPORT}px)`);
    activeRef.current = wide.matches;
    function onWideChange(e: MediaQueryListEvent) {
      activeRef.current = e.matches;
    }
    wide.addEventListener('change', onWideChange);

    lastYRef.current = window.scrollY;
    lastTRef.current = performance.now();

    // Se muestrea por fotograma (en vez de escuchar el evento 'scroll') a
    // propósito: la frecuencia real con la que los navegadores disparan
    // 'scroll' varía mucho según el dispositivo de entrada, y un muestreo
    // por fotograma da una velocidad e inercia consistentes siempre.
    let rafId = 0;
    function tick() {
      rafId = requestAnimationFrame(tick);
      if (!activeRef.current) return;

      const y = window.scrollY;
      const t = performance.now();
      const dt = Math.max(t - lastTRef.current, 1);
      const dy = y - lastYRef.current;
      lastYRef.current = y;
      lastTRef.current = t;

      if (dy === 0) {
        // En reposo la velocidad y la energía decaen en vez de quedar
        // congeladas, para que frenar de golpe tras ir rápido no siga
        // disparando burbujas con retraso.
        smoothVRef.current *= 0.85;
        energyRef.current *= 0.9;
        return;
      }

      const v = (dy / dt) * 1000; // px/s instantáneo, con signo
      // Media móvil exponencial: suaviza el ruido entre fotogramas sin
      // perder la reacción a cambios reales de velocidad.
      smoothVRef.current = smoothVRef.current * 0.72 + v * 0.28;
      const dir = Math.sign(smoothVRef.current);
      if (dir !== 0 && lastDirRef.current !== 0 && dir !== lastDirRef.current) {
        // Cambio de sentido: un pequeño respiro antes de que la energía
        // vuelva a acumularse, para que la reacción se sienta coherente
        // en vez de una respuesta instantánea y mecánica.
        energyRef.current *= 0.35;
      }
      if (dir !== 0) lastDirRef.current = dir;

      const speed = Math.abs(smoothVRef.current);
      // La energía crece más deprisa cuanto mayor es la velocidad, no solo
      // con la distancia recorrida: un scroll rápido dispara burbujas
      // notablemente antes —y más seguido— que uno lento a igualdad de
      // distancia recorrida.
      energyRef.current += Math.abs(dy) * (0.35 + Math.min(speed / 700, 3));

      if (energyRef.current >= nextThresholdRef.current) {
        energyRef.current = 0;
        nextThresholdRef.current = randomEnergyThreshold();
        const side: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right';
        const cap = targetPerSide(speed);
        const sideCount = bubblesRef.current.reduce((n, b) => n + (b.side === side ? 1 : 0), 0);
        if (sideCount < cap) {
          bubblesRef.current = [...bubblesRef.current, makeBubble(side, speed)];
          setBubbles(bubblesRef.current);
        }
      }
    }
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      wide.removeEventListener('change', onWideChange);
    };
  }, []);

  function remove(id: number) {
    bubblesRef.current = bubblesRef.current.filter((b) => b.id !== id);
    setBubbles(bubblesRef.current);
  }

  if (bubbles.length === 0) return null;

  return (
    <div className="spongeonomics-bubble-layer" aria-hidden="true">
      {bubbles.map((b) => {
        const style: Record<string, string | number> = {
          width: b.size,
          height: b.size,
          animationDuration: `${b.duration}s`,
          '--drift': `${b.drift}px`,
        };
        style[b.side] = `${b.offset}vw`;
        return (
          <svg
            key={b.id}
            className="spongeonomics-bubble"
            style={style as React.CSSProperties}
            viewBox="0 0 24 24"
            onAnimationEnd={() => remove(b.id)}
          >
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1" />
            <ellipse
              cx="8.4"
              cy="8"
              rx="1.6"
              ry="1"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.7"
              transform="rotate(-20 8.4 8)"
            />
            {b.highlights === 2 && (
              <ellipse
                cx="14.6"
                cy="7.4"
                rx="1"
                ry="0.6"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.6"
                transform="rotate(10 14.6 7.4)"
              />
            )}
            {b.dot && <circle cx="15.6" cy="15.2" r="0.85" fill="currentColor" stroke="none" />}
          </svg>
        );
      })}
    </div>
  );
}
