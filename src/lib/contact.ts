export const CONTACT_EMAIL = 'panglosstt@gmail.com';

/**
 * `mailto:` depende de que el sistema tenga un cliente de correo de
 * escritorio configurado como predeterminado — si no lo hay (habitual en
 * muchos equipos), el clic no hace nada visible. Como la cuenta es de
 * Gmail, se enlaza directamente al compositor web de Gmail, que siempre
 * funciona desde el navegador. `subject` es opcional, para prellenar el
 * asunto según el contexto (contacto general, propuesta de colaboración…).
 */
export function gmailComposeHref(subject?: string): string {
  const params = new URLSearchParams({ view: 'cm', fs: '1', to: CONTACT_EMAIL });
  if (subject) params.set('su', subject);
  return `https://mail.google.com/mail/?${params.toString()}`;
}
