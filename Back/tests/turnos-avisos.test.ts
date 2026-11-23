import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
process.env.JWT_SECRET ??= "solo-pruebas-avisos-turnos-32-bytes";
const { prisma } = await import("../src/config/prisma.js");
const { notificarTurnosInstagram } =
  await import("../src/instagram/instagram-turnos.repository.js");
function simular(t: TestContext, objeto: object, k: string, impl: unknown) {
  const d = objeto as Record<string, unknown>,
    previo = d[k];
  d[k] = impl;
  t.after(() => {
    d[k] = previo;
  });
}
function preparar(
  t: TestContext,
  op: { estado?: string; pausado?: boolean; fueraDeVentana?: boolean } = {},
) {
  const cita = {
    id: "turno",
    version: 3,
    inicioAt: new Date(Date.now() + 86400000),
    estado: op.estado ?? "CONFIRMADA",
    artistaId: "artista",
    avisoInstagramConversacionId: "hilo",
    solicitud: { id: "consulta", estudioId: "estudio", artistaDestinoId: null },
  };
  simular(t, prisma.cita, "findMany", async () => [cita]);
  simular(t, prisma.conversacionCanal, "findFirst", async () => ({
    id: "hilo",
    estudioId: "estudio",
    artistaId: null,
    cuentaId: "cuenta",
    ultimaEntradaAt: new Date(Date.now() - (op.fueraDeVentana ? 172800000 : 0)),
    flujoInstagram: { pausadoAt: op.pausado ? new Date() : null },
    estudio: { zonaHoraria: "UTC" },
  }));
  simular(t, prisma.conexionCanal, "findUnique", async () => ({
    activa: true,
    canal: "INSTAGRAM",
    estudioId: "estudio",
    artistaId: null,
    tokenCifrado: "ficticio",
    expiraAt: new Date(Date.now() + 86400000),
    loginUnificado: true,
  }));
  const confirmados: unknown[] = [];
  simular(t, prisma.cita, "updateMany", async (d: unknown) => {
    confirmados.push(d);
    return { count: 1 };
  });
  const avisos: unknown[] = [];
  const pausas: unknown[] = [];
  const tx = {
    $queryRaw: async () => [],
    estudio: { findUnique: async () => ({ propietarioId: "titular" }) },
    gestionConversacion: { upsert: async () => ({ id: "gestion" }) },
    eventoConversacion: { create: async () => ({}) },
    flujoInstagram: {
      upsert: async (d: unknown) => {
        pausas.push(d);
        return {};
      },
    },
    conversacionCanal: { update: async () => ({}) },
    mensajeCanal: { updateMany: async () => ({ count: 1 }) },
    avisoPanel: {
      createMany: async (d: unknown) => {
        avisos.push(d);
        return { count: 1 };
      },
    },
  };
  simular(
    t,
    prisma,
    "$transaction",
    async (fn: (db: typeof tx) => Promise<unknown>) => fn(tx),
  );
  return { cita, confirmados, avisos, pausas };
}
test("reprogramar usa una clave por versión y confirma únicamente esa versión", async (t) => {
  const f = preparar(t),
    envios: string[] = [];
  await notificarTurnosInstagram(async (_hilo, clave, texto) => {
    envios.push(clave);
    assert.match(texto, /actualizó/);
    return "ENVIADO";
  });
  assert.deepEqual(envios, ["bot:turno-manual:turno:3"]);
  assert.equal(f.avisos.length, 0);
  assert.deepEqual((f.confirmados[0] as { where: unknown }).where, {
    id: "turno",
    version: 3,
    avisoInstagramConversacionId: "hilo",
  });
});
test("cancelar informa la cancelación sin presentar el turno como confirmado", async (t) => {
  preparar(t, { estado: "CANCELADA" });
  let mensaje = "";
  await notificarTurnosInstagram(async (_h, _c, texto) => {
    mensaje = texto;
    return "ENVIADO";
  });
  assert.match(mensaje, /canceló/);
  assert.doesNotMatch(mensaje, /confirmado/);
});
for (const op of [{ pausado: true }, { fueraDeVentana: true }])
  test(
    "si no puede avisar, genera atención urgente y pausa el bot " +
      JSON.stringify(op),
    async (t) => {
      const f = preparar(t, op);
      let envios = 0;
      await notificarTurnosInstagram(async () => {
        envios++;
        return "ENVIADO";
      });
      assert.equal(envios, 0);
      assert.equal(f.avisos.length, 1);
      assert.equal(f.pausas.length, 1);
      assert.equal(f.confirmados.length, 1);
    },
  );
test("un envío incierto no se repite automáticamente y se deriva al equipo", async (t) => {
  const f = preparar(t);
  await notificarTurnosInstagram(async () => "INCIERTO");
  assert.equal(f.avisos.length, 1);
  assert.equal(f.confirmados.length, 1);
});
test("un envío en curso conserva el aviso para su comprobación posterior", async (t) => {
  const f = preparar(t);
  await notificarTurnosInstagram(async () => "ENVIANDO");
  assert.equal(f.avisos.length, 0);
  assert.equal(f.confirmados.length, 0);
});
