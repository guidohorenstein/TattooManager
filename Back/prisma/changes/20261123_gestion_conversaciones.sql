BEGIN;
CREATE TABLE IF NOT EXISTS "GestionConversacion" (
 "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "canal" TEXT NOT NULL CHECK ("canal" IN ('INSTAGRAM','WHATSAPP','FACEBOOK','TIKTOK')),
 "conversacionId" TEXT NOT NULL,
 "estudioId" TEXT REFERENCES "Estudio"("id") ON DELETE CASCADE,
 "artistaId" TEXT REFERENCES "Usuario"("id") ON DELETE CASCADE,
 "atencion" TEXT NOT NULL DEFAULT 'AUTOMATICA' CHECK ("atencion" IN ('AUTOMATICA','PENDIENTE','MANUAL','RESUELTA')),
 "prioridad" TEXT NOT NULL DEFAULT 'NORMAL' CHECK ("prioridad" IN ('NORMAL','URGENTE')),
 "motivo" TEXT NOT NULL DEFAULT '',
 "responsableId" TEXT REFERENCES "Usuario"("id") ON DELETE SET NULL,
 "resueltaAt" TIMESTAMPTZ(3), "version" INTEGER NOT NULL DEFAULT 0,
 "resumen" JSONB, "ultimoMensajeResumenId" TEXT, "resumenActualizadoAt" TIMESTAMPTZ(3),
 "resumenPendienteAt" TIMESTAMPTZ(3), "intentoResumenAt" TIMESTAMPTZ(3), "leaseResumenHasta" TIMESTAMPTZ(3),
 "errorResumen" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "GestionConversacion_dueno" CHECK (("estudioId" IS NOT NULL)::int + ("artistaId" IS NOT NULL)::int = 1)
);
CREATE UNIQUE INDEX IF NOT EXISTS "GestionConversacion_canal_conversacionId_key" ON "GestionConversacion"("canal","conversacionId");
CREATE INDEX IF NOT EXISTS "GestionConversacion_estudioId_atencion_prioridad_idx" ON "GestionConversacion"("estudioId","atencion","prioridad");
CREATE INDEX IF NOT EXISTS "GestionConversacion_artistaId_atencion_idx" ON "GestionConversacion"("artistaId","atencion");
CREATE INDEX IF NOT EXISTS "GestionConversacion_resumenPendienteAt_idx" ON "GestionConversacion"("resumenPendienteAt");
CREATE TABLE IF NOT EXISTS "EventoConversacion" (
 "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, "gestionId" TEXT NOT NULL REFERENCES "GestionConversacion"("id") ON DELETE CASCADE,
 "actorId" TEXT, "accion" TEXT NOT NULL, "detalle" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "EventoConversacion_gestionId_createdAt_idx" ON "EventoConversacion"("gestionId","createdAt");
ALTER TABLE "GestionConversacion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventoConversacion" ENABLE ROW LEVEL SECURITY;
COMMIT;
