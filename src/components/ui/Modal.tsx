import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: 'sm' | 'md';
}

export function Modal({ title, onClose, children, width = 'md' }: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    document.body.classList.add('sidebar-open'); // reutiliza el bloqueo de scroll ya definido
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('sidebar-open');
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <div className={`relative bg-white border border-border w-full ${width === 'sm' ? 'max-w-sm' : 'max-w-lg'} max-h-[85vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light sticky top-0 bg-white">
          <h2 className="font-serif text-lg text-text-primary">{title}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="p-1 text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
