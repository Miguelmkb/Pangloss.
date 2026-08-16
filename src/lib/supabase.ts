import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Deliberadamente sin el generic `Database`: mantenerlo en sincronía exacta
// con la forma interna que espera postgrest-js (Relationships, Functions…)
// costaba más de lo que aportaba. Los tipos de dominio (Article, Author…)
// en `types/database.ts` son el contrato real; cada función de
// `lib/services/*` tipa explícitamente lo que devuelve.
export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder-anon-key');
