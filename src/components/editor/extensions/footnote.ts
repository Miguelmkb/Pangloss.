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
