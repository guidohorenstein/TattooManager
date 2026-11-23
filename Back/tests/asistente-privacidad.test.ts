import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import {
  evaluarPrivacidad,
  minimizarTexto,
  avisoAsistenteVirtual,
} from "../src/asistente/privacidad.js";
import {
  prepararEntradaIa,
  type ContextoAsistente,
} from "../src/asistente/contexto-ia.js";
import { configuracionInicial } from "../src/asistente/configuracion.js";
import { generarRespuestaAsistente } from "../src/asistente/respuesta.js";
process.env.JWT_SECRET ??= "solo-pruebas-de-privacidad-del-chatbot-32-bytes";
const { prisma } = await import("../src/config/prisma.js");
const { procesarMensajeBot } =
  await import("../src/instagram/instagram-bot.service.js");
function usarClave(t: TestContext) {
  const anterior = process.env.GROQ_API_KEY;
  process.env.GROQ_API_KEY = "solo-pruebas";
  t.after(() => {
    if (anterior === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = anterior;
  });
}
function simular(t: TestContext, objeto: object, k: string, impl: unknown) {
  const d = objeto as Record<string, unknown>,
    anterior = d[k];
  d[k] = impl;
  t.after(() => {
    d[k] = anterior;
  });
}
const ejemplos = [
  ["Tengo diabetes y quiero tatuarme", "SALUD"],
  ["Soy alérgica a una tinta", "SALUD"],
  ["Estoy embarazada", "SALUD"],
  ["Estoy tomando anticoagulantes", "SALUD"],
  ["I am pregnant, can I get a tattoo?", "SALUD"],
  ["I have an allergy", "SALUD"],
  ["Quiero mandarte una foto íntima", "INTIMIDAD"],
  ["Tengo una referencia de un pezón", "INTIMIDAD"],
  ["Te paso mi DNI 32.456.789", "DOCUMENTOS"],
  ["My passport is AB1234567", "DOCUMENTOS"],
  ["Mi contraseña es una-clave-de-prueba", "CREDENCIALES"],
  ["El código de verificación es 123456", "CREDENCIALES"],
  ["Mi CBU es 1234567890123456789012", "PAGO_PRIVADO"],
  ["Tengo 16 años, quiero tatuarme", "MENORES"],
  ["Este mensaje contiene contenido multimedia.", "ADJUNTO"],
] as const;
for (const [mensaje, motivo] of ejemplos)
  test(
    "no se llama a Groq para contenido detectado como " +
      motivo +
      " · " +
      mensaje,
    async (t) => {
      usarClave(t);
      const proveedor = t.mock.method(globalThis, "fetch", async () => {
        throw Error("No debe enviar contenido delicado");
      });
      const r = await generarRespuestaAsistente(configuracionInicial, mensaje);
      assert.equal(r.accion, "DERIVAR");
      assert.equal(r.motivoDerivacion, motivo);
      assert.equal(proveedor.mock.callCount(), 0);
      assert.ok(!r.texto.includes(mensaje));
    },
  );
for (const mensaje of [
  "Quiero una flor en el antebrazo",
  "Me gustaría algo en la mano",
  "¿Cuánto cuesta y qué seña piden?",
  "¿Cuándo era mi turno?",
  "Quiero tatuarme el 2026-12-02 a las 14:30",
  "Un diseño de 15 cm, en blanco y negro",
  "Soy artista independiente y quiero consultar por el plan",
])
  test(
    "las consultas habituales conservan el flujo automático · " + mensaje,
    () => {
      assert.equal(evaluarPrivacidad(mensaje), null);
    },
  );
test("oculta contactos, nombres conocidos, identificadores y enlaces sin romper fechas, horas o importes", () => {
  const r = minimizarTexto(
    "Nicolás Pérez, nico@example.test, @nico_p y +54 (11) 5555-7788. Un diseño de 15 cm para el 2026-12-02 a las 14:30; presupuesto $150000. Ref https://ejemplo.test/foto?token=secreto y 123e4567-e89b-12d3-a456-426614174000",
    ["Nicolás Pérez"],
  );
  assert.doesNotMatch(
    r,
    /Nicolás|Pérez|nico@example|nico_p|5555|secreto|123e4567/,
  );
  assert.match(r, /2026-12-02/);
  assert.match(r, /14:30/);
  assert.match(r, /15 cm/);
  assert.match(r, /\$150000/);
});
test("las presentaciones y direcciones comunes se minimizan aunque no exista todavía un contacto", () => {
  const r = minimizarTexto(
    "Me llamo Guido Horenstein y quiero una flor. Vivo en Calle Privada 123. Mi teléfono es 1155559999.",
  );
  assert.doesNotMatch(r, /Guido|Horenstein|Calle Privada|1155559999/);
  assert.match(r, /flor/);
});
test("normaliza caracteres invisibles y nombres con acentos o signos de regex", () => {
  assert.equal(evaluarPrivacidad("Tengo dia\u200bbetes"), "SALUD");
  const r = minimizarTexto(
    "Álvaro D. quiere consultar, y ÁLVARO vuelve a escribir.",
    ["Álvaro D."],
  );
  assert.doesNotMatch(r, /Álvaro|ÁLVARO|D\./);
});
test("el contexto usa una lista explícita de campos y descarta notas, fotos, historial e identificadores", () => {
  const cita = {
    fecha: "2035-02-02",
    fechaFin: "2035-02-02",
    dia: "viernes",
    horaInicio: "14:00",
    horaFin: "15:30",
    duracionMinutos: 90,
    artista: "Camila Tinta",
    estado: "CONFIRMADA",
    nombreCliente: "PERSONA_SECRETA",
    email: "secreto@example.test",
    notas: "NOTA_PRIVADA",
    imagen: "https://privado.example/foto",
    id: "ID_PRIVADO",
  };
  const contexto = {
    zonaHoraria: "UTC",
    artistasActivos: [
      {
        nombre: "Camila Tinta",
        estilos: ["Fine Line"],
        email: "ARTISTA_PRIVADO",
      },
    ],
    turnos: {
      proximos: [cita],
      ultimoPasado: null,
      duracionEstimadaMinutos: 90,
    },
    identificadoresPrivados: ["Nicolás Pérez"],
    historial: ["HISTORIAL_PRIVADO"],
    token: "CREDENCIAL_PRIVADA",
  } as unknown as ContextoAsistente;
  const entrada = prepararEntradaIa(
    configuracionInicial,
    "Nicolás Pérez consulta por la duración",
    contexto,
  );
  const json = JSON.stringify(entrada);
  assert.doesNotMatch(
    json,
    /SECRETA|PRIVAD|secreto@|privado\.example|Nicolás|Pérez/,
  );
  assert.match(json, /Camila Tinta/);
  assert.equal(entrada.turnosDeEsteChat?.proximos[0]?.duracionMinutos, 90);
});
test("la configuración también excluye información delicada y minimiza contactos", () => {
  const entrada = prepararEntradaIa(
    {
      ...configuracionInicial,
      politicas: {
        senas:
          "La seña se coordina con el equipo. Contacto equipo@example.test",
        cancelaciones: "Avisá con 24 horas.",
      },
      preguntasFrecuentes: [
        {
          pregunta: "¿Puedo tatuarme si tengo diabetes?",
          respuesta: "Historia clínica privada",
        },
        {
          pregunta: "¿Atienden los sábados?",
          respuesta: "Sí, de 10:00 a 16:00.",
        },
      ],
    },
    "Hola",
  );
  assert.doesNotMatch(
    JSON.stringify(entrada),
    /equipo@example|diabetes|clínica/,
  );
  assert.equal(entrada.configuracion.preguntasFrecuentes.length, 1);
  assert.match(entrada.configuracion.politicas.cancelaciones, /24/);
});
test("el payload real del proveedor recibe el texto minimizado y la respuesta no repite contactos", async (t) => {
  usarClave(t);
  const llamada = t.mock.method(globalThis, "fetch", async (_u, op) => {
    const b = JSON.parse(String(op?.body));
    assert.doesNotMatch(
      b.messages[1].content,
      /NombreCanario|canario@example|1155557777/,
    );
    return Response.json({
      choices: [
        {
          finish_reason: "stop",
          message: {
            content: JSON.stringify({
              accion: "RESPONDER",
              texto: "Podés completar el formulario para pedir tu presupuesto.",
            }),
          },
        },
      ],
    });
  });
  const r = await generarRespuestaAsistente(
    configuracionInicial,
    "NombreCanario quiere tatuarse. canario@example.test +54 11 5555-7777",
    {
      zonaHoraria: "UTC",
      artistasActivos: [],
      identificadoresPrivados: ["NombreCanario"],
    },
  );
  assert.equal(r.accion, "RESPONDER");
  assert.equal(llamada.mock.callCount(), 1);
});
test("una respuesta del modelo que intenta dar una indicación médica se deriva sin mostrarla", async (t) => {
  usarClave(t);
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({
      choices: [
        {
          finish_reason: "stop",
          message: {
            content: JSON.stringify({
              accion: "RESPONDER",
              texto: "Tomá un antibiótico para tu tatuaje.",
            }),
          },
        },
      ],
    }),
  );
  const r = await generarRespuestaAsistente(
    configuracionInicial,
    "¿Cómo seguimos?",
  );
  assert.equal(r.accion, "DERIVAR");
  assert.doesNotMatch(r.texto, /antibiótico/);
});
function prepararChat(t: TestContext, yaPresentado = true) {
  const hilo = {
    id: "hilo",
    estudioId: "estudio",
    artistaId: null,
    canal: "INSTAGRAM",
    cuentaId: "cuenta",
    remitente: "remitente-privado",
    nombre: "PERSONA_PRIVADA",
    solicitudId: null,
    ultimaEntradaAt: new Date(),
    flujoInstagram: null as { pausadoAt: Date } | null,
    estudio: { slug: "estudio", propietarioId: "titular", zonaHoraria: "UTC" },
    mensajes: yaPresentado ? [{ id: "saludo" }] : [],
  };
  simular(t, prisma.mensajeCanal, "findUnique", async () => null);
  simular(t, prisma.conversacionCanal, "findUnique", async () => hilo);
  simular(t, prisma.conversacionCanal, "findFirst", async () => hilo);
  simular(t, prisma.usuario, "findMany", async () => []);
  simular(t, prisma.configuracionAsistente, "findUnique", async () => ({
    datos: configuracionInicial,
  }));
  const avisos: Record<string, unknown>[] = [];
  const atenciones: Record<string, unknown>[] = [];
  const tx = {
    $queryRaw: async () => [],
    conversacionCanal: {
      findUniqueOrThrow: async () => hilo,
      update: async () => ({}),
    },
    mensajeCanal: { updateMany: async () => ({ count: 1 }) },
    flujoInstagram: {
      findUnique: async () => hilo.flujoInstagram,
      upsert: async ({
        update,
        create,
      }: {
        update: { pausadoAt?: Date };
        create: { token: string };
      }) => {
        if (update.pausadoAt)
          hilo.flujoInstagram = { pausadoAt: update.pausadoAt };
        return { token: create.token };
      },
    },
    gestionConversacion: {
      upsert: async ({ create }: { create: Record<string, unknown> }) => {
        atenciones.push(create);
        return { id: "gestion" };
      },
    },
    eventoConversacion: { create: async () => ({}) },
    avisoPanel: {
      createMany: async ({ data }: { data: Record<string, unknown>[] }) => {
        avisos.push(...data);
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
  return { hilo, avisos, atenciones };
}
test("la privacidad tiene prioridad sobre los botones de agenda y pausa con aviso sin copiar el contenido", async (t) => {
  usarClave(t);
  const f = prepararChat(t);
  const proveedor = t.mock.method(globalThis, "fetch", async () => {
    throw Error("No debe consultar");
  });
  const mensajes: string[] = [];
  await procesarMensajeBot(
    "hilo",
    "titular",
    "entrada",
    "Tengo diabetes y me gustaría ese turno",
    async (_h, _k, texto) => {
      mensajes.push(texto);
      return "ENVIADO";
    },
    "confirmar-turno-no-debe-ejecutarse",
  );
  assert.equal(proveedor.mock.callCount(), 0);
  assert.ok(f.hilo.flujoInstagram?.pausadoAt);
  assert.equal(f.atenciones[0]?.atencion, "PENDIENTE");
  assert.equal(f.avisos[0]?.urgente, true);
  assert.doesNotMatch(JSON.stringify(f.avisos), /diabetes|PERSONA_PRIVADA/);
  assert.equal(mensajes.length, 1);
});
test("la evaluación de privacidad ocurre antes de truncar un lote largo de mensajes", async (t) => {
  prepararChat(t);
  const modelo = t.mock.method(globalThis, "fetch", async () => {
    throw Error("No debe consultar");
  });
  await procesarMensajeBot(
    "hilo",
    "titular",
    "lote",
    "Estoy embarazada. " + "Me interesa el diseño. ".repeat(200),
    async () => "ENVIADO",
  );
  assert.equal(modelo.mock.callCount(), 0);
});
test("el asistente se identifica una sola vez al comenzar un chat", async (t) => {
  usarClave(t);
  const f = prepararChat(t, false);
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({
      choices: [
        {
          finish_reason: "stop",
          message: {
            content: JSON.stringify({
              accion: "RESPONDER",
              texto: "Hola, ¿qué idea tenés para tu tatuaje?",
            }),
          },
        },
      ],
    }),
  );
  const mensajes: string[] = [];
  const enviar = async (_h: unknown, _k: string, texto: string) => {
    mensajes.push(texto);
    f.hilo.mensajes.push({ id: "primer-saludo" });
    return "ENVIADO" as const;
  };
  await procesarMensajeBot(
    "hilo",
    "titular",
    "uno",
    "Hola, buenas tardes",
    enviar,
  );
  await procesarMensajeBot(
    "hilo",
    "titular",
    "dos",
    "Me interesa un tatuaje de flores",
    enviar,
  );
  assert.equal(mensajes.length, 2);
  assert.ok(mensajes[0]?.startsWith(avisoAsistenteVirtual));
  assert.ok(!mensajes[1]?.includes(avisoAsistenteVirtual));
});

test("el año de un proyecto no se confunde con una zona íntima", () => {
  assert.equal(evaluarPrivacidad("Quiero tatuarme este año"), null);
  assert.equal(evaluarPrivacidad("Quiero tatuarme en el ano"), "INTIMIDAD");
});
for (const mensaje of [
  "Mi fecha de nacimiento es 1995-02-03",
  "My date of birth is 1995-02-03",
  "4111 1111 1111 1111",
])
  test(
    "los datos privados no pasan como fechas de agenda o importes · " + mensaje,
    async (t) => {
      usarClave(t);
      const modelo = t.mock.method(globalThis, "fetch", async () => {
        throw Error("No debe consultar");
      });
      const r = await generarRespuestaAsistente(configuracionInicial, mensaje);
      assert.equal(r.accion, "DERIVAR");
      assert.equal(modelo.mock.callCount(), 0);
    },
  );
