interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="py-20 text-center">
      <p className="font-serif text-xl text-text-primary mb-2">{title}</p>
      {description && <p className="text-sm font-sans text-text-muted max-w-sm mx-auto">{description}</p>}
    </div>
  );
}
