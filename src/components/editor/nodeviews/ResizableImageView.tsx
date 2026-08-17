import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { AlignLeft, AlignCenter, AlignRight, WrapText, GripHorizontal, Trash2, Accessibility, Captions } from 'lucide-react';
import { computeFigureLayout, MIN_IMAGE_WIDTH, MAX_IMAGE_WIDTH, type ImageAlign, type ImageSpacing } from '@/lib/content/imageAttrs';

const SPACING_OPTIONS: { value: ImageSpacing; label: string }[] = [
  { value: 'small', label: 'Pequeño' },
  { value: 'medium', label: 'Medio' },
  { value: 'large', label: 'Grande' },
];

/** Popover contextual para un único campo de texto (alt o caption): se
 * pinta con `position: absolute` sobre la imagen — nunca como contenido
 * normal del `<figure>` — así nunca forma parte de su altura real ni,
 * flotado con wrap, del hueco que ese flotante reserva para el texto de
 * alrededor. Aparece solo mientras se edita; en cuanto se cierra, la
 * imagen vuelve a ocupar exactamente su espacio real. */
function ImageFieldPopover({
  label,
  value,
  placeholder,
  onCommit,
  onClose,
}: {
  label: string;
  value: string;
  placeholder: string;
  onCommit: (value: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);

  function commitAndClose() {
    if (draft !== value) onCommit(draft);
    onClose();
  }

  return (
    <div className="riv-field-popover" onPointerDown={(e) => e.stopPropagation()}>
      <span className="riv-field-popover-label">{label}</span>
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitAndClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') onClose();
        }}
        placeholder={placeholder}
        className="riv-field-popover-input"
      />
    </div>
  );
}

/**
 * Resize y movimiento vertical continuos, sin `setPointerCapture`: se
 * registran listeners de `pointermove`/`pointerup` en `window` mientras
 * dura el arrastre (activado por una ref, no por estado, para no volver a
 * suscribir en cada render). Es más robusto que depender de la Pointer
 * Capture API — sigue funcionando aunque el puntero se mueva muy rápido y
 * salga del área del handle. Mientras se arrastra solo se actualiza estado
 * local de React (rAF-throttled); el documento de ProseMirror no se toca
 * hasta soltar, una única vez (`updateAttributes`), leyendo el último valor
 * desde una ref para no depender del ciclo de render de React en ese punto.
 *
 * GEOMETRÍA DEL WRAP — por qué el desplazamiento vertical (offsetY) vive en
 * el `<div>` envolvente y no en este `<figure>`:
 * un elemento flotado con `margin-top` NO recalcula la zona de exclusión
 * que reserva para el texto que lo rodea — el navegador la sigue basando
 * en la posición ESTÁTICA del flotante, la que tendría con margin-top:0.
 * Verificado de forma aislada, en HTML/CSS puro, sin Tiptap ni React de
 * por medio: mover un flotante con margin-top dejaba el texto envolviendo
 * donde el flotante SOLÍA estar, no donde está de verdad. Un contenedor de
 * flujo NORMAL (no flotado) con ese mismo margin-top, en cambio, sí
 * desplaza correctamente la zona de exclusión, porque su reflujo es el de
 * cualquier bloque corriente — el flotante que vive dentro, con
 * margin-top:0, hereda esa posición ya desplazada.
 *
 * `ReactNodeViewRenderer` (Tiptap) ya monta este componente dentro de un
 * `<div class="react-renderer ...">` propio — el hermano real de los
 * párrafos en el flujo de `.ProseMirror`. Es exactamente el contenedor que
 * hace falta: `computeFigureLayout` separa `wrapperStyle` (solo
 * margin-top, para ESE div) de `figureStyle` (float, ancho, márgenes
 * horizontales — para este `<figure>`, con margin-top siempre en 0).
 */
