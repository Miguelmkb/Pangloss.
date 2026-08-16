import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types/database';

export async function getAllUsers(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at');
  if (error) throw error;
  return data ?? [];
}

/**
 * Pasa siempre por la función RPC `update_user_role` (Fase 3), nunca por un
 * UPDATE directo a `profiles.role` — esa función es la única que valida
 * quién puede cambiar roles y evita que alguien se autoasigne admin.
 */
export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  const { error } = await supabase.rpc('update_user_role', { target_user_id: userId, new_role: role });
  if (error) throw error;
}
