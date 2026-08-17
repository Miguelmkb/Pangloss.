import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { AlignLeft, AlignCenter, AlignRight, WrapText, GripHorizontal, Move, Trash2, Accessibility, Captions } from 'lucide-react';
import { computeFigureLayout, imageOffsetYPx, MIN_IMAGE_WIDTH, MAX_IMAGE_WIDTH, type ImageAlign, type ImageSpacing } from '@/lib/content/imageAttrs';
import { resolveDropInsertion, moveImageAt } from '@/lib/content/imageReposition';

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
 * POR QUÉ EL ARRASTRE VERTICAL SOLO EXISTE SIN TEXTO ENVOLVENTE (`wrap`):
 * la zona de exclusión que reserva un flotante para el texto de alrededor
 * está anclada siempre a su posición estática en el flujo — ninguna técnica
 * CSS (margin, shape-outside, transform) puede desplazarla sin, a la vez,
 * desplazar el resto del documento o dejar de afectar al texto siguiente.
 * Investigado y verificado de forma exhaustiva (ver el comentario en
 * `computeFigureLayout`, en `imageAttrs.ts`, con el detalle completo). Por
 * eso, con `wrap` activo, no hay asa de movimiento vertical — para
 * reposicionar una imagen envolvente se la mueve de párrafo, como en
 * cualquier editor de texto con imágenes flotantes. Sin `wrap` no hay
 * ninguna exclusión que reconciliar, así que `offsetY` sí puede ser un
 * simple `transform: translateY(...)` sobre la propia figura — puramente
 * visual, nunca participa en el flujo.
 */
export function ResizableImageView({ node, updateAttributes, selected, deleteNode, editor, getPos }: NodeViewProps) {
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
  // Indicador de "aquí se anclaría" mientras se reposiciona (ver
  // startReposition) — nunca reescribe el documento durante el arrastre,
  // solo dibuja esta franja. `willSplit` decide si se pinta como una línea
  // fina (limite de bloque) o una franja que resalta el párrafo entero
  // (se va a partir por ahí).
  const [dropIndicator, setDropIndicator] = useState<{ top: number; left: number; width: number; willSplit: boolean } | null>(null);

  const dragWidthRef = useRef<number | null>(null);
  const dragOffsetYRef = useRef<number | null>(null);
  const resizeState = useRef<{ startX: number; startWidth: number; dir: number } | null>(null);
  const moveState = useRef<{ startY: number; startOffset: number } | null>(null);
  const repositioning = useRef(false);
  const dropPosRef = useRef<number | null>(null);
  const rafId = useRef<number | undefined>(undefined);

  const wrap = attrs.wrap && attrs.align !== 'center';

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
        });
      }
      if (moveState.current) {
        const { startY, startOffset } = moveState.current;
        const next = Math.min(400, Math.max(-200, Math.round(startOffset + (e.clientY - startY))));
        if (rafId.current) cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => {
          dragOffsetYRef.current = next;
          setDragOffsetY(next);
        });
      }
      if (repositioning.current) {
        // Solo lectura de posición (`posAtCoords`, `coordsAtPos`): un
        // hit-test nativo de ProseMirror, no una remaquetación — el
        // documento no se toca hasta soltar. Ver el comentario grande más
        // arriba sobre por qué esto no es lo mismo que el reflow
        // línea-a-línea que se descartó.
        const hit = editor.view.posAtCoords({ left: e.clientX, top: e.clientY });
        if (!hit) {
          dropPosRef.current = null;
          if (rafId.current) cancelAnimationFrame(rafId.current);
          rafId.current = requestAnimationFrame(() => setDropIndicator(null));
          return;
        }
        dropPosRef.current = hit.pos;
        const { insertPos, willSplit } = resolveDropInsertion(editor.state.doc, hit.pos);
        const coords = editor.view.coordsAtPos(insertPos);
        const editorRect = editor.view.dom.getBoundingClientRect();
        if (rafId.current) cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => {
          setDropIndicator({ top: coords.top, left: editorRect.left, width: editorRect.width, willSplit });
        });
      }
    }

    function onUp(e: PointerEvent) {
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
      if (repositioning.current) {
        repositioning.current = false;
        setDropIndicator(null);
        const hit = editor.view.posAtCoords({ left: e.clientX, top: e.clientY }) ?? (dropPosRef.current !== null ? { pos: dropPosRef.current } : null);
        dropPosRef.current = null;
        if (hit) {
          moveImageAt(editor.state, (tr) => editor.view.dispatch(tr), getPos(), hit.pos);
        }
      }
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [updateAttributes, editor, getPos]);

  function startResize(e: ReactPointerEvent, dir: number) {
    e.preventDefault();
    e.stopPropagation();
    resizeState.current = { startX: e.clientX, startWidth: dragWidth ?? attrs.width, dir };
  }

  function startMove(e: ReactPointerEvent) {
    // Sin `wrap` no hay ninguna zona de exclusión que reconciliar, así que
    // el asa correspondiente ni siquiera se renderiza (ver JSX más abajo) —
    // esta comprobación es solo un cinturón de seguridad.
    if (wrap) return;
    e.preventDefault();
    e.stopPropagation();
    moveState.current = { startY: e.clientY, startOffset: dragOffsetY ?? attrs.offsetY };
  }

  /** Arrastrar para anclar la imagen en otro punto del documento — ver
   * `imageReposition.ts` para la construcción de la transacción real, que
   * solo ocurre una vez, al soltar. Disponible con o sin `wrap`: es
   * ortogonal al ajuste visual de `offsetY`, cambia DÓNDE está la imagen
   * en el documento, no cómo se ve dentro de ese punto. */
  function startReposition(e: ReactPointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    repositioning.current = true;
  }

  // Recalculado en cada render a partir de los valores de arrastre en curso
  // (o los ya confirmados): con `wrap`, `offsetY` no participa en absoluto
  // (ver el porqué en `computeFigureLayout`); sin `wrap`, es un
  // `transform: translateY(...)` puramente visual, aplicado directamente
  // aquí (a diferencia del renderer público, `.editor-figure` no tiene
  // ninguna otra animación con la que ese transform pueda chocar).
  const liveAttrs = { ...attrs, width: dragWidth ?? attrs.width, offsetY: dragOffsetY ?? attrs.offsetY };
  const offsetYPx = imageOffsetYPx(liveAttrs);
  const figureStyle = { ...computeFigureLayout(liveAttrs), transform: offsetYPx ? `translateY(${offsetYPx}px)` : undefined };

  function setAlign(align: ImageAlign) {
    updateAttributes({ align, wrap: align === 'center' ? false : attrs.wrap });
  }

  return (
    <NodeViewWrapper as="figure" className={`editor-figure ${wrap ? 'editor-figure-wrap' : ''} ${selected ? 'is-selected' : ''}`} style={figureStyle}>
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

            {!wrap && (
              <div className="riv-vhandle" title="Mover verticalmente (ajuste visual)" onPointerDown={startMove}>
                <GripHorizontal className="w-3.5 h-3.5" />
              </div>
            )}

            <div className="riv-move-handle" title="Arrastrar para anclar en otro punto del texto" onPointerDown={startReposition}>
              <Move className="w-3.5 h-3.5" />
            </div>

            {dropIndicator &&
              createPortal(
                <div
                  className={`riv-drop-indicator ${dropIndicator.willSplit ? 'riv-drop-indicator-split' : ''}`}
                  style={{ top: dropIndicator.top, left: dropIndicator.left, width: dropIndicator.width }}
                />,
                document.body,
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
