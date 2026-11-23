import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { estadoAgenda } from "../src/disponibilidad/estado-agenda.js";
import { semanaInicial } from "../../Front/src/lib/disponibilidad.js";
import type { SolicitudCompleta } from "../src/solicitudes/solicitudes.entity.js";
process.env.JWT_SECRET ??= "solo-pruebas-de-preparacion-de-agenda-32-bytes";
const { prisma } = await import("../src/config/prisma.js");
const { agendarPorInstagram } =
  await import("../src/instagram/instagram-agenda.js");
const { procesarMensajeBot } =
  await import("../src/instagram/instagram-bot.service.js");
function reemplazar(
  t: TestContext,
  objeto: object,
  metodo: string,
  valor: unknown,
) {
  const destino = objeto as Record<string, unknown>;
  const anterior = destino[metodo];
  destino[metodo] = valor;
  t.after(() => {
    destino[metodo] = anterior;
  });
}
const consulta = {
  id: "consulta",
  estudioId: "estudio",
  estado: "ASIGNADA",
  artistaAsignadoId: "artista",
  version: 1,
  cotizaciones: [
    {
      artistaId: "artista",
      duracionMinutos: 90,
      monto: 150000,
      montoSena: 0,
      validaHasta: null,
    },
  ],
} as unknown as SolicitudCompleta;
function preparar(t: TestContext, semana: unknown) {
  const avisos: { usuarioId: string; urgente: boolean; destino: string }[] = [];
  reemplazar(t, prisma.cita, "findFirst", async () => null);
  reemplazar(t, prisma.cita, "findMany", async () => []);
  reemplazar(t, prisma.usuario, "findFirst", async () => ({
    nombre: "Ana",
    nombreArtistico: "Ana Tinta",
  }));
  reemplazar(
    t,
    prisma.disponibilidadArtista,
    "findUnique",
    async ({
      where,
    }: {
      where: { artistaId_ambito: { artistaId: string; ambito: string } };
    }) => {
      assert.deepEqual(where.artistaId_ambito, {
        artistaId: "artista",
        ambito: "estudio",
      });
      return semana === null ? null : { semana, bloqueos: [] };
    },
  );
  reemplazar(
    t,
    prisma.avisoPanel,
    "createMany",
    async ({ data }: { data: typeof avisos }) => {
      avisos.push(...data);
      return { count: data.length };
    },
  );
  return avisos;
}
test("preparación de agenda: distingue ausencia, cierre y horarios válidos", () => {
  assert.equal(estadoAgenda(null), "SIN_CONFIGURAR");
  assert.equal(estadoAgenda([]), "SIN_CONFIGURAR");
  assert.equal(estadoAgenda(semanaInicial()), "LISTA");
  assert.equal(
    estadoAgenda(semanaInicial().map((d) => ({ ...d, rangos: [] }))),
    "CERRADA",
  );
  const invalida = semanaInicial();
  invalida[0]!.rangos = [{ desde: "18:00", hasta: "09:00" }];
  assert.equal(estadoAgenda(invalida), "SIN_CONFIGURAR");
});
for (const [nombre, semana] of [
  ["sin configurar", null],
  ["cerrada", semanaInicial().map((d) => ({ ...d, rangos: [] }))],
  ["inválida", []],
] as const) {
  test(
    "el cliente recibe continuidad y el titular una alerta si la agenda está " +
      nombre,
    async (t) => {
      const avisos = preparar(t, semana);
      const resultado = await agendarPorInstagram(
        "titular",
        consulta,
        "America/Argentina/Buenos_Aires",
      );
      assert.equal(resultado.requiereAtencion, true);
      assert.match(resultado.texto, /seguir por este chat/);
      assert.doesNotMatch(
        resultado.texto,
        /cargar|configur|no tiene horarios|error/i,
      );
      assert.equal(resultado.agenda, undefined);
      assert.equal(avisos.length, 1);
      assert.equal(avisos[0]!.usuarioId, "titular");
      assert.equal(avisos[0]!.urgente, true);
      assert.equal(
        avisos[0]!.destino,
        "/estudio/disponibilidad?artista=artista",
      );
    },
  );
}
test("un turno existente se informa aunque el artista tenga la agenda sin configurar", async (t) => {
  const avisos = preparar(t, null);
  reemplazar(t, prisma.cita, "findFirst", async () => ({
    inicioAt: new Date(Date.now() + 86400000),
    estado: "CONFIRMADA",
  }));
  const resultado = await agendarPorInstagram(
    "titular",
    consulta,
    "America/Argentina/Buenos_Aires",
  );
  assert.match(resultado.texto, /próximo turno/);
  assert.equal(resultado.requiereAtencion, undefined);
  assert.equal(avisos.length, 0);
});
test("el chatbot pausa la automatización después de entregar la derivación por falta de agenda", async (t) => {
  preparar(t, null);
  reemplazar(t,prisma.gestionConversacion,'upsert',async()=>({id:'gestion'}));
  reemplazar(t,prisma.eventoConversacion,'create',async()=>({}));
  let pausado = false;
  const enviados: string[] = [];
  reemplazar(t, prisma.mensajeCanal, "findUnique", async () => null);
  reemplazar(t, prisma.conversacionCanal, "findUnique", async () => ({
    id: "hilo",
    estudioId: "estudio",
    canal: "INSTAGRAM",
    solicitudId: "consulta",
    ultimaEntradaAt: new Date(),
    flujoInstagram: null,
    estudio: {
      propietarioId: "titular",
      zonaHoraria: "America/Argentina/Buenos_Aires",
    },
  }));
  reemplazar(t, prisma.solicitud, "findFirst", async () => consulta);
  reemplazar(
    t,
    prisma,
    "$transaction",
    async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma),
  );
  reemplazar(t, prisma, "$queryRaw", async () => []);
  reemplazar(
    t,
    prisma.flujoInstagram,
    "upsert",
    async ({ update }: { update: { pausadoAt: Date } }) => {
      pausado = update.pausadoAt instanceof Date;
      return {};
    },
  );
  t.mock.method(globalThis, "fetch", async () => {
    throw Error("La prueba no debe usar servicios externos.");
  });
  await procesarMensajeBot(
    "hilo",
    "titular",
    "mensaje",
    "horarios",
    async (_hilo, _clave, texto) => {
      enviados.push(texto);
      return "ENVIADO";
    },
  );
  assert.equal(enviados.length, 1);
  assert.match(enviados[0]!, /seguir por este chat/);
  assert.equal(pausado, true);
});
