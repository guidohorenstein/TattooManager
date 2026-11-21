import { createHash } from "node:crypto";
export function destinoSeed(url: string) {
  const destino = new URL(url);
  if (!/^postgres(?:ql)?:$/.test(destino.protocol)) throw new Error("El seed requiere PostgreSQL.");
  const identidad = [destino.hostname, destino.port || "5432", destino.pathname, destino.username].join("|");
  return { host: destino.hostname, base: destino.pathname.slice(1), huella: createHash("sha256").update(identidad).digest("hex") };
}
export function autorizarSeed(env: NodeJS.ProcessEnv = process.env) {
  if (!env.DATABASE_URL) throw new Error("Falta DATABASE_URL.");
  const destino = destinoSeed(env.DATABASE_URL);
  if (!["development", "test"].includes(env.NODE_ENV ?? "") || env.SEED_ENABLED !== "1" ||
      env.SEED_DATABASE_FINGERPRINT !== destino.huella) {
    throw new Error("Seed bloqueado. Usá desarrollo/test, SEED_ENABLED=1 y la huella del destino obtenida con --describe. No se modificaron datos.");
  }
  return destino;
}
