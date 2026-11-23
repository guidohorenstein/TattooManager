import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
process.env.JWT_SECRET ??= "solo-pruebas-resumen-operativo-32-bytes";
const { prisma } = await import("../src/config/prisma.js");
const { procesarResumenes } =
  await import("../src/gestion-conversaciones/resumen.worker.js");
function simular(t: TestContext, objeto: object, k: string, impl: unknown) {
  const d = objeto as Record<string, unknown>,
    previo = d[k];
  d[k] = impl;
  t.after(() => {
    d[k] = previo;
  });
}
function preparar(t: TestContext) {
  const original = process.env.GROQ_API_KEY;
  process.env.GROQ_API_KEY = "clave-ficticia";
  t.after(() => {
    if (original === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = original;
  });
  const g = {
    id: "gestion",
    canal: "INSTAGRAM",
    conversacionId: "hilo-privado",
    estudioId: "estudio-privado",
    artistaId: null,
    atencion: "PENDIENTE",
    prioridad: "URGENTE",
    version: 4,
    resumen: null as null | Record<string, unknown>,
    resumenPendienteAt: new Date(),
    motivo: "persona@example.test",
  };
  const fecha = new Date("2026-11-23T12:00:00Z");
  let texto = "Quiero flores en blanco y negro",
    mensajeId = "mensaje-privado";
  let propietario = "estudio-privado",
    tomada = true;
  const cambios: Record<string, unknown>[] = [];
  simular(
    t,
    prisma.gestionConversacion,
    "findMany",
    async ({ where }: { where: { AND: unknown } }) => {
      assert.ok(where.AND);
      return [g];
    },
  );
  simular(
    t,
    prisma.gestionConversacion,
    "updateMany",
    async ({
      where,
      data,
    }: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => {
      if ("resumen" in data) {
        assert.equal(where.version, 4);
        cambios.push(data);
      }
      return { count: tomada ? 1 : 0 };
    },
  );
  simular(t, prisma.conversacionCanal, "findUnique", async () => ({
    id: "hilo-privado",
    estudioId: propietario,
    artistaId: null,
    solicitudId: "consulta-privada",
    nombre: "Nombre privado",
    texto: "Teléfono privado",
  }));
  simular(t, prisma.solicitud, "findFirst", async () => ({
    estado: "ASIGNADA",
    estilo: "estilo libre con datos privados",
    artistaAsignadoId: "artista-privado",
    cotizaciones: [{ id: "propuesta-privada", mensaje: "texto privado" }],
    citas: [],
  }));
  simular(t, prisma.mensajeCanal, "findFirst", async () => ({
    id: mensajeId,
    propio: false,
    fecha,
  }));
  simular(t, prisma.mensajeCanal, "findMany", async () => [
    { id: mensajeId, texto, propio: false, fecha, estado: "RECIBIDO" },
  ]);
  simular(t, prisma, "$transaction", async (fn: (db: unknown) => unknown) =>
    fn(prisma),
  );
  simular(t, prisma, "$queryRaw", async () => []);
  return {
    nuevoMensaje: () => {
      mensajeId = "mensaje-siguiente";
      texto = "Mejor en color";
    },
    cambios,
    g,
    otroPropietario: () => {
      propietario = "otro-estudio";
    },
    tomadoPorOtro: () => {
      tomada = false;
    },
  };
}
function respuesta() {
  return Response.json({
    choices: [
      {
        finish_reason: "stop",
        message: {
          content: JSON.stringify({
            preferencias: [{ texto: "Prefiere flores.", fuentes: ["m1"] }],
            preguntasPendientes: [],
            acuerdos: [],
          }),
        },
      },
    ],
  });
}
test("el trabajador envía solo texto minimizado y hechos cerrados, sin identidades ni metadatos", async (t) => {
  const f = preparar(t);
  let llamados = 0;
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    llamados++;
    const b = JSON.parse(String(init?.body));
    const h = JSON.parse(b.messages[1].content);
    assert.equal(h.hechos.estilo, null);
    assert.equal(Object.keys(h.hechos).length, 9);
    assert.equal(h.mensajes[0].texto, "Quiero flores en blanco y negro");
    assert.ok(!JSON.stringify(h).includes("privad"));
    assert.ok(!JSON.stringify(h).includes("@"));
    return respuesta();
  });
  await procesarResumenes();
  assert.equal(llamados, 1);
  assert.equal(f.cambios.length, 1);
  const r = f.cambios[0]?.resumen as {
    proximoPaso: string;
    conversacion: { preferencias: unknown[] };
  };
  assert.equal(
    r.proximoPaso,
    "El equipo debe revisar y resolver la atención pendiente.",
  );
  assert.equal(r.conversacion.preferencias.length, 1);
});
test("si la conversación cambió de propietario no consulta al proveedor", async (t) => {
  const f = preparar(t);
  f.otroPropietario();
  t.mock.method(globalThis, "fetch", async () => {
    throw Error("No debe consultar");
  });
  await procesarResumenes();
  assert.equal(f.cambios.length, 0);
});
test("un trabajo tomado por otro proceso no se vuelve a ejecutar", async (t) => {
  const f = preparar(t);
  f.tomadoPorOtro();
  let llamados = 0;
  t.mock.method(globalThis, "fetch", async () => {
    llamados++;
    throw Error();
  });
  await procesarResumenes();
  assert.equal(llamados, 0);
  assert.equal(f.cambios.length, 0);
});
test("si falla el proveedor guarda datos útiles y no bloquea la conversación", async (t) => {
  const f = preparar(t);
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("", { status: 429 }),
  );
  await procesarResumenes();
  assert.equal(f.cambios[0]?.errorResumen, true);
  assert.ok(f.cambios[0]?.resumenPendienteAt instanceof Date);
  assert.equal((f.cambios[0]?.resumen as { origen: string }).origen, "DATOS");
});

