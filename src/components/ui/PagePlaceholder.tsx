interface PagePlaceholderProps {
  title: string;
  description?: string;
  /** Fase en la que esta pantalla recibe su contenido/datos reales. */
  phase: string;
}

/**
 * Marcador de posición temporal para páginas que ya tienen ruta y layout
 * definitivos (Fase 2) pero cuyo contenido llega en una fase posterior.
 * Se elimina página a página a medida que cada una se implementa.
 */
export function PagePlaceholder({ title, description, phase }: PagePlaceholderProps) {
  return (
    <div className="max-w-editorial mx-auto px-6 py-24">
      <p className="text-xs font-sans uppercase tracking-widest text-text-muted mb-4">{phase}</p>
      <h1 className="font-serif text-4xl font-semibold text-text-primary mb-4">{title}</h1>
      {description && (
        <p className="text-base font-sans text-text-secondary leading-relaxed">{description}</p>
      )}
    </div>
  );
}
