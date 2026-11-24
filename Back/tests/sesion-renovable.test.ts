import assert from "node:assert/strict";
import { test } from "node:test";
import { prisma } from "../src/config/prisma.js";
import { renovarSesion } from "../src/sesiones/sesiones.service.js";

const dia = 24 * 60 * 60 * 1000;
const ahora = Date.UTC(2026, 10, 23, 12);

function sesion(creadaHaceDias: number, venceEnDias: number) {
  return {
    id: "sesion-1",
    usuarioId: "usuario-1",
    createdAt: new Date(ahora - creadaHaceDias * dia),
    expiraAt: new Date(ahora + venceEnDias * dia),
  };
}

function simularExtension(
  t: import("node:test").TestContext,
  respuesta: (args: unknown) => { count: number },
) {
  const delegado = prisma.sesion as unknown as Record<string, unknown>;
  const original = delegado.updateMany;
  delegado.updateMany = async (args: unknown) => respuesta(args);
  t.after(() => {
    delegado.updateMany = original;
  });
}

function capturarExtensiones(t: import("node:test").TestContext) {
  const llamadas: unknown[] = [];
  simularExtension(t, (args) => {
    llamadas.push(args);
    return { count: 1 };
  });
  return llamadas;
}

test("no renueva si pasó menos de un día desde la última renovación", async (t) => {
  const llamadas = capturarExtensiones(t);
  assert.equal(await renovarSesion(sesion(0, 6.5), ahora), null);
  assert.equal(llamadas.length, 0);
});

test("renueva a siete días cuando la persona vuelve después de un día", async (t) => {
  const llamadas = capturarExtensiones(t);
  const nueva = await renovarSesion(sesion(2, 5), ahora);
  assert.equal(nueva?.getTime(), ahora + 7 * dia);
  assert.deepEqual(llamadas, [
    {
      where: { id: "sesion-1", usuarioId: "usuario-1", revocadaAt: null },
      data: { expiraAt: nueva },
    },
  ]);
});

test("nunca supera los treinta días desde el inicio de la sesión", async (t) => {
  capturarExtensiones(t);
  const nueva = await renovarSesion(sesion(27, 1), ahora);
  assert.equal(nueva?.getTime(), ahora + 3 * dia);
  assert.equal(await renovarSesion(sesion(30, 0.5), ahora), null);
});

test("no informa una renovación si la sesión fue revocada mientras tanto", async (t) => {
  simularExtension(t, () => ({ count: 0 }));
  assert.equal(await renovarSesion(sesion(2, 5), ahora), null);
});