test("un mensaje nuevo cambia el resumen aunque no hayan cambiado los datos de la consulta", async (t) => {
  const f = preparar(t);
  let llamados = 0;
  t.mock.method(globalThis, "fetch", async () => {
    llamados++;
    return respuesta();
  });
  await procesarResumenes();
  f.g.resumen = f.cambios[0]?.resumen as Record<string, unknown>;
  await procesarResumenes();
  assert.equal(llamados, 1);
  f.nuevoMensaje();
  await procesarResumenes();
  assert.equal(llamados, 2);
});
test("conserva el resumen anterior al fallar y limita los reintentos automáticos", async (t) => {
  const f = preparar(t);
  t.mock.method(globalThis, "fetch", async () => respuesta());
  await procesarResumenes();
  const anterior = f.cambios[0]?.resumen as Record<string, unknown>;
  f.g.resumen = anterior;
  f.nuevoMensaje();
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("", { status: 429 }),
  );
  for (let i = 1; i <= 3; i++) {
    await procesarResumenes();
    const cambio = f.cambios.at(-1)!;
    f.g.resumen = cambio.resumen as Record<string, unknown>;
    assert.deepEqual(f.g.resumen.conversacion, anterior.conversacion);
    assert.equal(f.g.resumen.intentosConversacion, i);
    assert.equal(cambio.resumenPendienteAt === null, i === 3);
  }
});

test("no guarda el resumen si la conversación cambia de propietario mientras responde la IA", async (t) => {
  const f = preparar(t);
  t.mock.method(globalThis, "fetch", async () => {
    f.otroPropietario();
    return respuesta();
  });
  await procesarResumenes();
  assert.equal(f.cambios.length, 0);
});
test("la misma actualización y los límites de contexto se aplican a WhatsApp", async (t) => {
  const f = preparar(t);
  f.g.canal = "WHATSAPP";
  simular(
    t,
    prisma.conversacionWhatsApp,
    "findUnique",
    prisma.conversacionCanal.findUnique,
  );
  simular(
    t,
    prisma.mensajeWhatsApp,
    "findFirst",
    prisma.mensajeCanal.findFirst,
  );
  simular(
    t,
    prisma.mensajeWhatsApp,
    "findMany",
    async (args: { where: { conversacionId: string }; take: number }) => {
      assert.equal(args.where.conversacionId, "hilo-privado");
      assert.equal(args.take, 40);
      return [
        {
          id: "wa-local",
          texto: "Quiero flores",
          propio: false,
          estado: "RECIBIDO",
          fecha: new Date(),
        },
      ];
    },
  );
  t.mock.method(globalThis, "fetch", async () => respuesta());
  await procesarResumenes();
  assert.equal(f.cambios.length, 1);
  assert.equal(f.cambios[0]?.errorResumen, false);
});
test("una nueva consulta descarta la memoria de la consulta anterior", async (t) => {
  const f = preparar(t);
  f.g.resumen = {
    casoId: "otra-consulta",
    conversacion: {
      version: 1,
      huella: "anterior",
      preferencias: [
        {
          texto: "Deseaba una serpiente",
          evidencias: [
            {
              id: "otro-mensaje",
              texto: "Quiero una serpiente",
              propio: false,
              fecha: new Date().toISOString(),
            },
          ],
        },
      ],
      preguntasPendientes: [],
      acuerdos: [],
      omitidos: 0,
      recortado: false,
      hastaId: "otro-mensaje",
    },
  };
  t.mock.method(globalThis, "fetch", async (_u, i) => {
    const payload = JSON.parse(JSON.parse(String(i?.body)).messages[1].content);
    assert.deepEqual(payload.memoria, []);
    return respuesta();
  });
  await procesarResumenes();
  assert.equal(f.cambios[0]?.errorResumen, false);
});
