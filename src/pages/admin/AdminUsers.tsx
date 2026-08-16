import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getAllUsers, updateUserRole } from '@/lib/services/users.admin';
import type { Profile, UserRole } from '@/types/database';
import { ROLE_LABELS } from '@/types/database';
import { Modal } from '@/components/ui/Modal';

const ROLES: UserRole[] = ['collaborator', 'editor', 'admin'];

export function AdminUsers() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  async function reload() {
    setLoading(true);
    setUsers(await getAllUsers());
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleRoleChange(userId: string, role: UserRole) {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    try {
      await updateUserRole(userId, role);
      showToast('Rol actualizado.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo cambiar el rol.', 'error');
      reload();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-serif text-3xl font-semibold text-text-primary">Usuarios</h1>
        <button
          onClick={() => setShowInvite(true)}
          className="inline-flex items-center gap-1.5 bg-text-primary text-white px-4 py-2 text-sm font-sans hover:bg-accent transition-colors"
        >
          <UserPlus className="w-4 h-4" /> Invitar usuario
        </button>
      </div>
      <p className="text-sm font-sans text-text-secondary mb-8">Cuentas con acceso al panel. Pangloss no permite registro público.</p>

      {!loading && (
        <div className="border-t border-border-light">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-4 py-3.5 border-b border-border-light">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-sans font-medium text-text-primary">{u.display_name ?? u.email}</p>
                <p className="text-xs font-sans text-text-muted">{u.email}</p>
              </div>
              <select
                value={u.role}
                disabled={u.id === currentUser?.id}
                onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                className="border border-border px-2.5 py-1.5 text-sm font-sans outline-none focus:border-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                title={u.id === currentUser?.id ? 'No puedes cambiar tu propio rol' : undefined}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {showInvite && <InviteInfoModal onClose={() => setShowInvite(false)} />}
    </div>
  );
}

function InviteInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Invitar usuario" onClose={onClose} width="sm">
      <p className="text-sm font-sans text-text-secondary leading-relaxed mb-4">
        Por ahora, las cuentas nuevas se crean desde el <strong>Dashboard de Supabase</strong> (Authentication → Users → Add user).
        En cuanto exista, aparecerán aquí automáticamente con rol de colaborador — puedes subirles el rol con el desplegable de esta lista.
      </p>
      <p className="text-xs font-sans text-text-muted leading-relaxed">
        Un flujo de invitación por correo directamente desde el panel llegará más adelante, cuando se despliegue la función de servidor
        necesaria para ello (requiere una clave que nunca debe vivir en el navegador).
      </p>
      <div className="flex justify-end pt-5">
        <button onClick={onClose} className="px-4 py-2 text-sm font-sans uppercase tracking-widest bg-text-primary text-white hover:bg-accent transition-colors">
          Entendido
        </button>
      </div>
    </Modal>
  );
}
