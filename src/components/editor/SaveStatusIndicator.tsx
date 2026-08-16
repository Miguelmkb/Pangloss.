import { useEffect, useState } from 'react';
import type { SaveStatus } from '@/hooks/useAutosave';

function relativeLabel(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 15) return 'Guardado';
  if (seconds < 60) return `Guardado hace ${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Guardado hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `Guardado hace ${hours} h`;
}

/** Discreto a propósito — nunca un contador, solo la confianza de que el trabajo está a salvo. */
export function SaveStatusIndicator({ status, savedAt }: { status: SaveStatus; savedAt: Date | null }) {
  const [, forceTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 15000);
    return () => clearInterval(id);
  }, []);

  if (status === 'saving') return <span className="text-xs font-sans text-text-muted">Guardando…</span>;
  if (status === 'error') return <span className="text-xs font-sans text-accent">Sin conexión — reintentando…</span>;
  if (status === 'conflict') return <span className="text-xs font-sans text-accent">Conflicto de versión</span>;
  if (status === 'saved' && savedAt) return <span className="text-xs font-sans text-text-muted">{relativeLabel(savedAt)}</span>;
  return null;
}
