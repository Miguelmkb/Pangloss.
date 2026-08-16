/**
 * Plantillas de email compartidas — mismos tokens de color que el sitio
 * (src/styles/index.css), pero con CSS inline: la mayoría de clientes de
 * correo ignoran <style> en el <head> o las clases de Tailwind, así que
 * todo va como atributo `style` directamente en cada elemento.
 */

const COLORS = {
  text: '#1a1a1a',
  textSecondary: '#4a4a4a',
  textMuted: '#8a8a8a',
  border: '#e2e0dc',
  bg: '#f7f6f2',
  bgWhite: '#ffffff',
  accent: '#7a1e1e',
};

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

/**
 * `${siteUrl}/logo.png` solo es alcanzable desde fuera una vez el sitio
 * está desplegado de verdad (en local, "siteUrl" es localhost, invisible
 * para Gmail y cualquier cliente de correo). EMAIL_LOGO_URL permite alojar
 * el logo en un sitio siempre público (p. ej. Supabase Storage) en vez de
 * depender de eso — recomendado, pero con fallback razonable si no está.
 */
export function resolveLogoUrl(siteUrl: string): string {
  return process.env.EMAIL_LOGO_URL || `${siteUrl}/logo.png`;
}

/**
 * Cabecera tipo masthead de una publicación (logo + nombre en línea) — el
 * logo se apoya en una versión de 160px subida a Supabase Storage para que
 * a este tamaño se vea nítido en pantallas retina, no solo ampliado.
 */
function header(logoUrl: string): string {
  return `<td style="padding:0 0 40px;text-align:center;">
    <img src="${logoUrl}" width="70" height="70" alt="Pangloss" style="display:inline-block;vertical-align:middle;border-radius:50%;" />
    <span style="display:inline-block;vertical-align:middle;margin-left:14px;font-family:${SERIF};font-size:16px;letter-spacing:2.5px;text-transform:uppercase;color:${COLORS.text};font-weight:bold;">Pangloss</span>
  </td>`;
}

function wrapper(logoUrl: string, bodyHtml: string, maxWidth = 480): string {
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:${COLORS.bg};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.bg};padding:48px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:${maxWidth}px;">
            <tr>${header(logoUrl)}</tr>
            <tr>
              <td style="background-color:${COLORS.bgWhite};border:1px solid ${COLORS.border};border-radius:4px;padding:44px 44px 40px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:28px 8px 0;text-align:center;">
                <p style="margin:0;font-family:${SERIF};font-size:12px;font-style:italic;line-height:1.6;color:${COLORS.textMuted};">
                  «Todo está bien en el mejor de los mundos posibles.»
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function primaryLink(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;font-family:${SANS};font-size:14px;font-weight:600;letter-spacing:0.3px;color:${COLORS.accent};text-decoration:none;border-bottom:1.5px solid ${COLORS.accent};padding-bottom:2px;">
    ${label}
  </a>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 4px;">
    <tr>
      <td style="background-color:${COLORS.text};border-radius:2px;">
        <a href="${href}" style="display:inline-block;padding:13px 28px;font-family:${SANS};font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:#ffffff;text-decoration:none;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

export function renderConfirmationEmail(logoUrl: string, confirmUrl: string): { subject: string; html: string } {
  const body = `
    <h1 style="margin:0 0 16px;font-family:${SERIF};font-size:25px;color:${COLORS.text};font-weight:normal;">
      Una última comprobación.
    </h1>
    <p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.7;color:${COLORS.textSecondary};">
      Pangloss está a punto de entrar en tu bandeja de entrada. Confirma que esta dirección es tuya y nos
      encargamos del resto.
    </p>
    ${button(confirmUrl, 'Confirmar suscripción')}
    <p style="margin:22px 0 0;font-family:${SANS};font-size:13px;line-height:1.65;color:${COLORS.textMuted};">
      Sin ruido, sin boletines diarios — solo un aviso cuando de verdad tengamos algo que contar. Si no has sido
      tú, ignora este correo sin más.
    </p>
    <p style="margin:14px 0 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${COLORS.textMuted};">
      ¿Ha caído en spam? Márcalo como «no es spam» — así los próximos te llegarán directos.
    </p>
  `;
  return { subject: 'Una última comprobación — confirma tu suscripción a Pangloss', html: wrapper(logoUrl, body) };
}

export interface ArticleEmailInput {
  logoUrl: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  imageUrl: string | null;
  articleUrl: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
  authorName: string | null;
  categoryName: string | null;
  matchedVia: 'author' | 'category' | 'all';
}

export function renderArticleNotificationEmail(input: ArticleEmailInput): { subject: string; html: string } {
  const {
    logoUrl,
    title,
    subtitle,
    excerpt,
    imageUrl,
    articleUrl,
    unsubscribeUrl,
    preferencesUrl,
    authorName,
    categoryName,
    matchedVia,
  } = input;

  // El indicador editorial de arriba del todo es también la personalización:
  // una sola frase hace ambas cosas, sin plantillas separadas por motivo.
  let kicker = 'Una nueva pieza en Pangloss.';
  if (matchedVia === 'category' && categoryName) {
    kicker = `Una nueva pieza de ${categoryName}.`;
  } else if (matchedVia === 'author' && authorName) {
    kicker = `Una nueva pieza de ${firstName(authorName)}.`;
  }

  const subject = `${kicker} ${title}`;

  const body = `
    <p style="margin:0 0 18px;font-family:${SANS};font-size:12px;letter-spacing:0.3px;color:${COLORS.accent};font-style:italic;">
      ${escapeHtml(kicker)}
    </p>
    ${categoryName ? `<p style="margin:0 0 10px;font-family:${SANS};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.textMuted};">${escapeHtml(categoryName)}</p>` : ''}
    <h1 style="margin:0 0 10px;font-family:${SERIF};font-size:30px;line-height:1.2;color:${COLORS.text};font-weight:normal;">
      ${escapeHtml(title)}
    </h1>
    ${subtitle ? `<p style="margin:0 0 22px;font-family:${SERIF};font-size:17px;line-height:1.5;color:${COLORS.textSecondary};">${escapeHtml(subtitle)}</p>` : ''}
    ${imageUrl ? `<img src="${imageUrl}" width="392" alt="" style="display:block;width:100%;max-width:392px;height:auto;border-radius:2px;margin:0 0 22px;" />` : ''}
    ${excerpt ? `<p style="margin:0 0 20px;font-family:${SANS};font-size:15px;line-height:1.7;color:${COLORS.textSecondary};">${escapeHtml(excerpt)}</p>` : ''}
    ${authorName ? `<p style="margin:0 0 22px;font-family:${SANS};font-size:13px;color:${COLORS.textMuted};">Por ${escapeHtml(authorName)}</p>` : ''}
    <p style="margin:0;">${primaryLink(articleUrl, 'Leer artículo →')}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:36px;border-top:1px solid ${COLORS.border};">
      <tr>
        <td style="padding-top:18px;font-family:${SANS};font-size:11px;line-height:1.6;color:${COLORS.textMuted};">
          <a href="${preferencesUrl}" style="color:${COLORS.textMuted};">Cambiar preferencias</a> ·
          <a href="${unsubscribeUrl}" style="color:${COLORS.textMuted};">Darme de baja</a>
        </td>
      </tr>
    </table>
  `;

  return { subject, html: wrapper(logoUrl, body, 440) };
}
