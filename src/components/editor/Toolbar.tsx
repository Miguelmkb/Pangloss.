import { useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Link2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  List,
  ListOrdered,
  ImagePlus,
  StickyNote,
  Undo2,
  Redo2,
  Minus,
  Plus,
  Palette,
} from 'lucide-react';
import { LinkPopover } from './LinkPopover';

interface ToolbarProps {
  editor: Editor;
  onInsertImage: () => void;
  onInsertFootnote: () => void;
  uploadingImage?: boolean;
}

const STYLE_OPTIONS = [
  { value: 'p', label: 'Texto' },
  { value: 'h1', label: 'Título 1' },
  { value: 'h2', label: 'Título 2' },
  { value: 'h3', label: 'Título 3' },
  { value: 'quote', label: 'Cita' },
] as const;

const FONT_OPTIONS = [
  { value: 'EB Garamond, Georgia, serif', label: 'EB Garamond' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Serif' },
  { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat' },
];

const LINE_HEIGHT_OPTIONS = [
  { value: '1', label: '1' },
  { value: '1.15', label: '1.15' },
  { value: '1.5', label: '1.5' },
  { value: '2', label: '2' },
];

const COLOR_SWATCHES = ['#1a1a1a', '#7a1e1e', '#4a4a4a', '#8a8a8a', '#3f6b4a', '#8a5a1e'];

const DEFAULT_SIZE = 19;

export function Toolbar({ editor, onInsertImage, onInsertFootnote, uploadingImage }: ToolbarProps) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);

  function currentStyle(): (typeof STYLE_OPTIONS)[number]['value'] {
    if (editor.isActive('heading', { level: 1 })) return 'h1';
    if (editor.isActive('heading', { level: 2 })) return 'h2';
    if (editor.isActive('heading', { level: 3 })) return 'h3';
    if (editor.isActive('blockquote')) return 'quote';
    return 'p';
  }

  function applyStyle(value: string) {
    const chain = editor.chain().focus();
    if (value === 'p') chain.setParagraph().run();
    else if (value === 'h1') chain.setHeading({ level: 1 }).run();
    else if (value === 'h2') chain.setHeading({ level: 2 }).run();
    else if (value === 'h3') chain.setHeading({ level: 3 }).run();
    else if (value === 'quote') chain.setBlockquote().run();
  }

  const currentSize = parseInt((editor.getAttributes('textStyle').fontSize as string | undefined)?.replace('px', '') || String(DEFAULT_SIZE), 10);

  function setSize(px: number) {
    const clamped = Math.min(48, Math.max(12, px));
    editor.chain().focus().setFontSize(`${clamped}px`).run();
  }

  return (
    <div className="sticky top-14 z-20 bg-white border border-border flex flex-nowrap items-center gap-1 px-2 py-1.5 mb-6 overflow-x-auto scrollbar-thin">
      <select
        value={currentStyle()}
        onChange={(e) => applyStyle(e.target.value)}
        className="text-sm font-sans border border-border rounded px-2 py-1 mr-1 outline-none focus:border-text-primary bg-white flex-shrink-0"
      >
        {STYLE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
        defaultValue={FONT_OPTIONS[0].value}
        className="text-sm font-sans border border-border rounded px-2 py-1 mr-1 outline-none focus:border-text-primary bg-white flex-shrink-0"
      >
        {FONT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        defaultValue="1.5"
        onChange={(e) => editor.chain().focus().setLineHeight(e.target.value).run()}
        title="Interlineado"
        className="text-sm font-sans border border-border rounded px-2 py-1 mr-1 outline-none focus:border-text-primary bg-white flex-shrink-0"
      >
        {LINE_HEIGHT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <div className="flex items-center border border-border rounded mr-1 flex-shrink-0">
        <ToolButton onClick={() => setSize(currentSize - 1)} title="Reducir tamaño">
          <Minus className="w-3 h-3" />
        </ToolButton>
        <span className="text-xs font-sans text-text-secondary w-9 text-center select-none">{currentSize}px</span>
        <ToolButton onClick={() => setSize(currentSize + 1)} title="Aumentar tamaño">
          <Plus className="w-3 h-3" />
        </ToolButton>
      </div>

      <Divider />

      <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrita">
        <Bold className="w-4 h-4" />
      </ToolButton>
      <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Cursiva">
        <Italic className="w-4 h-4" />
      </ToolButton>
      <ToolButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Subrayado">
        <Underline className="w-4 h-4" />
      </ToolButton>
      <div className="relative flex-shrink-0">
        <ToolButton onClick={() => setColorOpen((v) => !v)} title="Color de texto">
          <Palette className="w-4 h-4" />
        </ToolButton>
        {colorOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-border shadow-sm p-2 flex items-center gap-1.5 z-30" onPointerDown={(e) => e.stopPropagation()}>
            {COLOR_SWATCHES.map((c) => (
              <button
                key={c}
                onClick={() => {
                  editor.chain().focus().setColor(c).run();
                  setColorOpen(false);
                }}
                title={c}
                className="w-5 h-5 rounded-full border border-border-light"
                style={{ backgroundColor: c }}
              />
            ))}
            <button
              onClick={() => {
                editor.chain().focus().unsetColor().run();
                setColorOpen(false);
              }}
              title="Quitar color"
              className="text-[10px] font-sans text-text-muted hover:text-text-primary ml-1"
            >
              Ninguno
            </button>
          </div>
        )}
      </div>
      <div className="relative flex-shrink-0">
        <ToolButton onClick={() => setLinkOpen((v) => !v)} active={editor.isActive('link') || linkOpen} title="Enlace">
          <Link2 className="w-4 h-4" />
        </ToolButton>
        {linkOpen && <LinkPopover editor={editor} onClose={() => setLinkOpen(false)} />}
      </div>

      <Divider />

      <ToolButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Alinear a la izquierda">
        <AlignLeft className="w-4 h-4" />
      </ToolButton>
      <ToolButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centrar">
        <AlignCenter className="w-4 h-4" />
      </ToolButton>
      <ToolButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Alinear a la derecha">
        <AlignRight className="w-4 h-4" />
      </ToolButton>
      <ToolButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justificar">
        <AlignJustify className="w-4 h-4" />
      </ToolButton>

      <Divider />

      <ToolButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Cita">
        <Quote className="w-4 h-4" />
      </ToolButton>
      <ToolButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista">
        <List className="w-4 h-4" />
      </ToolButton>
      <ToolButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada">
        <ListOrdered className="w-4 h-4" />
      </ToolButton>

      <Divider />

      <ToolButton onClick={onInsertImage} title="Insertar imagen" disabled={uploadingImage}>
        <ImagePlus className="w-4 h-4" />
      </ToolButton>
      <ToolButton onClick={onInsertFootnote} title="Insertar nota al pie">
        <StickyNote className="w-4 h-4" />
      </ToolButton>

      <Divider />

      <ToolButton onClick={() => editor.chain().focus().undo().run()} title="Deshacer">
        <Undo2 className="w-4 h-4" />
      </ToolButton>
      <ToolButton onClick={() => editor.chain().focus().redo().run()} title="Rehacer">
        <Redo2 className="w-4 h-4" />
      </ToolButton>
    </div>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-border-light mx-1 flex-shrink-0" />;
}

function ToolButton({
  children,
  onClick,
  active,
  title,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-1.5 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 ${
        active ? 'bg-accent-light text-accent' : 'text-text-secondary hover:bg-surface hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  );
}
