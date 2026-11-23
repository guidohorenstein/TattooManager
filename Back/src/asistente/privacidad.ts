export const motivosPrivacidad = [
  "SALUD",
  "INTIMIDAD",
  "DOCUMENTOS",
  "CREDENCIALES",
  "PAGO_PRIVADO",
  "MENORES",
  "ADJUNTO",
  "EXTENSION",
] as const;
export type MotivoPrivacidad = (typeof motivosPrivacidad)[number];
export const avisoAsistenteVirtual =
  "Soy el asistente virtual del estudio. Evitá enviar documentos, datos de pago o información de salud por acá.";
export const respuestaAtencionPrivada =
  "Para cuidar tu privacidad, esa consulta la va a revisar una persona del equipo. Te van a responder por este chat.";

function normalizar(texto: string) {
  return texto.normalize("NFKC").replace(/\p{Cf}/gu, "");
}
function pareceTarjeta(texto: string) {
  const candidatos = texto.match(/(?<!\d)(?:\d[ .-]*){13,19}(?!\d)/g) ?? [];
  return candidatos.some((c) => {
    const digitos = c.replace(/\D/g, "");
    if (digitos.length < 13 || digitos.length > 19 || /^0+$/.test(digitos))
      return false;
    let suma = 0;
    for (
      let i = digitos.length - 1, doble = false;
      i >= 0;
      i--, doble = !doble
    ) {
      let v = Number(digitos[i]);
      if (doble) {
        v *= 2;
        if (v > 9) v -= 9;
      }
      suma += v;
    }
    return suma % 10 === 0;
  });
}
export function evaluarPrivacidad(texto: string): MotivoPrivacidad | null {
  const t = normalizar(texto)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
  if (t.length > 24000) return "EXTENSION";
  if (
    /\b(?:diabet\w*|alerg\w*|embaraz\w*|amamant\w*|lactancia|medicacion|medicamento\w*|anticoagulante\w*|antibiotico\w*|diagnostico\w*|enfermedad\w*|epilep\w*|hepatitis|vih|hiv|cancer|quimioterapia|inmunosuprim\w*|inmunodeprim\w*|infeccion\w*|infectad\w*|fiebre|secrecion\w*|pus|sangrado|cicatriz\w*|queloide\w*|cirugia|operacion medica|problema de salud|estado de salud|historia clinica|historial medico|pregnan\w*|breastfeed\w*|allerg\w*|medication\w*|anticoagulant\w*|diagnos\w*|medical condition)\b/.test(
      t,
    )
  )
    return "SALUD";
  if (
    /\b(?:foto\w* intima\w*|desnud\w*|genital\w*|pene|vagina|vulva|pezon\w*|pubis|ingle|pornograf\w*|nude\w*|naked|intimate photo\w*|genitalia)\b/.test(
      t,
    )
  )
    return "INTIMIDAD";
  if (/\bano\b/i.test(normalizar(texto))) return "INTIMIDAD";
  if (
    /\b(?:contrasena|password|clave secreta|access[_ -]?token|api[_ -]?key|codigo de (?:verificacion|seguridad)|cvv|cvc|secret key|verification code|security code)\b/.test(
      t,
    ) ||
    /eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]+\.|\b(?:gh[pousr]_|sk_(?:live|test)_|gsk_)[A-Za-z0-9_-]{12,}/i.test(
      texto,
    )
  )
    return "CREDENCIALES";
  if (
    /\b(?:cbu|cvu|iban|numero de (?:cuenta bancaria|tarjeta)|bank account|card number)\b/.test(
      t,
    ) ||
    /\b(?:tarjeta|cuenta bancaria)\s*(?::|es|nro|numero)?\s*(?:\d[ .-]*){6,}/.test(
      t,
    )
  )
    return "PAGO_PRIVADO";
  if (pareceTarjeta(t)) return "PAGO_PRIVADO";
  if (
    /\b(?:mi fecha de nacimiento|naci el|naci en|date of birth|dob)\b/.test(t)
  )
    return "DOCUMENTOS";
  if (
    /\b(?:mi dni|mi pasaporte|mi documento|my passport|my id|my ssn|foto del? (?:dni|documento|pasaporte)|adjunto (?:el |mi )?(?:dni|documento|pasaporte))\b/.test(
      t,
    ) ||
    /\b(?:dni|documento|pasaporte|cuit|cuil)\s*(?::|es|nro|numero)?\s*[a-z0-9 .-]*\d[0-9 .-]{5,}/.test(
      t,
    )
  )
    return "DOCUMENTOS";
  if (
    /\bmenor de edad\b|\b(?:tengo|tiene|cumplo|cumple|de|i am|im|aged)\s+(?:[0-9]|1[0-7])\s*(?:anos|years old)\b/.test(
      t,
    )
  )
    return "MENORES";
  if (
    /este mensaje contiene contenido multimedia|^\s*\[(?:imagen|foto|adjunto|audio|video)\]/i.test(
      t,
    )
  )
    return "ADJUNTO";
  return null;
}
function letras(numero: number) {
  let s = "";
  do {
    s = String.fromCharCode(97 + (numero % 26)) + s;
    numero = Math.floor(numero / 26) - 1;
  } while (numero >= 0);
  return s;
}
export function minimizarTexto(
  texto: string,
  identidades: readonly string[] = [],
) {
  let seguro = normalizar(texto);
  const nombres = [
    ...new Set(
      identidades
        .filter(
          (v) =>
            typeof v === "string" && v.trim().length >= 3 && v.length <= 200,
        )
        .flatMap((v) => [
          v.trim(),
          ...v
            .trim()
            .split(/\s+/)
            .filter((p) => p.length >= 3),
        ]),
    ),
  ].sort((a, b) => b.length - a.length);
  for (const nombre of nombres) {
    const literal = nombre.replace(/[.*+?^$(){}|[\]\\]/g, "\\$&");
    seguro = seguro.replace(
      new RegExp(
        "(?<![\\p{L}\\p{N}_])" + literal + "(?![\\p{L}\\p{N}_])",
        "giu",
      ),
      "[persona]",
    );
  }
  seguro = seguro
    .replace(/[^\s<>@]+@[a-z0-9.-]+\.[a-z]{2,}/gi, "[correo]")
    .replace(/https?:\/\/[^\s<>]+|www\.[^\s<>]+/gi, "[enlace]")
    .replace(/@[\p{L}\p{N}_.]+/gu, "[usuario]")
    .replace(
      /\b[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\b/gi,
      "[identificador]",
    )
    .replace(
      /\b(?:me llamo|mi nombre es|nombre y apellido\s*:|nombre completo\s*:)\s*[\p{L}'’.-]+(?:\s+(?!(?:y|pero|quiero|quisiera|necesito|busco|tengo|para|hola|buenas)\b)[\p{L}'’.-]+){0,3}/giu,
      "[presentación]",
    )
    .replace(
      /\b[Ss]oy\s+[\p{Lu}][\p{L}'’-]+(?:\s+[\p{Lu}][\p{L}'’-]+){0,3}/gu,
      "[presentación]",
    )
    .replace(
      /\b(?:mi (?:telefono|teléfono|celular|numero|número)|mi (?:direccion|dirección|domicilio)(?: es)?|vivo en)\s*:?\s*[^.!?\n]+/giu,
      "[contacto]",
    );
  const protegidos: string[] = [];
  seguro = seguro.replace(
    /\b(?:20\d{2}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b|(?:\$|\bARS\b|\bUSD\b)\s*\d[\d.,]*/g,
    (v) => {
      protegidos.push(v);
      return "[valor_" + letras(protegidos.length - 1) + "]";
    },
  );
  seguro = seguro.replace(/(?<!\d)\+?\d(?:[\d ().-]*\d)?(?!\d)/g, (v) =>
    v.replace(/\D/g, "").length >= 7 ? "[número]" : v,
  );
  seguro = seguro.replace(/\[valor_([a-z]+)\]/g, (_, codigo: string) => {
    let i = 0;
    for (const c of codigo) i = i * 26 + c.charCodeAt(0) - 96;
    return protegidos[i - 1] ?? "[valor]";
  });
  return seguro.trim();
}
export function textoPublicoParaIa(
  texto: string,
  identidades: readonly string[] = [],
) {
  return evaluarPrivacidad(texto) ? "" : minimizarTexto(texto, identidades);
}
