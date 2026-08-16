import { useRef, useState, type ChangeEvent } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import { FontSize } from './extensions/fontSize';
import { LineHeight } from './extensions/lineHeight';
import { ResizableImage } from './extensions/resizableImage';
import { Footnote } from './extensions/footnote';
import { Toolbar } from './Toolbar';
import { FootnoteModal } from './FootnoteModal';
import { uploadPublicImage } from '@/lib/services/storage';
import { useToast } from '@/context/ToastContext';

interface ArticleEditorProps {
  articleId: string;
  initialContent: unknown;
  onChange: (json: Record<string, unknown>) => void;
}

interface EditingFootnote {
  id: string;
  text: string;
  isNew: boolean;
}

function hasDocShape(json: unknown): json is Record<string, unknown> {
  return Boolean(json && typeof json === 'object' && (json as { type?: string }).type === 'doc');
}

function findFootnotePos(editor: Editor, id: string): number | null {
  let target: number | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (target !== null) return false;
    if (node.type.name === 'footnote' && node.attrs.id === id) {
      target = pos;
      return false;
    }
    return true;
  });
  return target;
}

function isOwnStorageUrl(src: string): boolean {
  return src.includes('/storage/v1/object/public/');
}

const MIME_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

async function fetchAsFile(src: string): Promise<File> {
  const res = await fetch(src);
  if (!res.ok) throw new Error('No se pudo descargar la imagen pegada.');
  const blob = await res.blob();
  const ext = MIME_EXTENSIONS[blob.type] ?? 'png';
  return new File([blob], `pegada-${crypto.randomUUID()}.${ext}`, { type: blob.type || 'image/png' });
}

/**
 * Al pegar contenido con imágenes desde fuera (Google Docs, una web,
 * Word…), la nueva regla de `parseHTML` en ResizableImage hace que esas
 * <img> ya no se pierdan — pero quedan con su src original: un data: URI o
 * una URL ajena. Aquí se suben de verdad a nuestro Storage y se sustituye
 * el src por el definitivo, para que la imagen no dependa de que ese
 * origen externo la siga sirviendo. Si la descarga falla (p. ej. CORS en la
 * URL de origen), se deja el src original — sigue mostrándose vía hotlink
 * en vez de desaparecer del todo.
 */
async function uploadPastedImages(editor: Editor, articleId: string) {
  const pendingSrcs = new Set<string>();
  editor.state.doc.descendants((node) => {
    if (node.type.name === 'resizableImage' && typeof node.attrs.src === 'string' && node.attrs.src && !isOwnStorageUrl(node.attrs.src)) {
      pendingSrcs.add(node.attrs.src);
    }
  });

  for (const originalSrc of pendingSrcs) {
    try {
      const file = await fetchAsFile(originalSrc);
      const { url } = await uploadPublicImage('article-images', articleId, file);
      let target: { pos: number; attrs: Record<string, unknown> } | null = null;
      editor.state.doc.descendants((node, pos) => {
        if (target !== null) return false;
        if (node.type.name === 'resizableImage' && node.attrs.src === originalSrc) {
          target = { pos, attrs: node.attrs };
          return false;
        }
        return true;
      });
      if (target !== null) {
        const { pos, attrs } = target as { pos: number; attrs: Record<string, unknown> };
        editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { ...attrs, src: url }));
      }
    } catch {
      /* se deja el src original, ver comentario de la función */
    }
  }
}

export function ArticleEditor({ articleId, initialContent, onChange }: ArticleEditorProps) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [editingFootnote, setEditingFootnote] = useState<EditingFootnote | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right', 'justify'] }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: 'Escribe aquí…' }),
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      LineHeight,
      ResizableImage,
      Footnote.configure({
        onEdit: (id, text) => setEditingFootnote({ id, text, isNew: false }),
      }),
    ],
    content: hasDocShape(initialContent) ? initialContent : '',
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
    editorProps: {
      handlePaste(_view, event) {
        // Pegar una imagen copiada directamente (p. ej. una captura de
        // pantalla): llega como archivo en el portapapeles, no como HTML.
        // Se sube igual que al insertarla desde la barra de herramientas.
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) => f.type.startsWith('image/'));
        if (files.length > 0) {
          event.preventDefault();
          (async () => {
            for (const file of files) {
              try {
                const { url, path } = await uploadPublicImage('article-images', articleId, file);
                editor?.chain().focus().insertResizableImage({ src: url, storagePath: path, alt: '' }).run();
              } catch (err) {
                showToast(err instanceof Error ? err.message : 'No se pudo subir la imagen pegada.', 'error');
              }
            }
          })();
          return true;
        }

        // En cualquier otro caso, se deja que el pegado normal inserte el
        // HTML tal cual (incluidas las <img> sueltas de un documento
        // externo) y, una vez asentado en el documento, se suben de verdad
        // las que no sean ya nuestras.
        setTimeout(() => {
          if (editor) void uploadPastedImages(editor, articleId);
        }, 0);
        return false;
      },
    },
  });

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editor) return;
    setUploading(true);
    try {
      const { url, path } = await uploadPublicImage('article-images', articleId, file);
      editor.chain().focus().insertResizableImage({ src: url, storagePath: path, alt: '' }).run();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo subir la imagen.', 'error');
    } finally {
      setUploading(false);
    }
  }

  function handleInsertFootnote() {
    setEditingFootnote({ id: crypto.randomUUID(), text: '', isNew: true });
  }

  function handleSaveFootnote(text: string) {
    if (!editor || !editingFootnote) return;
    if (editingFootnote.isNew) {
      editor.chain().focus().insertFootnote({ id: editingFootnote.id, text }).run();
    } else {
      const pos = findFootnotePos(editor, editingFootnote.id);
      if (pos !== null) {
        editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { id: editingFootnote.id, text }));
      }
    }
    setEditingFootnote(null);
  }

  function handleDeleteFootnote() {
    if (!editor || !editingFootnote) return;
    const pos = findFootnotePos(editor, editingFootnote.id);
    if (pos !== null) {
      editor.view.dispatch(editor.state.tr.delete(pos, pos + 1));
    }
    setEditingFootnote(null);
  }

  if (!editor) return null;

  return (
    <div>
      <Toolbar editor={editor} onInsertImage={() => fileInputRef.current?.click()} onInsertFootnote={handleInsertFootnote} uploadingImage={uploading} />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <div className="prose-pangloss">
        <EditorContent editor={editor} />
      </div>
      {editingFootnote && (
        <FootnoteModal
          initialText={editingFootnote.text}
          onSave={handleSaveFootnote}
          onDelete={editingFootnote.isNew ? undefined : handleDeleteFootnote}
          onClose={() => setEditingFootnote(null)}
        />
      )}
    </div>
  );
}
