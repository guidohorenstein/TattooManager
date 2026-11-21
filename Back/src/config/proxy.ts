import type { Express } from "express";
import { isIP } from "node:net";

export function proxiesConfiables(env: NodeJS.ProcessEnv = process.env): false | string[] {
  const valor = env.TRUSTED_PROXY_CIDRS?.trim();
  if (!valor) return false;
  const redes = valor.split(",").map(red => red.trim());
  for (const red of redes) {
    const [ip, prefijo, extra] = red.split("/");
    const version = isIP(ip ?? "");
    const bits = version === 4 ? 32 : 128;
    if (!version || extra !== undefined || (prefijo !== undefined &&
      (!/^\d+$/.test(prefijo) || Number(prefijo) < 1 || Number(prefijo) > bits))) {
      throw new Error("TRUSTED_PROXY_CIDRS debe contener IPs o redes CIDR concretas, separadas por comas.");
    }
  }
  return redes;
}

export function configurarProxy(app: Express) {
  app.set("trust proxy", proxiesConfiables());
}
