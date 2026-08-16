import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { ROLE_LABELS } from '@/types/database';

export function SettingsPage() {
  const { profile, role } = useAuth();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() || null, bio: bio.trim() || null })
      .eq('id', profile.id);
    setSaving(false);
    if (error) showToast(error.message, 'error');
    else showToast('Perfil actualizado.');
  }

  return (
    <div className="max-w-md">
      <h1 className="font-serif text-3xl font-semibold text-text-primary mb-1">Configuración</h1>
      <p className="text-sm font-sans text-text-secondary mb-8">Tu perfil dentro del panel editorial.</p>

      <form onSubmit={handleSubmit} className="space-y-4 border border-border p-6">
        <label className="block">
          <span className="text-xs font-sans uppercase tracking-widest text-text-muted">Correo</span>
          <p className="mt-1.5 text-sm font-sans text-text-secondary">{profile?.email}</p>
        </label>
        <label className="block">
          <span className="text-xs font-sans uppercase tracking-widest text-text-muted">Rol</span>
          <p className="mt-1.5 text-sm font-sans text-text-secondary">{role ? ROLE_LABELS[role] : '—'}</p>
        </label>
        <label className="block">
          <span className="text-xs font-sans uppercase tracking-widest text-text-muted">Nombre visible</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1.5 w-full border border-border px-3 py-2 text-sm font-sans outline-none focus:border-text-primary"
          />
        </label>
        <label className="block">
          <span className="text-xs font-sans uppercase tracking-widest text-text-muted">Biografía</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="mt-1.5 w-full border border-border px-3 py-2 text-sm font-sans outline-none focus:border-text-primary resize-none"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm font-sans uppercase tracking-widest bg-text-primary text-white hover:bg-accent transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
