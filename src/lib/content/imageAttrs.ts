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
 * Un único punto de verdad para la geometría de una imagen de artículo,
 * usado tanto por el NodeView del editor como por el renderer de solo
 * lectura del sitio público — para que lo que se ve al escribir sea
 * exactamente lo que se ve al publicar.
 *
 * POR QUÉ `offsetY` SOLO SE APLICA SIN TEXTO ENVOLVENTE (`wrap`):
 * la zona de exclusión que un elemento flotado reserva para el texto que lo
 * rodea está anclada siempre a su posición ESTÁTICA (la que le
 * correspondería en el flujo normal del documento) — verificado de forma
 * exhaustiva y aislada, sin Tiptap ni React de por medio, con varias
 * técnicas: `margin-top` en el propio flotante no mueve esa ancla (el
 * navegador sigue envolviendo desde la posición estática, solo alarga la
 * zona hacia abajo); `shape-outside` con coordenadas desplazadas se recorta
 * a los límites de la propia caja, no permite proyectar la exclusión fuera
 * de ella; y `margin-top` en un contenedor de flujo NO flotado sí reubica
 * esa ancla — pero entonces su margen participa, inevitablemente, en el
 * colapso de márgenes con los párrafos vecinos (`.ProseMirror p` tiene su
 * propio `margin-bottom`), y ese colapso no se puede bloquear de forma
 * local sin además contener al flotante — lo que le impediría afectar al
 * texto posterior en absoluto, rompiendo el propio wrap. No existe, por
 * tanto, ninguna técnica CSS que mueva la zona de exclusión sin mover
 * también, en alguna medida, el resto del flujo del documento.
 *
 * Por eso, con `wrap` activo, `offsetY` se ignora del todo para la
 * maquetación: la posición de una imagen envolvente se controla moviéndola
 * de párrafo (igual que en Google Docs, Word o Notion, que tienen la misma
 * limitación y resuelven así). Sin `wrap` no hay ninguna zona de exclusión
 * que reconciliar — ahí `offsetY` es un desplazamiento puramente visual (ver
 * `imageOffsetYPx`) que nunca participa en el flujo ni lo desplaza un solo
 * píxel. No se incluye aquí como `transform` porque cada consumidor lo
 * aplica de forma distinta — ver esa función.
 */
export function computeFigureLayout(attrs: Partial<ResizableImageAttrs>): CSSProperties {
  const align = attrs.align === 'left' || attrs.align === 'right' ? attrs.align : 'center';
  const wrap = Boolean(attrs.wrap) && align !== 'center';
  const spacingPx = SPACING_PX[attrs.spacing ?? 'medium'];
  const width = typeof attrs.width === 'number' ? attrs.width : undefined;

  if (wrap) {
    return {
      float: align,
      width: width ? `${width}px` : '45%',
      marginRight: align === 'left' ? spacingPx : 0,
      marginLeft: align === 'right' ? spacingPx : 0,
      marginBottom: spacingPx,
      marginTop: 0,
    };
  }
  return {
    width: width ? `${width}px` : '100%',
    maxWidth: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
  };
}

/**
 * Cuántos píxeles debe desplazarse visualmente la imagen por `offsetY` — 0
 * siempre que haya `wrap` (ver el porqué en `computeFigureLayout`).
 *
 * Deliberadamente NO devuelve ya un `transform` hecho: el NodeView del
 * editor lo asigna directamente (ahí no hay ninguna otra animación en
 * `.editor-figure` con la que pueda chocar), pero el renderer público sí
 * tiene una animación de aparición propia en `.article-figure` (un
 * `transform: translateY(...)` que va de 10px a 0 al entrar en el
 * viewport) — asignar `style.transform` a secas ahí PISARÍA esa animación
 * en vez de combinarse con ella. Ese renderer combina este valor con su
 * propia animación vía la custom property `--figure-nudge-y` (ver
 * `index.css`), no con un `transform` directo.
 */
export function imageOffsetYPx(attrs: Partial<ResizableImageAttrs>): number {
  const align = attrs.align === 'left' || attrs.align === 'right' ? attrs.align : 'center';
  const wrap = Boolean(attrs.wrap) && align !== 'center';
  if (wrap) return 0;
  return typeof attrs.offsetY === 'number' ? attrs.offsetY : 0;
}