export function ResizableImageView({ node, updateAttributes, selected, deleteNode }: NodeViewProps) {
  const attrs = node.attrs as {
    src: string;
    alt: string;
    caption: string;
    width: number;
    align: ImageAlign;
    wrap: boolean;
    spacing: ImageSpacing;
    offsetY: number;
  };

  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState<number | null>(null);
  // Un único popover abierto a la vez (alt o caption) — nunca los dos
  // campos permanentemente en pantalla, y nunca como parte del flujo del
  // documento (ver ImageFieldPopover).
  const [activeField, setActiveField] = useState<'alt' | 'caption' | null>(null);

  const figureRef = useRef<HTMLElement | null>(null);
  const dragWidthRef = useRef<number | null>(null);
  const dragOffsetYRef = useRef<number | null>(null);
  const resizeState = useRef<{ startX: number; startWidth: number; dir: number } | null>(null);
  const moveState = useRef<{ startY: number; startOffset: number } | null>(null);
  const rafId = useRef<number | undefined>(undefined);

  const wrap = attrs.wrap && attrs.align !== 'center';

  /** Aplica (o limpia) `wrapperStyle` — solo el desplazamiento vertical —
   * en el `<div>` que Tiptap genera alrededor de este NodeView. Se llama
   * tanto desde el efecto de layout (valores ya confirmados) como desde
   * el propio arrastre (valores en vivo), para que el texto de alrededor
   * siga la imagen fotograma a fotograma, no solo al soltar.
   *
   * `element.style.marginTop = 24` (número, sin unidad) es una
   * declaración CSS inválida y el navegador la descarta en silencio — a
   * diferencia de la prop `style` de React, que añade "px" automáticamente
   * a los números, asignar directamente al `style` del DOM no lo hace. Hay
   * que convertir explícitamente cada valor numérico antes de asignarlo. */
  function applyWrapperGeometry(width: number, offsetY: number) {
    const wrapperEl = figureRef.current?.parentElement;
    if (!wrapperEl) return;
    if (!wrap) {
      wrapperEl.style.cssText = '';
      return;
    }
    const { wrapperStyle } = computeFigureLayout({ ...attrs, width, offsetY });
    wrapperEl.style.cssText = '';
    for (const [prop, value] of Object.entries(wrapperStyle)) {
      if (value === undefined) continue;
      const cssValue = typeof value === 'number' ? `${value}px` : String(value);
      wrapperEl.style.setProperty(prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`), cssValue);
    }
  }

  useLayoutEffect(() => {
    applyWrapperGeometry(dragWidth ?? attrs.width, dragOffsetY ?? attrs.offsetY);
    // Los valores de arrastre en curso también deben poder disparar esto
    // (además del efecto ya cubre el caso confirmado) — dependencias
    // explícitas, no el objeto `attrs` entero, para no re-ejecutar de más.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrap, attrs.align, attrs.spacing, attrs.width, attrs.offsetY, dragWidth, dragOffsetY]);

  useEffect(() => setDragWidth(null), [attrs.width]);
  useEffect(() => setDragOffsetY(null), [attrs.offsetY]);
  // Si se deselecciona la imagen (clic en otro sitio del documento), el
  // popover que estuviera abierto se cierra con ella — no debe quedar
  // flotando sobre una imagen que ya no está "activa".
  useEffect(() => {
    if (!selected) setActiveField(null);
  }, [selected]);

  // Un único par de listeners de window para toda la vida del componente;
  // solo actúan si hay un arrastre en curso (referencia, no estado).
  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (resizeState.current) {
        const { startX, startWidth, dir } = resizeState.current;
        const delta = (e.clientX - startX) * dir;
        const next = Math.min(MAX_IMAGE_WIDTH, Math.max(MIN_IMAGE_WIDTH, Math.round(startWidth + delta)));
        if (rafId.current) cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => {
          dragWidthRef.current = next;
          setDragWidth(next);
          applyWrapperGeometry(next, dragOffsetYRef.current ?? attrs.offsetY);
        });
      }
      if (moveState.current) {
        const { startY, startOffset } = moveState.current;
        const next = Math.min(400, Math.max(-200, Math.round(startOffset + (e.clientY - startY))));
        if (rafId.current) cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => {
          dragOffsetYRef.current = next;
          setDragOffsetY(next);
          applyWrapperGeometry(dragWidthRef.current ?? attrs.width, next);
        });
      }
    }

    function onUp() {
      if (resizeState.current) {
        const final = dragWidthRef.current ?? resizeState.current.startWidth;
        updateAttributes({ width: final });
        dragWidthRef.current = null;
        resizeState.current = null;
      }
      if (moveState.current) {
        const final = dragOffsetYRef.current ?? moveState.current.startOffset;
        updateAttributes({ offsetY: final });
        dragOffsetYRef.current = null;
        moveState.current = null;
      }
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateAttributes, wrap]);

  function startResize(e: ReactPointerEvent, dir: number) {
    e.preventDefault();
    e.stopPropagation();
    resizeState.current = { startX: e.clientX, startWidth: dragWidth ?? attrs.width, dir };
  }

  function startMove(e: ReactPointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    moveState.current = { startY: e.clientY, startOffset: dragOffsetY ?? attrs.offsetY };
  }

  // `figureStyle` siempre va en el propio `<figure>` (float, ancho,
  // márgenes horizontales) — el desplazamiento vertical, cuando aplica,
  // vive aparte, en el `<div>` envolvente (ver applyWrapperGeometry).
  const { figureStyle } = computeFigureLayout({ ...attrs, width: dragWidth ?? attrs.width });

  function setAlign(align: ImageAlign) {
    updateAttributes({ align, wrap: align === 'center' ? false : attrs.wrap });
  }

  return (
    <NodeViewWrapper
      ref={figureRef}
      as="figure"
      className={`editor-figure ${wrap ? 'editor-figure-wrap' : ''} ${selected ? 'is-selected' : ''}`}
      style={figureStyle}
      data-drag-handle
    >
      <div className="relative select-none">
        <img src={attrs.src} alt={attrs.alt} className="block w-full h-auto rounded-sm" draggable={false} />

        {selected && (
          <>
            {(['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
              <div
                key={corner}
                className={`riv-handle riv-handle-${corner}`}
                onPointerDown={(e) => startResize(e, corner === 'nw' || corner === 'sw' ? -1 : 1)}
              />
            ))}

            {wrap && (
              <div className="riv-vhandle" title="Mover verticalmente" onPointerDown={startMove}>
                <GripHorizontal className="w-3.5 h-3.5" />
              </div>
            )}

            {activeField === 'alt' && (
              <ImageFieldPopover
                label="Texto alternativo"
                value={attrs.alt}
                placeholder="Describe la imagen para lectores de pantalla"
                onCommit={(value) => updateAttributes({ alt: value })}
                onClose={() => setActiveField(null)}
              />
            )}
            {activeField === 'caption' && (
              <ImageFieldPopover
                label="Pie de foto"
                value={attrs.caption}
                placeholder="Opcional"
                onCommit={(value) => updateAttributes({ caption: value })}
                onClose={() => setActiveField(null)}
              />
            )}

            <div className="riv-toolbar" onPointerDown={(e) => e.stopPropagation()}>
              <button type="button" title="Centrada" className={attrs.align === 'center' ? 'active' : ''} onClick={() => setAlign('center')}>
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button type="button" title="A la izquierda, texto alrededor" className={attrs.align === 'left' ? 'active' : ''} onClick={() => setAlign('left')}>
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button type="button" title="A la derecha, texto alrededor" className={attrs.align === 'right' ? 'active' : ''} onClick={() => setAlign('right')}>
                <AlignRight className="w-3.5 h-3.5" />
              </button>
              <span className="riv-toolbar-sep" />
              <button
                type="button"
                title="Envolver texto"
                disabled={attrs.align === 'center'}
                className={attrs.wrap ? 'active' : ''}
                onClick={() => updateAttributes({ wrap: !attrs.wrap })}
              >
                <WrapText className="w-3.5 h-3.5" />
              </button>
              {SPACING_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  title={`Espacio ${s.label.toLowerCase()}`}
                  disabled={!wrap}
                  className={attrs.spacing === s.value ? 'active' : ''}
                  onClick={() => updateAttributes({ spacing: s.value })}
                >
                  {s.label[0]}
                </button>
              ))}
              <span className="riv-toolbar-sep" />
              <button
                type="button"
                title="Texto alternativo (accesibilidad)"
                className={attrs.alt.trim() || activeField === 'alt' ? 'active' : ''}
                onClick={() => setActiveField((f) => (f === 'alt' ? null : 'alt'))}
              >
                <Accessibility className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Pie de foto"
                className={attrs.caption.trim() || activeField === 'caption' ? 'active' : ''}
                onClick={() => setActiveField((f) => (f === 'caption' ? null : 'caption'))}
              >
                <Captions className="w-3.5 h-3.5" />
              </button>
              <span className="riv-toolbar-sep" />
              <button type="button" title="Eliminar imagen" onClick={() => deleteNode()}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}
