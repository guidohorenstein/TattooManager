import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { limitarPoolBaseDatos } from "./pool-base-datos.js";

// Reservamos margen en Supabase para el servidor local y los despliegues simultáneos.
const url = process.env.DATABASE_URL;
export const prisma = new PrismaClient({
  datasourceUrl: url ? limitarPoolBaseDatos(url) : undefined,
});
