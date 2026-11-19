-- Restricciones e índices de las migraciones históricas para una instalación desde schema.prisma.
BEGIN; SET LOCAL lock_timeout='5s'; SET LOCAL search_path=public,extensions; CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='"Contacto"'::regclass AND conname='Contacto_ambito_check') THEN ALTER TABLE "Contacto" ADD CONSTRAINT "Contacto_ambito_check" CHECK (num_nonnulls("estudioId","artistaId") = 1); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='"DisponibilidadArtista"'::regclass AND conname='Disponibilidad_ambito_check') THEN ALTER TABLE "DisponibilidadArtista" ADD CONSTRAINT "Disponibilidad_ambito_check" CHECK ("ambito"=COALESCE("estudioId",'INDEPENDIENTE')); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='"DisponibilidadArtista"'::regclass AND conname='Disponibilidad_semana_check') THEN ALTER TABLE "DisponibilidadArtista" ADD CONSTRAINT "Disponibilidad_semana_check" CHECK ("semana" IS NULL OR jsonb_typeof("semana")='array'); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='"DisponibilidadArtista"'::regclass AND conname='Disponibilidad_version_check') THEN ALTER TABLE "DisponibilidadArtista" ADD CONSTRAINT "Disponibilidad_version_check" CHECK ("version">=0); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='"BloqueoAgenda"'::regclass AND conname='BloqueoAgenda_duracion_check') THEN ALTER TABLE "BloqueoAgenda" ADD CONSTRAINT "BloqueoAgenda_duracion_check" CHECK ("finAt">"inicioAt"); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='"InvitacionEquipo"'::regclass AND conname='InvitacionEquipo_email_check') THEN ALTER TABLE "InvitacionEquipo" ADD CONSTRAINT "InvitacionEquipo_email_check" CHECK ("email"=lower(trim("email")) AND length("email") BETWEEN 3 AND 254); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='"InvitacionEquipo"'::regclass AND conname='InvitacionEquipo_aceptacion_check') THEN ALTER TABLE "InvitacionEquipo" ADD CONSTRAINT "InvitacionEquipo_aceptacion_check" CHECK (("estado"='ACEPTADA')=("aceptadaPorId" IS NOT NULL)); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='"Cita"'::regclass AND conname='Cita_duracion_check') THEN ALTER TABLE "Cita" ADD CONSTRAINT "Cita_duracion_check" CHECK ("finAt">="inicioAt"+interval '30 minutes' AND "finAt"<="inicioAt"+interval '8 hours'); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='"Cita"'::regclass AND conname='Cita_importes_check') THEN ALTER TABLE "Cita" ADD CONSTRAINT "Cita_importes_check" CHECK ("importe">=0 AND "importe"<=100000000 AND "sena">=0 AND "sena"<="importe"); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='"Cita"'::regclass AND conname='Cita_recordatorios_check') THEN ALTER TABLE "Cita" ADD CONSTRAINT "Cita_recordatorios_check" CHECK (jsonb_typeof("recordatorios")='object'); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='"ConexionCanal"'::regclass AND conname='ConexionCanal_negocio_check') THEN ALTER TABLE "ConexionCanal" ADD CONSTRAINT "ConexionCanal_negocio_check" CHECK (num_nonnulls("estudioId", "artistaId") = 1); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='"ConversacionCanal"'::regclass AND conname='ConversacionCanal_negocio_check') THEN ALTER TABLE "ConversacionCanal" ADD CONSTRAINT "ConversacionCanal_negocio_check" CHECK (num_nonnulls("estudioId", "artistaId") = 1); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='"ConfiguracionAsistente"'::regclass AND conname='ConfiguracionAsistente_ambito') THEN ALTER TABLE "ConfiguracionAsistente" ADD CONSTRAINT "ConfiguracionAsistente_ambito" CHECK (num_nonnulls("estudioId", "artistaId") = 1); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='"BloqueoAgenda"'::regclass AND conname='BloqueoAgenda_motivo_check') THEN ALTER TABLE "BloqueoAgenda" ADD CONSTRAINT "BloqueoAgenda_motivo_check" CHECK (length(trim("motivo")) BETWEEN 1 AND 120); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='"ConversacionWhatsApp"'::regclass AND conname='ConversacionWhatsApp_un_negocio') THEN ALTER TABLE "ConversacionWhatsApp" ADD CONSTRAINT "ConversacionWhatsApp_un_negocio" CHECK (("estudioId" IS NULL) <> ("artistaId" IS NULL)); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='"Cotizacion"'::regclass AND conname='Cotizacion_duracion_check') THEN ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_duracion_check" CHECK ("duracionMinutos" BETWEEN 30 AND 480); END IF; END $$;

