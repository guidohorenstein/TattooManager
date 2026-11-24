import assert from "node:assert/strict";
import { test } from "node:test";
import type { Request, Response } from "express";
import { requerirHumano } from "../src/middlewares/turnstile.js";
import { HttpError } from "../src/errors/http-error.js";

function ejecutar(
  middleware: ReturnType<typeof requerirHumano>,
  token?: string,
): Promise<unknown> {
  const req = {
    get: (nombre: string) => (nombre === "X-Turnstile-Token" ? token : undefined),
    ip: "203.0.113.9",
  } as unknown as Request;
  const res = { locals: {} } as unknown as Response;
  return new Promise((resolve) => {
    void middleware(req, res, (error?: unknown) => resolve(error));
  });
}

function conSecreto(t: import("node:test").TestContext, valor: string | undefined) {
  const anterior = process.env.TURNSTILE_SECRET_KEY;
  if (valor === undefined) delete process.env.TURNSTILE_SECRET_KEY;
  else process.env.TURNSTILE_SECRET_KEY = valor;
  t.after(() => {
    if (anterior === undefined) delete process.env.TURNSTILE_SECRET_KEY;
    else process.env.TURNSTILE_SECRET_KEY = anterior;
  });
}

test("sin clave secreta no exige verificación", async (t) => {
  conSecreto(t, undefined);
  let consultas = 0;
  const error = await ejecutar(
    requerirHumano(async () => {
      consultas++;
      return { success: false };
    }),
  );
  assert.equal(error, undefined);
  assert.equal(consultas, 0);
});

test("rechaza el envío sin token", async (t) => {
  conSecreto(t, "secreto");
  const error = await ejecutar(requerirHumano(async () => ({ success: true })));
  assert.ok(error instanceof HttpError);
  assert.equal(error.status, 403);
});

test("acepta un token válido y envía secreto, token e IP a Cloudflare", async (t) => {
  conSecreto(t, "secreto");
  let enviado: URLSearchParams | undefined;
  const error = await ejecutar(
    requerirHumano(async (cuerpo) => {
      enviado = cuerpo;
      return { success: true };
    }),
    "token-valido",
  );
  assert.equal(error, undefined);
  assert.equal(enviado?.get("secret"), "secreto");
  assert.equal(enviado?.get("response"), "token-valido");
  assert.equal(enviado?.get("remoteip"), "203.0.113.9");
});

test("rechaza un token que Cloudflare no valida", async (t) => {
  conSecreto(t, "secreto");
  const error = await ejecutar(
    requerirHumano(async () => ({ success: false })),
    "token-usado",
  );
  assert.ok(error instanceof HttpError);
  assert.equal(error.status, 403);
});

test("si Cloudflare no responde, no deja pasar el envío", async (t) => {
  conSecreto(t, "secreto");
  const error = await ejecutar(
    requerirHumano(async () => {
      throw new Error("timeout");
    }),
    "token",
  );
  assert.ok(error instanceof HttpError);
  assert.equal(error.status, 503);
});
