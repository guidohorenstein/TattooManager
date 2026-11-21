import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
export function firmarIP(headers: Headers, method: string, pathname: string) {
  const salida = new Headers(headers);
  for (const name of ['x-tattoo-client-ip', 'x-tattoo-proxy-time', 'x-tattoo-proxy-signature'])
    salida.delete(name);
  const secret = process.env.API_PROXY_SECRET;
  if (!secret) return salida;
  if (secret.length < 32) throw new Error('API_PROXY_SECRET debe tener al menos 32 caracteres.');
  // Vercel reemplaza esta cabecera en su borde. Fuera de Vercel no confiamos en datos del visitante.
  const ip =
    process.env.VERCEL === '1' ? headers.get('x-vercel-forwarded-for')?.trim() : '127.0.0.1';
  if (!ip || !isIP(ip)) return salida;
  const time = String(Date.now());
  const signature = createHmac('sha256', secret)
    .update([time, ip, method.toUpperCase(), pathname].join('\n'))
    .digest('hex');
  salida.set('x-tattoo-client-ip', ip);
  salida.set('x-tattoo-proxy-time', time);
  salida.set('x-tattoo-proxy-signature', signature);
  return salida;
}
