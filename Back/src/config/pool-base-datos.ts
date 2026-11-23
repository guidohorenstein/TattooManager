const maximoConexiones = 3;

export function limitarPoolBaseDatos(cadena: string): string {
  const url = new URL(cadena);
  const valor = url.searchParams.get("connection_limit");
  const configurado = valor && /^\d+$/.test(valor) ? Number(valor) : NaN;
  const limite =
    Number.isSafeInteger(configurado) && configurado > 0
      ? Math.min(configurado, maximoConexiones)
      : maximoConexiones;
  url.searchParams.set("connection_limit", String(limite));
  if (!url.searchParams.has("pool_timeout"))
    url.searchParams.set("pool_timeout", "15");
  return url.toString();
}
