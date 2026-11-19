import assert from "node:assert/strict";
import { test, after, type TestContext } from "node:test";
import { randomUUID } from "node:crypto";
process.env.DATABASE_URL = "postgresql://test:test@127.0.0.1:5432/test";
const { prisma } = await import("../src/config/prisma.js");
const { obtenerPaginaArtista, obtenerPaginaEstudio } =
  await import("../src/paginas-publicas/paginas-publicas.service.js");
const { validarMensaje } = await import("../src/contacto/contacto.service.js");
function sustituir(
  t: TestContext,
  target: object,
  key: string,
  impl: (...args: unknown[]) => unknown,
) {
  const record = target as Record<string, unknown>;
  const original = record[key];
  const mock = t.mock.fn(impl);
  record[key] = mock;
  t.after(() => {
    record[key] = original;
  });
  return mock;
}
const artista = {
  id: randomUUID(),
  nombreArtistico: "Lucía",
  biografia: "Líneas finas",
  fotoPerfil: null,
  estilosPrincipales: ["Fine Line"],
  ciudad: "Córdoba",
  ciudadId: null,
  direccion: null,
  zonaHoraria: "America/Argentina/Buenos_Aires",
  fotoTrabajando: null,
  email: "privado@example.test",
  password: "no-exponer",
  googleId: "privado",
  galeria: [
    {
      id: randomUUID(),
      url: "https://example.test/tatuaje.jpg",
      descripcion: "Pieza",
      estilos: ["Fine Line"],
      createdAt: new Date(),
    },
  ],
  disponibilidades: [{ artistaId: "", semana: null }],
};
after(async () => {
  await prisma.$disconnect();
});
test("página de estudio: filtra por slug, plan vigente e integrantes activos y no expone datos de acceso", async (t) => {
  let consulta: unknown;
  sustituir(t, prisma.estudio, "findFirst", async (q: unknown) => {
    consulta = q;
    return {
      nombre: "Estudio Norte",
      slug: "norte",
      biografia: null,
      ciudad: null,
      ciudadId: null,
      direccion: null,
      zonaHoraria: "UTC",
      usuarios: [artista],
      disponibilidades: [],
      email: "privado@example.test",
    };
  });
  const pagina = await obtenerPaginaEstudio("norte");
  assert.equal(pagina.formulario, "/cotizacion/norte");
  assert.equal(pagina.artistas[0].id, artista.id);
  assert.equal(pagina.trabajos[0].artistaId, artista.id);
  assert.equal(JSON.stringify(pagina).includes("privado"), false);
  const q = consulta as {
    where: { slug: string; propietario: { suscripciones: unknown } };
    select: {
      usuarios: { where: { estadoEnEstudio: string; suspendidoAt: null } };
    };
  };
  assert.equal(q.where.slug, "norte");
  assert.ok(q.where.propietario.suscripciones);
  assert.equal(q.select.usuarios.where.estadoEnEstudio, "ACTIVO");
  assert.equal(q.select.usuarios.where.suspendidoAt, null);
});
test("página de artista: solo artistas independientes con plan y sin datos privados", async (t) => {
  let consulta: unknown;
  sustituir(t, prisma.usuario, "findFirst", async (q: unknown) => {
    consulta = q;
    return artista;
  });
  const pagina = await obtenerPaginaArtista(artista.id);
  assert.equal(pagina.formulario, "/cotizacion/artista/" + artista.id);
  assert.deepEqual(pagina.horarios, []);
  assert.equal("email" in pagina.artistas[0], false);
  const q = consulta as {
    where: { id: string; estudioId: null; suscripciones: unknown };
  };
  assert.equal(q.where.id, artista.id);
  assert.equal(q.where.estudioId, null);
  assert.ok(q.where.suscripciones);
});
test("página inexistente o sin plan devuelve 404", async (t) => {
  sustituir(t, prisma.usuario, "findFirst", async () => null);
  sustituir(t, prisma.estudio, "findFirst", async () => null);
  await assert.rejects(obtenerPaginaArtista(artista.id), { status: 404 });
  await assert.rejects(obtenerPaginaEstudio("sin-plan"), { status: 404 });
});
test("identificadores inválidos se rechazan antes de consultar la base", async (t) => {
  const consulta = sustituir(t, prisma.usuario, "findFirst", async () => {
    throw Error("No debería consultar");
  });
  await assert.rejects(obtenerPaginaArtista("../estudio"), { status: 404 });
  assert.equal(consulta.mock.callCount(), 0);
});
test("contacto comercial: valida tamaño y email antes de enviar", () => {
  assert.deepEqual(
    validarMensaje({
      nombre: " Ana ",
      email: "ana@example.test",
      mensaje: "Quiero conocer el plan Estudio.",
    }),
    {
      nombre: "Ana",
      email: "ana@example.test",
      mensaje: "Quiero conocer el plan Estudio.",
    },
  );
  for (const entrada of [
    null,
    {},
    { nombre: "Ana", email: "invalido", mensaje: "Una consulta" },
    { nombre: "Ana", email: "a@b.test", mensaje: "x".repeat(5001) },
  ])
    assert.throws(() => validarMensaje(entrada), { status: 400 });
});
