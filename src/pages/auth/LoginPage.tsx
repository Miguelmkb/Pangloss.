import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Red de seguridad: si ya hay sesión (se acaba de crear tras el submit, o
  // el usuario vuelve a /login estando ya autenticado), sal de aquí.
  useEffect(() => {
    if (!loading && user) navigate('/admin', { replace: true });
  }, [loading, user, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    navigate('/admin', { replace: true });
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <img src="/logo.svg" alt="Pangloss" className="h-16 w-16 object-contain mb-4" />
          <h1 className="font-serif text-2xl font-semibold text-text-primary">Acceso privado</h1>
          <p className="text-sm font-sans text-text-muted mt-1">Panel editorial de Pangloss</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-border p-8 space-y-5">
          <label className="block">
            <span className="text-xs font-sans uppercase tracking-widest text-text-muted">Correo</span>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full border border-border px-3 py-2 text-sm font-sans outline-none focus:border-text-primary transition-colors"
            />
          </label>
          <label className="block">
            <span className="text-xs font-sans uppercase tracking-widest text-text-muted">Contraseña</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full border border-border px-3 py-2 text-sm font-sans outline-none focus:border-text-primary transition-colors"
            />
          </label>

          {error && (
            <p role="alert" className="text-xs font-sans text-accent">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-text-primary text-white py-2.5 text-sm font-sans uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-50"
          >
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-xs font-sans text-text-muted mt-6">
          Pangloss no permite registro público. Las cuentas se crean desde el panel de administración.
        </p>
        <p className="text-center text-xs font-sans mt-4">
          <Link to="/" className="text-text-muted hover:text-accent transition-colors">
            ← Volver al sitio
          </Link>
        </p>
      </div>
    </div>
  );
}
