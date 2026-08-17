import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  /** Ilustración opcional encima del título — hoy solo <NotFoundMark />,
   * pasada explícitamente por cada página en los casos de "no encontrado"
   * (nunca por defecto: la mayoría de estados vacíos son de "todavía no
   * hay nada" y no deben llevarla). */
  illustration?: ReactNode;
}

export function EmptyState({ title, description, illustration }: EmptyStateProps) {
  return (
    <div className="py-20 text-center">
      {illustration}
      <p className="font-serif text-xl text-text-primary mb-2">{title}</p>
      {description && <p className="text-sm font-sans text-text-muted max-w-sm mx-auto">{description}</p>}
    </div>
  );
}
