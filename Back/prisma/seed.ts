import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import { autorizarSeed, destinoSeed } from "./seed-seguridad.js";

if (process.argv.includes("--describe")) {
  if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL.");
  console.log(JSON.stringify(destinoSeed(process.env.DATABASE_URL), null, 2));
} else {
  autorizarSeed();
  const prisma = new PrismaClient();
  const carpeta = new URL("../../docs-local/accesos-seed/", import.meta.url);
  const archivo = new URL("cuentas.json", carpeta);
  const id = (n: number) => "bd202026-1120-4000-8000-" + String(n).padStart(12, "0");
  const estudioId = id(100);
  const cuentas = [
    { id: id(1), email: "estudio@tattoomanager.example.test", nombre: "Trazo Estudio", rol: "ESTUDIO_ADMIN" as const, estudioId },
    { id: id(2), email: "artista@tattoomanager.example.test", nombre: "Lucía Torres", rol: "ARTISTA" as const, estudioId },
    { id: id(3), email: "independiente@tattoomanager.example.test", nombre: "Nicolás Vera", rol: "ARTISTA" as const, estudioId: null },
  ];
  try {
    // Persistimos accesos antes de crear usuarios. Los reintentos conservan las mismas claves.
    await fs.mkdir(carpeta, { recursive: true });
    try {
      await fs.writeFile(archivo, JSON.stringify(cuentas.map(c => ({ ...c, password: "Tattoo!" + randomBytes(18).toString("base64url") + "7a" })), null, 2), { flag: "wx", mode: 0o600 });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    const accesos: { id: string; email: string; password: string }[] = JSON.parse(await fs.readFile(archivo, "utf8"));
    const hashes = await Promise.all(cuentas.map(async c => {
      const acceso = accesos.find(a => a.id === c.id && a.email === c.email);
      if (!acceso || typeof acceso.password !== "string" || acceso.password.length < 20) throw new Error("El archivo privado de accesos no coincide con el seed.");
      return bcrypt.hash(acceso.password, 12);
    }));
    await prisma.$transaction(async tx => {
      // Un conflicto con una cuenta ajena aborta el conjunto; no reasignamos usuarios existentes.
      for (const c of cuentas) {
        const existente = await tx.usuario.findUnique({ where: { email: c.email }, select: { id: true, rol: true, estudioId: true } });
        if (existente && (existente.id !== c.id || existente.rol !== c.rol || existente.estudioId !== c.estudioId)) throw new Error("Hay una cuenta existente que no pertenece a este seed.");
      }
      await tx.estudio.upsert({ where: { id: estudioId }, update: {}, create: { id: estudioId, nombre: "Trazo Estudio", slug: "trazo-seed", ciudad: "Buenos Aires", pais: "Argentina" } });
      for (const [i,c] of cuentas.entries()) {
        await tx.usuario.upsert({ where: { id: c.id }, update: {}, create: { ...c, password: hashes[i]!, nombreArtistico: c.rol === "ARTISTA" ? c.nombre : null, estilosPrincipales: [], metodosPagoAceptados: [] } });
      }
      await tx.estudio.updateMany({ where: { id: estudioId, propietarioId: null }, data: { propietarioId: cuentas[0]!.id } });
    });
    console.log("Seed completado sin borrar ni reemplazar registros. Accesos privados en docs-local/accesos-seed/cuentas.json.");
  } finally {
    await prisma.$disconnect();
  }
}
