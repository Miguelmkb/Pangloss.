/** Divide un texto "largo multipárrafo" por líneas en blanco. Nunca produce
 * HTML: cada resultado se pinta como un `<p>` de React, texto plano. */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Divide un texto "lista" por líneas — un ítem por línea. */
export function splitList(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Sustituye tokens `{nombre}` por su valor. Sin HTML ni lógica — solo
 * reemplazo literal de texto, para campos como `subscribe.successBody`
 * que necesitan insertar el email escrito por la persona. */
export function interpolate(text: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((acc, [k, v]) => acc.split(`{${k}}`).join(v), text);
}
