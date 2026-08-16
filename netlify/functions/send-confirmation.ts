import type { Handler } from '@netlify/functions';
import { Resend } from 'resend';
import { renderConfirmationEmail, resolveLogoUrl } from './lib/emailTemplate';

/**
 * Envía el email de confirmación de una suscripción recién creada. Lo
 * llama el cliente justo después de `subscribe()` — la clave de Resend
 * (RESEND_API_KEY) solo existe aquí, nunca en el navegador.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const apiKey = process.env.RESEND_API_KEY;
  const siteUrl = process.env.URL || 'https://pangloss.example';
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Pangloss <onboarding@resend.dev>';
  if (!apiKey) return { statusCode: 500, body: 'Falta RESEND_API_KEY.' };

  let body: { email?: string; confirmToken?: string };
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'JSON inválido.' };
  }

  const { email, confirmToken } = body;
  if (!email || !confirmToken) return { statusCode: 400, body: 'Faltan datos.' };

  const confirmUrl = `${siteUrl}/confirmar-suscripcion?token=${confirmToken}`;
  const { subject, html } = renderConfirmationEmail(resolveLogoUrl(siteUrl), confirmUrl);

  const resend = new Resend(apiKey);
  try {
    await resend.emails.send({ from: fromEmail, to: email, subject, html });
  } catch {
    return { statusCode: 500, body: 'No se pudo enviar el email.' };
  }

  return { statusCode: 200, body: 'ok' };
};
