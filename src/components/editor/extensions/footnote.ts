import { Node, mergeAttributes } from '@tiptap/core';

export interface FootnoteOptions {
  onEdit: (id: string, currentText: string) => void;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    footnote: {
      insertFootnote: (attrs: { id: string; text: string }) => ReturnType;
    };
  }
}

/**
 * Nodo inline atómico. El texto de la nota vive en el propio atributo
 * (no como contenido editable del nodo) — más simple y suficiente para
 * notas breves; se edita mediante un pequeño diálogo, no in situ.
 *
 * PEGAR DESDE GOOGLE DOCS (u otro editor externo) NO RECONSTRUYE LAS
 * NOTAS AL PIE — investigado a fondo, no es un descuido. `parseHTML` solo
 * reconoce `sup[data-footnote-id]`, que es el marcado que genera este
 * mismo editor (ver `renderHTML`); el HTML que Google Docs pone en el
 * portapapeles al copiar representa sus notas de forma completamente
 * distinta y no informada por ninguna API pública estable, y ni siquiera
 * Google garantiza que sobrevivan copiando entre dos Documentos de Google
 * (confirmado en su propio foro de soporte). Reconstruirlas a partir de
 * ese HTML exigiría interpretar un formato no documentado y frágil ante
 * cualquier cambio silencioso de Google — el tipo de hack que se decidió
 * explícitamente no hacer. Comportamiento actual, intencional: al pegar
 * contenido con notas al pie desde fuera, el texto visible llega bien,
 * pero las notas en sí no se reconstruyen — hay que volver a insertarlas
 * a mano con el botón de la barra de herramientas.
 */
export const Footnote = Node.create<FootnoteOptions>({
  name: 'footnote',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addOptions() {
    return { onEdit: () => {} };
  },

  addAttributes() {
    return {
      id: { default: null },
      text: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'sup[data-footnote-id]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'sup',
      mergeAttributes(HTMLAttributes, { 'data-footnote-id': node.attrs.id, class: 'footnote-ref' }),
      `[nota]`,
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('sup');
      dom.className = 'footnote-ref editor-footnote';
      dom.textContent = '[nota]';
      dom.title = node.attrs.text;
      dom.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof getPos === 'function') editor.commands.setNodeSelection(getPos());
        this.options.onEdit(node.attrs.id, node.attrs.text);
      });
      return { dom };
    };
  },

  addCommands() {
    return {
      insertFootnote:
        (attrs) =>
        ({ chain }) =>
          chain().insertContent({ type: this.name, attrs }).run(),
    };
  },
});
