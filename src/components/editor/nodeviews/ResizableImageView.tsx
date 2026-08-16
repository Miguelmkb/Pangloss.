import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { AlignLeft, AlignCenter, AlignRight, WrapText, GripHorizontal, Trash2 } from 'lucide-react';
import { computeFigureStyle, MIN_IMAGE_WIDTH, MAX_IMAGE_WIDTH, type ImageAlign, type ImageSpacing } from '@/lib/content/imageAttrs';

const SPACING_OPTIONS: { value: ImageSpacing; label: string }[] = [
  { value: 'small', label: 'Pequeño' },
  { value: 'medium', label: 'Medio' },
  { value: 'large', label: 'Grande' },
];

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
  const [captionDraft, setCaptionDraft] = useState(attrs.caption);
  const [altDraft, setAltDraft] = useState(attrs.alt);

  const dragWidthRef = useRef<number | null>(null);
  const dragOffsetYRef = useRef<number | null>(null);
  const resizeState = useRef<{ startX: number; startWidth: number; dir: number } | null>(null);
  const moveState = useRef<{ startY: number; startOffset: number } | null>(null);
  const rafId = useRef<number | undefined>(undefined);

  useEffect(() => setDragWidth(null), [attrs.width]);
  useEffect(() => setDragOffsetY(null), [attrs.offsetY]);
  useEffect(() => setCaptionDraft(attrs.caption), [attrs.caption]);
  useEffect(() => setAltDraft(attrs.alt), [attrs.alt]);

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
  }, [updateAttributes]);

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

  const wrap = attrs.wrap && attrs.align !== 'center';
  const style = computeFigureStyle({ ...attrs, width: dragWidth ?? attrs.width, offsetY: dragOffsetY ?? attrs.offsetY });

  function setAlign(align: ImageAlign) {
    updateAttributes({ align, wrap: align === 'center' ? false : attrs.wrap });
  }

  return (
    <NodeViewWrapper as="figure" className={`editor-figure ${wrap ? 'editor-figure-wrap' : ''} ${selected ? 'is-selected' : ''}`} style={style} data-drag-handle>
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
              <button type="button" title="Eliminar imagen" onClick={() => deleteNode()}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>

      {selected && (
        <input
          value={altDraft}
          onChange={(e) => setAltDraft(e.target.value)}
          onBlur={() => altDraft !== attrs.alt && updateAttributes({ alt: altDraft })}
          placeholder="Texto alternativo (accesibilidad)"
          className="editor-figure-alt"
        />
      )}
      <input
        value={captionDraft}
        onChange={(e) => setCaptionDraft(e.target.value)}
        onBlur={() => captionDraft !== attrs.caption && updateAttributes({ caption: captionDraft })}
        placeholder="Pie de foto (opcional)"
        className="editor-figure-caption"
      />
    </NodeViewWrapper>
  );
}
