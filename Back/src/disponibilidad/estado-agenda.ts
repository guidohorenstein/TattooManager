import { validarSemana } from "./disponibilidad.validation.js";

export function estadoAgenda(
  entrada: unknown,
): "SIN_CONFIGURAR" | "CERRADA" | "LISTA" {
  try {
    const semana = validarSemana(entrada);
    return semana.some((dia) => dia.rangos.length > 0) ? "LISTA" : "CERRADA";
  } catch {
    return "SIN_CONFIGURAR";
  }
}
