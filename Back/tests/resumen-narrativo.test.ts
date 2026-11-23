import assert from "node:assert/strict";
import { test } from "node:test";
import {
  prepararDialogo,
  generarResumenNarrativo,
  resumenConversacionVacio,
  leerResumenConversacion,
  type MensajeParaResumen,
} from "../src/gestion-conversaciones/resumen-narrativo.js";
import type { HechosOperativos } from "../src/gestion-conversaciones/resumen-operativo.js";
const hechos: HechosOperativos = {
  etapa: "CONSULTA",
  atencion: "AUTOMATICA",
  prioridad: "NORMAL",
  estilo: null,
  tieneConsulta: true,
  tieneArtista: false,
  tienePropuestas: false,
  propuestaElegida: false,
  tieneTurnoProximo: false,
};
function mensaje(
  texto: string,
  propio = false,
  id = "id-local",
): MensajeParaResumen {
  return {
    id,
    texto,
    propio,
    fecha: new Date("2026-11-23T12:00:00Z"),
    estado: propio ? "ENVIADO" : "RECIBIDO",
  };
}
function respuesta(valor: unknown) {
  return Response.json({
    choices: [
      { finish_reason: "stop", message: { content: JSON.stringify(valor) } },
    ],
  });
}
const vacio = { preferencias: [], preguntasPendientes: [], acuerdos: [] };
function clave(t: { after: (fn: () => void) => void }) {
  const anterior = process.env.GROQ_API_KEY;
  process.env.GROQ_API_KEY = "clave-ficticia";
  t.after(() => {
    if (anterior === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = anterior;
  });
}
test("el diálogo sale minimizado, sin identificadores locales ni mensajes sensibles", async (t) => {
  clave(t);
  const d = prepararDialogo(
    [
      mensaje(
        "Soy Martina Pérez, quiero flores. Mi correo es martina@example.test y mi número 1155667788",
      ),
      mensaje("Tengo alergia a la tinta", false, "salud"),
      mensaje("[imagen]", false, "foto"),
      mensaje("Me gusta Fine Line", false, "preferencia"),
      {
        ...mensaje("Oferta que no se envió", true, "fallido"),
        estado: "ERROR",
      },
    ],
    ["Martina Pérez"],
    null,
    "preferencia",
  );
  assert.equal(d.omitidos, 2);
  assert.equal(d.entrada.mensajes.length, 2);
  const transporte: typeof fetch = async (_url, init) => {
    const b = JSON.parse(String(init?.body));
    const payload = b.messages[1].content;
    for (const privado of [
      "Martina",
      "Pérez",
      "martina@example",
      "1155667788",
      "id-local",
      "salud",
      "foto",
      "fallido",
    ])
      assert.ok(!payload.includes(privado), privado);
    assert.equal(init?.redirect, "error");
    return respuesta({
      ...vacio,
      preferencias: [{ texto: "Prefiere Fine Line.", fuentes: ["m1"] }],
    });
  };
  const r = await generarResumenNarrativo(hechos, d, [], transporte);
  assert.equal(r.preferencias[0]?.evidencias[0]?.id, "preferencia");
});
test("sin textos aptos no consulta al proveedor", async () => {
  const d = prepararDialogo(
    [mensaje("Tengo una alergia")],
    [],
    null,
    "id-local",
  );
  const r = await generarResumenNarrativo(hechos, d, [], async () => {
    throw Error("No llamar");
  });
  assert.deepEqual(r.preferencias, []);
});
test("una corrección reemplaza preferencias y una respuesta cierra la duda sin perder memoria anterior", async (t) => {
  clave(t);
  const anterior = resumenConversacionVacio(
    prepararDialogo([], [], null, "viejo"),
  );
  anterior.preferencias = [
    {
      texto: "Prefiere color.",
      evidencias: [
        {
          id: "viejo",
          texto: "Me gustaría a color",
          propio: false,
          fecha: "2026-11-22T12:00:00Z",
        },
      ],
    },
  ];
  anterior.preguntasPendientes = [
    {
      texto: "Pregunta cuánto dura.",
      evidencias: [
        {
          id: "duda",
          texto: "Cuánto dura?",
          propio: false,
          fecha: "2026-11-22T12:01:00Z",
        },
      ],
    },
  ];
  const d = prepararDialogo(
    [
      mensaje("Mejor blanco y negro", false, "correccion"),
      mensaje("La duración estimada es de dos horas", true, "respuesta"),
    ],
    [],
    anterior,
    "respuesta",
  );
  const r = await generarResumenNarrativo(hechos, d, [], async (_u, i) => {
    const b = JSON.parse(JSON.parse(String(i?.body)).messages[1].content);
    assert.equal(b.memoria.length, 2);
    assert.equal(b.mensajes[0].texto, "Mejor blanco y negro");
    return respuesta({
      ...vacio,
      preferencias: [
        { texto: "Ahora prefiere blanco y negro.", fuentes: ["m2"] },
      ],
    });
  });
  assert.equal(r.preferencias.length, 1);
  assert.ok(r.preferencias[0]?.texto.includes("blanco y negro"));
  assert.equal(r.preguntasPendientes.length, 0);
});
test("rechaza fuentes inventadas y esquemas de acciones", async (t) => {
  clave(t);
  const d = prepararDialogo([mensaje("Quiero flores")], [], null, "id-local");
  for (const valor of [
    { ...vacio, preferencias: [{ texto: "Flores", fuentes: ["inventada"] }] },
    { ...vacio, accion: "CREAR_TURNO" },
  ])
    await assert.rejects(
      generarResumenNarrativo(hechos, d, [], async () => respuesta(valor)),
    );
});
test("no toma sugerencias del equipo como preferencias ni acuerdos de una sola parte", async (t) => {
  clave(t);
  const d = prepararDialogo(
    [mensaje("Te propongo realismo", true)],
    [],
    null,
    "id-local",
  );
  const r = await generarResumenNarrativo(hechos, d, [], async () =>
    respuesta({
      preferencias: [{ texto: "Prefiere realismo", fuentes: ["m1"] }],
      preguntasPendientes: [],
      acuerdos: [{ texto: "Acordaron realismo", fuentes: ["m1"] }],
    }),
  );
  assert.equal(r.preferencias.length, 0);
  assert.equal(r.acuerdos.length, 0);
});
test("conserva respaldo de ambas partes para los acuerdos", async (t) => {
  clave(t);
  const d = prepararDialogo(
    [
      mensaje("Prefiero el viernes", false, "cliente"),
      mensaje("Podemos evaluar el viernes", true, "equipo"),
    ],
    [],
    null,
    "equipo",
  );
  const r = await generarResumenNarrativo(hechos, d, [], async () =>
    respuesta({
      ...vacio,
      acuerdos: [
        { texto: "Conversaron sobre el viernes.", fuentes: ["m1", "m2"] },
      ],
    }),
  );
  assert.equal(r.acuerdos[0]?.evidencias.length, 2);
  assert.ok(r.acuerdos[0]?.evidencias.some((e) => !e.propio));
});
test("filtra texto sensible y datos personales también en la salida del modelo", async (t) => {
  clave(t);
  const d = prepararDialogo([mensaje("Quiero flores")], [], null, "id-local");
  const r = await generarResumenNarrativo(hechos, d, ["Martina"], async () =>
    respuesta({
      ...vacio,
      preferencias: [
        { texto: "Martina quiere flores", fuentes: ["m1"] },
        { texto: "Tiene una alergia", fuentes: ["m1"] },
      ],
    }),
  );
  assert.equal(r.preferencias.length, 0);
});
test("limita el contexto y descarta memoria no válida", () => {
  assert.equal(
    leerResumenConversacion({
      version: 1,
      huella: "x",
      preferencias: [{ texto: "x", evidencias: "mal" }],
      preguntasPendientes: [],
      acuerdos: [],
    }),
    null,
  );
  const d = prepararDialogo(
    Array.from({ length: 40 }, (_, i) =>
      mensaje("Flores ".repeat(80), false, String(i)),
    ),
    [],
    null,
    "39",
  );
  assert.ok(d.entrada.mensajes.reduce((n, m) => n + m.texto.length, 0) <= 9000);
  assert.equal(d.recortado, true);
});
