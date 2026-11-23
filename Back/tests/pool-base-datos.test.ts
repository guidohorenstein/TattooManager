import assert from "node:assert/strict";
import { test } from "node:test";
import { limitarPoolBaseDatos } from "../src/config/pool-base-datos.js";
const base = "postgresql://usuario:p%40ss%3Aword@pool.example.test:5432/base";
test("limita el pool por proceso y preserva las opciones y las credenciales codificadas", () => {
  const url = new URL(
    limitarPoolBaseDatos(
      base +
        "?sslmode=require&schema=public&pgbouncer=true&connection_limit=17",
    ),
  );
  assert.equal(url.searchParams.get("connection_limit"), "3");
  assert.equal(url.searchParams.get("pool_timeout"), "15");
  assert.equal(url.searchParams.get("sslmode"), "require");
  assert.equal(url.searchParams.get("schema"), "public");
  assert.equal(url.searchParams.get("pgbouncer"), "true");
  assert.equal(url.username, "usuario");
  assert.equal(url.password, "p%40ss%3Aword");
  assert.equal(url.port, "5432");
  assert.equal(url.pathname, "/base");
});
test("respeta un pool más pequeño y el tiempo de espera ya configurado", () => {
  const url = new URL(
    limitarPoolBaseDatos(base + "?connection_limit=1&pool_timeout=25"),
  );
  assert.equal(url.searchParams.get("connection_limit"), "1");
  assert.equal(url.searchParams.get("pool_timeout"), "25");
});
test("los valores ausentes o inválidos no permiten abrir un pool sin límite", () => {
  for (const valor of [
    "",
    "?connection_limit=0",
    "?connection_limit=-1",
    "?connection_limit=NaN",
    "?connection_limit=999999999999999999999",
  ])
    assert.equal(
      new URL(limitarPoolBaseDatos(base + valor)).searchParams.get(
        "connection_limit",
      ),
      "3",
    );
});
