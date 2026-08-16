import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ResizableImageView } from '../nodeviews/ResizableImageView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    resizableImage: {
      insertResizableImage: (attrs: {
        src: string;
        alt?: string;
        storagePath?: string | null;
        width?: number;
      }) => ReturnType;
    };
  }
}

/**
 * Nodo de bloque para imágenes con resize continuo y texto envolvente.
 * A propósito guarda solo `width` (nunca `height`): la proporción se
 * mantiene siempre dejando que la altura se ajuste sola, así no existe la
 * posibilidad de distorsionar una foto al redimensionar.
 */
export const ResizableImage = Node.create({
  name: 'resizableImage',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: '' },
      caption: { default: '' },
      width: { default: 480 },
      align: { default: 'center' },
      wrap: { default: false },
      spacing: { default: 'medium' },
      offsetY: { default: 0 },
      storagePath: { default: null },
    };
  },

  parseHTML() {
    return [
      { tag: 'figure[data-type="resizable-image"]' },
      // Reconoce también una <img> "suelta" tal cual llega al pegar texto
      // desde fuera (Google Docs, una página web, Word…). Sin esta regla,
      // el esquema no tenía ningún nodo que representara una <img> ajena y
      // el pegado la descartaba en silencio junto con el resto del HTML no
      // reconocido — el src (a menudo una URL temporal o un data: URI) se
      // resube de verdad después, ver `uploadPastedImages` en ArticleEditor.
      {
        tag: 'img[src]',
        getAttrs: (element) => {
          const img = element as HTMLImageElement;
          return { src: img.getAttribute('src'), alt: img.getAttribute('alt') ?? '' };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['figure', mergeAttributes(HTMLAttributes, { 'data-type': 'resizable-image' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },

  addCommands() {
    return {
      insertResizableImage:
        (attrs) =>
        ({ chain }) =>
          chain()
            .insertContent({ type: this.name, attrs: { ...attrs, alt: attrs.alt ?? '' } })
            .run(),
    };
  },
});
