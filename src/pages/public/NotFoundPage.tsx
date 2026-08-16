import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="max-w-editorial mx-auto px-6 py-32 text-center">
      <p className="text-xs font-sans uppercase tracking-widest text-text-muted mb-6">404</p>
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-text-primary mb-3 leading-snug">
        Esto no está aquí.
      </h1>
      <p className="font-serif text-lg text-text-secondary italic mb-8">Quizá fue optimismo pensar que sí.</p>
      <Link to="/" className="link-editorial text-sm font-sans text-accent hover:text-accent-hover transition-colors">
        Volver a Pangloss →
      </Link>
    </div>
  );
}