SET LOCAL lock_timeout = '5s';
CREATE UNIQUE INDEX IF NOT EXISTS "Contacto_id_estudioId_key" ON "Contacto"("id","estudioId");
CREATE UNIQUE INDEX IF NOT EXISTS "Contacto_id_artistaId_key" ON "Contacto"("id","artistaId");
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='Solicitud_contacto_estudio_fkey') THEN
    ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_contacto_estudio_fkey"
      FOREIGN KEY ("contactoId","estudioId") REFERENCES "Contacto"("id","estudioId") ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='Solicitud_contacto_artista_fkey') THEN
    ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_contacto_artista_fkey"
      FOREIGN KEY ("contactoId","artistaDestinoId") REFERENCES "Contacto"("id","artistaId") ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='Solicitud_ambito_check') THEN
    ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_ambito_check" CHECK (num_nonnulls("estudioId","artistaDestinoId")=1);
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='Solicitud_cliente_check') THEN
    ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_cliente_check" CHECK (num_nonnulls("clienteId","contactoId")>=1);
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='Cotizacion_importes_check') THEN
    ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_importes_check" CHECK ("monto">0 AND "montoSena">=0 AND "montoSena"<="monto");
  END IF;
END $$;


CREATE UNIQUE INDEX IF NOT EXISTS "Suscripcion_usuarioId_activa_pendiente_key"
  ON "Suscripcion"("usuarioId")
  WHERE "estado" IN ('PENDIENTE', 'ACTIVA');

CREATE UNIQUE INDEX IF NOT EXISTS "InvitacionEquipo_pendiente_unica" ON "InvitacionEquipo"("estudioId","email") WHERE "estado"='PENDIENTE';

CREATE INDEX IF NOT EXISTS "ConversacionCanal_botResponderAt_idx"
  ON "ConversacionCanal" ("botResponderAt") WHERE "botResponderAt" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "MensajeCanal_botPendiente_idx"
  ON "MensajeCanal" ("conversacionId", "fecha") WHERE "botPendiente";

CREATE INDEX IF NOT EXISTS "Cita_avisoInstagram_pendiente_idx" ON "Cita" ("createdAt")
  WHERE "avisoInstagramConversacionId" IS NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='BloqueoAgenda_sin_cruces') THEN
    ALTER TABLE "BloqueoAgenda" ADD CONSTRAINT "BloqueoAgenda_sin_cruces" EXCLUDE USING gist (
      "disponibilidadId" WITH =,tstzrange("inicioAt","finAt",'[)') WITH &&
    ) WHERE ("canceladoAt" IS NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='Cita_sin_cruces') THEN
    ALTER TABLE "Cita" ADD CONSTRAINT "Cita_sin_cruces" EXCLUDE USING gist (
      "artistaId" WITH =,tstzrange("inicioAt","finAt",'[)') WITH &&
    ) WHERE ("estado"<>'CANCELADA');
  END IF;
END $$;

ALTER TABLE "Suscripcion"
  ADD COLUMN IF NOT EXISTS "bonificada" boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid = '"Suscripcion"'::regclass AND conname = 'Suscripcion_bonificada_sin_cobro_check') THEN
    ALTER TABLE "Suscripcion" ADD CONSTRAINT "Suscripcion_bonificada_sin_cobro_check"
      CHECK (NOT "bonificada" OR (
        "monto" = 0 AND "mercadoPagoId" IS NULL AND "mpPaymentId" IS NULL
        AND "proximoCobroAt" IS NULL
      ));
  END IF;
END $$;



DO $$ DECLARE item record; BEGIN FOR item IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',item.tablename); END LOOP; END $$; COMMIT;
