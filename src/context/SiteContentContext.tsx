import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { SITE_CONTENT_MAP } from '@/lib/siteContent/manifest';

interface SiteContentContextValue {
  /** true mientras se hace la primera carga; los textos ya muestran su
   * valor por defecto durante este tiempo, nunca queda nada en blanco. */
  loading: boolean;
  overrides: Record<string, string>;
  refresh: () => Promise<void>;
}

const SiteContentContext = createContext<SiteContentContextValue | null>(null);

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('site_content').select('key, value');
    if (!error && data) {
      const map: Record<string, string> = {};
      for (const row of data as { key: string; value: string }[]) map[row.key] = row.value;
      setOverrides(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo(() => ({ loading, overrides, refresh: load }), [loading, overrides, load]);

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

/**
 * Devuelve el texto público editable para `key`: lo que haya guardado un
 * administrador en `site_content`, o si no hay nada guardado (todavía, o
 * nunca lo tocó), el valor por defecto del manifiesto — que es el texto
 * original de Pangloss. Nunca puede devolver "undefined" ni romper el
 * render: si `key` no está en el manifiesto (error de programación, no de
 * contenido), avisa en consola en desarrollo y devuelve cadena vacía en vez
 * de lanzar.
 */
export function useSiteContent(key: string): string {
  const ctx = useContext(SiteContentContext);
  const field = SITE_CONTENT_MAP[key];
  if (import.meta.env.DEV && !field) {
    console.warn(`useSiteContent: "${key}" no existe en el manifiesto de site_content.`);
  }
  const fallback = field?.defaultValue ?? '';
  if (!ctx) return fallback; // fuera del provider (no debería pasar) — nunca rompe
  const override = ctx.overrides[key];
  return override && override.trim() !== '' ? override : fallback;
}

/** Para el panel /admin/contenido: acceso directo al contexto completo. */
export function useSiteContentAdmin() {
  const ctx = useContext(SiteContentContext);
  if (!ctx) throw new Error('useSiteContentAdmin debe usarse dentro de SiteContentProvider.');
  return ctx;
}
