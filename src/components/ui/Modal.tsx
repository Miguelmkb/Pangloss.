import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: 'sm' | 'md';
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ title, onClose, children, width = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2)}`).current;

  useEffect(() => {
    // Foco dentro del diálogo al abrir — el elemento que lo abrió recupera
    // el foco solo al desmontarse, gestionado por el propio navegador al
    // devolver el foco al último elemento activo si no se roba aquí.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (firstFocusable ?? dialogRef.current)?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // Trampa de foco: Tab/Shift+Tab nunca salen del diálogo mientras está
      // abierto — el contenido de detrás debe quedar inerte para teclado.
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    document.body.classList.add('sidebar-open'); // reutiliza el bloqueo de scroll ya definido
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('sidebar-open');
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative bg-white border border-border w-full ${width === 'sm' ? 'max-w-sm' : 'max-w-lg'} max-h-[85vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light sticky top-0 bg-white">
          <h2 id={titleId} className="font-serif text-lg text-text-primary">
            {title}
          </h2>
          <button onClick={onClose} aria-label="Cerrar" className="p-1 text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
