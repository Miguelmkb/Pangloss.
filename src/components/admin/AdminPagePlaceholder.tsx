interface AdminPagePlaceholderProps {
  title: string;
  description: string;
  phase: string;
}

/** Igual que PagePlaceholder pero con la alineación izquierda propia del panel. */
export function AdminPagePlaceholder({ title, description, phase }: AdminPagePlaceholderProps) {
  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold text-text-primary mb-1">{title}</h1>
      <p className="text-sm font-sans text-text-secondary mb-1">{description}</p>
      <p className="text-xs font-sans uppercase tracking-widest text-text-muted">{phase}</p>
    </div>
  );
}
