-- Publicar una página y su dirección requiere una decisión del titular.
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "paginaPublicada" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "publicarDireccion" BOOLEAN NOT NULL DEFAULT false;
