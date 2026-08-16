import { useState } from 'react';
import type { Editor } from '@tiptap/react';

export function LinkPopover({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [url, setUrl] = useState(editor.getAttributes('link').href ?? '');

  function apply() {
    const value = url.trim();
    if (value) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: value }).run();
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }
    onClose();
  }

  return (
    <div className="absolute top-full left-0 mt-1 bg-white border border-border shadow-sm p-2 flex items-center gap-1.5 z-30" onPointerDown={(e) => e.stopPropagation()}>
      <input
        autoFocus
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') apply();
          if (e.key === 'Escape') onClose();
        }}
        placeholder="https://…"
        className="text-sm font-sans border border-border px-2 py-1 outline-none focus:border-text-primary w-52"
      />
      <button onClick={apply} className="text-xs font-sans uppercase tracking-widest bg-text-primary text-white px-2.5 py-1.5 hover:bg-accent transition-colors">
        OK
      </button>
    </div>
  );
}
