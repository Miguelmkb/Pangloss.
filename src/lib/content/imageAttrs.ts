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

/**
 * Un único punto de verdad para el estilo de una imagen del artículo,
 * usado tanto por el NodeView del editor (Fase 6) como por el renderer de
 * solo lectura del sitio público (Fase 4) — para que lo que se ve al
 * escribir sea exactamente lo que se ve al publicar.
 */
export function computeFigureStyle(attrs: Partial<ResizableImageAttrs>): CSSProperties {
  const align = attrs.align === 'left' || attrs.align === 'right' ? attrs.align : 'center';
  const wrap = Boolean(attrs.wrap) && align !== 'center';
  const spacingPx = SPACING_PX[attrs.spacing ?? 'medium'];
  const width = typeof attrs.width === 'number' ? attrs.width : undefined;
  const offsetY = typeof attrs.offsetY === 'number' ? attrs.offsetY : 0;

  if (wrap) {
    return {
      float: align,
      // `position: relative` + `top` (no `margin-top`): el desplazamiento
      // vertical es puramente visual, no reserva ni libera espacio en el
      // flujo. Con margin-top el navegador tenía que recalcular cómo
      // envolvía el texto en cada frame del arrastre, lo que se sentía
      // impreciso; así el texto que envuelve la imagen no se recalcula en
      // absoluto durante el movimiento — solo se repinta la imagen.
      position: 'relative',
      top: offsetY,
      width: width ? `${width}px` : '45%',
      marginRight: align === 'left' ? spacingPx : 0,
      marginLeft: align === 'right' ? spacingPx : 0,
      marginBottom: spacingPx,
    };
  }
  return { width: width ? `${width}px` : '100%', maxWidth: '100%', marginLeft: 'auto', marginRight: 'auto' };
}
