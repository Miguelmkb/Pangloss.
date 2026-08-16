import { Modal } from './Modal';

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, description, confirmLabel = 'Confirmar', danger, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel} width="sm">
      <p className="text-sm font-sans text-text-secondary leading-relaxed mb-6">{description}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="px-4 py-2 text-sm font-sans text-text-secondary hover:text-text-primary transition-colors">
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 text-sm font-sans uppercase tracking-widest text-white transition-colors ${
            danger ? 'bg-accent hover:bg-accent-hover' : 'bg-text-primary hover:bg-accent'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
