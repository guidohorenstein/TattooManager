import { createHmac, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import type { Request, Response, RequestHandler } from "express";
import { ipKeyGenerator, rateLimit as crearLimite } from "express-rate-limit";

export const identificarCliente: RequestHandler = (req, res, next) => {
  const secret = process.env.API_PROXY_SECRET;
  const ip = req.get("x-tattoo-client-ip");
  const time = req.get("x-tattoo-proxy-time");
  const firma = req.get("x-tattoo-proxy-signature");
  if (secret && secret.length >= 32 && ip && isIP(ip) && time && /^\d{13}$/.test(time) &&
      Math.abs(Date.now() - Number(time)) < 60_000 && firma && /^[a-f0-9]{64}$/.test(firma)) {
    const esperada = createHmac("sha256", secret).update([time, ip, req.method.toUpperCase(), req.path].join("\n")).digest();
    if (timingSafeEqual(esperada, Buffer.from(firma, "hex"))) res.locals.ipCliente = ip;
  }
  next();
};
export function claveIP(req: Request, res: Response) {
  return ipKeyGenerator(res.locals.ipCliente ?? req.ip ?? req.socket.remoteAddress ?? "");
}
export function rateLimit(options: Parameters<typeof crearLimite>[0]) {
  return crearLimite({ keyGenerator: claveIP, ...options });
}
