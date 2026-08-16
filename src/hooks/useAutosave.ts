import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';

export interface ArticleSavePatch {
  title?: string;
  subtitle?: string | null;
  slug?: string | null;
  category_id?: string | null;
  author_id?: string | null;
  content?: Record<string, unknown>;
  excerpt?: string | null;
  featured_image_url?: string | null;
  featured_image_alt?: string | null;
  featured_image_caption?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  pdf_url?: string | null;
  reading_time_minutes?: number;
}

function localKey(articleId: string) {
  return `pangloss_draft_${articleId}`;
}

interface LocalDraft extends ArticleSavePatch {
  version: number;
  savedAt: number;
}

/** Copia de seguridad local — no es el mecanismo principal de guardado, es
 * la red que evita perder trabajo si el navegador se cierra o la conexión
 * cae antes de que el guardado en servidor se confirme. */
export function readLocalDraft(articleId: string): LocalDraft | null {
  try {
    const raw = localStorage.getItem(localKey(articleId));
    return raw ? (JSON.parse(raw) as LocalDraft) : null;
  } catch {
    return null;
  }
}

export function clearLocalDraft(articleId: string) {
  try {
    localStorage.removeItem(localKey(articleId));
  } catch {
    /* no crítico */
  }
}

const DEBOUNCE_MS = 1500;
const FORCE_SAVE_MS = 20000;

/**
 * Concurrencia optimista sobre `articles.version`, con dos garantías que
 * antes no existían y causaban falsos "Conflicto de versión" dentro de una
 * misma sesión:
 *
 * 1. Un único guardado en vuelo a la vez (`flushingRef`). Antes, el
 *    guardado forzado periódico, el debounce y una llamada explícita a
 *    `flush()` podían solaparse: dos peticiones podían salir a la vez
 *    creyendo la misma versión de partida, la primera en confirmar subía
 *    la versión real, y la segunda —aunque perfectamente legítima, de la
 *    misma sesión— fallaba por versión desactualizada. Ahora, si llega un
 *    cambio mientras hay un guardado en curso, se encola y se procesa en
 *    el mismo `flush()` en cuanto el anterior termina, siempre con la
 *    versión ya confirmada — nunca dos peticiones a la vez.
 * 2. La versión de partida se captura una única vez, la primera vez que
 *    `initialVersion` deja de ser `null` (es decir, cuando el artículo ya
 *    se ha cargado de verdad) — nunca desde un render intermedio en el que
 *    el artículo aún no existía.
 *
 * Un conflicto real (otra sesión guardó una versión más nueva) se sigue
 * detectando exactamente igual: 0 filas afectadas → 'conflict', sin
 * sobrescribir nada.
 */
export function useAutosave(articleId: string, initialVersion: number | null) {
  const versionRef = useRef<number | null>(null);
  const versionInitialized = useRef(false);
  const pendingRef = useRef<ArticleSavePatch>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // La promesa del guardado en curso, no solo un booleano: así, quien llama
  // a flush() mientras ya hay uno en vuelo se une a esa misma promesa y
  // recibe un resultado real (¿se guardó todo?), en vez de un `return`
  // inmediato que no dice nada. Esto es lo que permite que
  // `handleStatusChange` sepa con certeza si puede publicar o no.
  const flushPromiseRef = useRef<Promise<boolean> | null>(null);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!versionInitialized.current && initialVersion !== null) {
      versionRef.current = initialVersion;
      versionInitialized.current = true;
    }
  }, [initialVersion]);

  const flush = useCallback((): Promise<boolean> => {
    if (flushPromiseRef.current) return flushPromiseRef.current; // ya hay un guardado en curso — únete a él
    if (versionRef.current === null) return Promise.resolve(Object.keys(pendingRef.current).length === 0);
    if (Object.keys(pendingRef.current).length === 0) return Promise.resolve(true);

    const run = async (): Promise<boolean> => {
      let ok = true;
      try {
        // Bucle, no una sola pasada: si mientras esperamos la respuesta llega
        // un cambio nuevo (otro click de toolbar, otra pulsación), se guarda
        // a continuación, en serie, con la versión que el paso anterior acaba
        // de confirmar — nunca con una petición en paralelo.
        while (Object.keys(pendingRef.current).length > 0) {
          const patch = pendingRef.current;
          pendingRef.current = {};
          setStatus('saving');

          if (versionRef.current === null) {
            ok = false;
            break;
          }
          const knownVersion: number = versionRef.current;
          const { data, error } = await supabase
            .from('articles')
            .update(patch)
            .eq('id', articleId)
            .eq('version', knownVersion)
            .select('version')
            .maybeSingle();

          if (error) {
            pendingRef.current = { ...patch, ...pendingRef.current };
            setStatus('error');
            ok = false;
            break;
          }
          if (!data) {
            pendingRef.current = { ...patch, ...pendingRef.current };
            setStatus('conflict');
            ok = false;
            break;
          }
          versionRef.current = data.version;
          setStatus('saved');
          setSavedAt(new Date());
          clearLocalDraft(articleId);
        }
      } finally {
        flushPromiseRef.current = null;
      }
      return ok;
    };

    const promise = run();
    flushPromiseRef.current = promise;
    return promise;
  }, [articleId]);

  // Permite que una escritura fuera del autoguardado (p. ej. un cambio de
  // estado editorial, que también incrementa `version` vía el trigger) le
  // diga al hook cuál es la versión real tras esa escritura. Sin esto, el
  // siguiente autoguardado seguiría partiendo de la versión antigua y
  // fallaría con un falso "Conflicto de versión" — el mismo problema que ya
  // se corrigió para las escrituras solapadas, pero por esta otra vía.
  const syncVersion = useCallback((v: number) => {
    versionRef.current = v;
  }, []);

  const schedule = useCallback(
    (patch: ArticleSavePatch) => {
      pendingRef.current = { ...pendingRef.current, ...patch };
      try {
        localStorage.setItem(
          localKey(articleId),
          JSON.stringify({ ...pendingRef.current, version: versionRef.current ?? 0, savedAt: Date.now() }),
        );
      } catch {
        /* cuota llena u otro fallo de localStorage: no crítico, sigue el guardado en servidor */
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, DEBOUNCE_MS);
    },
    [articleId, flush],
  );

  // Guardado forzado periódico, y al perder foco/pestaña/cerrar — para no
  // depender solo del debounce en sesiones de escritura muy activas.
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(pendingRef.current).length > 0) flush();
    }, FORCE_SAVE_MS);

    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') flush();
    }

    window.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('beforeunload', flush);
    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeunload', flush);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [flush]);

  const currentVersion = useCallback(() => versionRef.current, []);

  // Memoizado para no crear un objeto nuevo en cada render salvo que algo
  // dentro realmente cambie. `status`/`savedAt` cambian a menudo (en cada
  // guardado), así que esto no da una identidad estable frente a esos casos
  // — quien solo necesite una función concreta (p. ej. `schedule`) debe
  // depender de esa función, no del objeto completo.
  return useMemo(
    () => ({ schedule, flush, syncVersion, status, savedAt, currentVersion }),
    [schedule, flush, syncVersion, status, savedAt, currentVersion],
  );
}
