import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';

interface FootnoteModalProps {
  initialText: string;
  onSave: (text: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function FootnoteModal({ initialText, onSave, onDelete, onClose }: FootnoteModalProps) {
  const [text, setText] = useState(initialText);

  return (
    <Modal title="Nota al pie" onClose={onClose} width="sm">
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="Texto de la nota…"
        className="w-full border border-border px-3 py-2 text-sm font-sans outline-none focus:border-text-primary resize-none mb-4"
      />
      <div className="flex justify-between items-center">
        {onDelete ? (
          <button onClick={onDelete} className="text-xs font-sans text-text-muted hover:text-accent transition-colors">
            Eliminar nota
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-sans text-text-secondary hover:text-text-primary transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => text.trim() && onSave(text.trim())}
            className="px-4 py-2 text-sm font-sans uppercase tracking-widest bg-text-primary text-white hover:bg-accent transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  );
}
