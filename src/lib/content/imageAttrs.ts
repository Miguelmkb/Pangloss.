import type { CSSProperties } from 'react';

export type ImageAlign = 'left' | 'center' | 'right';
export type ImageSpacing = 'small' | 'medium' | 'large';

export interface ResizableImageAttrs {
  src: string;
  alt: string;
  caption: string;
  width: number;
  align: ImageAlign;
  wrap: boolean;
  spacing: ImageSpacing;
  offsetY: number;
  storagePath: string | null;
}

export const SPACING_PX: Record<ImageSpacing, number> = { small: 12, medium: 24, large: 40 };

export const MIN_IMAGE_WIDTH = 80;
export const MAX_IMAGE_WIDTH = 1000;

export interface FigureLayout {
  /** Para un contenedor SIN float alrededor de la figura — solo lleva el
   * desplazamiento vertical (offsetY), cuando aplica. Tiene que ser un
   * bloque normal, nunca flotado: un flotante con `margin-top` no
   * recalcula la zona de exclusión que reserva para el texto que lo
   * rodea — el navegador sigue usando su posición estática original,
   * verificado de forma aislada, sin Tiptap ni React de por medio. Un
   * contenedor de flujo normal con `margin-top`, en cambio, sí desplaza
   * correctamente esa zona porque su reflujo es el de cualquier bloque. */
  wrapperStyle: CSSProperties;
  /** Para la propia `<figure>`: el float, el ancho y los márgenes
   * horizontales/inferior. `marginTop` siempre 0 aquí — el
   * desplazamiento vertical vive exclusivamente en `wrapperStyle`. */
  figureStyle: CSSProperties;
}

/**
 * Un único punto de verdad para la geometría de una imagen de artículo,
 * usado tanto por el NodeView del editor (envolviendo `wrapperStyle` en el
 * `<div>` que Tiptap genera alrededor del nodo) como por el renderer de
 * solo lectura del sitio público (con su propio `<div>` explícito) — para
 * que lo que se ve al escribir sea exactamente lo que se ve al publicar.
 */
export function computeFigureLayout(attrs: Partial<ResizableImageAttrs>): FigureLayout {
  const align = attrs.align === 'left' || attrs.align === 'right' ? attrs.align : 'center';
  const wrap = Boolean(attrs.wrap) && align !== 'center';
  const spacingPx = SPACING_PX[attrs.spacing ?? 'medium'];
  const width = typeof attrs.width === 'number' ? attrs.width : undefined;
  const offsetY = typeof attrs.offsetY === 'number' ? attrs.offsetY : 0;

  if (wrap) {
    return {
      wrapperStyle: { marginTop: offsetY },
      figureStyle: {
        float: align,
        width: width ? `${width}px` : '45%',
        marginRight: align === 'left' ? spacingPx : 0,
        marginLeft: align === 'right' ? spacingPx : 0,
        marginBottom: spacingPx,
        marginTop: 0,
      },
    };
  }
  return {
    wrapperStyle: {},
    figureStyle: { width: width ? `${width}px` : '100%', maxWidth: '100%', marginLeft: 'auto', marginRight: 'auto' },
  };
}
