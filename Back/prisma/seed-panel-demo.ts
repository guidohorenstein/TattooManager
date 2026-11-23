import "dotenv/config";
import { PrismaClient, type Prisma } from "@prisma/client";
import { DateTime } from "luxon";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "node:crypto";
import fs from "node:fs/promises";
import { autorizarSeed, destinoSeed } from "./seed-seguridad.js";
import { crearRecordatorios } from "../../Front/src/mocks/recordatorios.js";

if (process.argv.includes("--describe")) {
  console.log(JSON.stringify(destinoSeed(process.env.DATABASE_URL!)));
} else {
  autorizarSeed();
  const p = new PrismaClient();
  const id = (n: number) =>
    "d3232026-1123-4000-8000-" + String(n).padStart(12, "0");
  const estudioId = id(100),
    hoy = DateTime.now()
      .setZone("America/Argentina/Buenos_Aires")
      .startOf("day");
  const carpeta = new URL("../../docs-local/accesos-demo/", import.meta.url);
  const archivo = new URL("cuentas.json", carpeta);
  const definiciones = [
    {
      n: 1,
      nombre: "Valentina",
      alias: "Trazo Estudio",
      email: "demo.trazo@tattoomanager.example.test",
      rol: "ESTUDIO_ADMIN" as const,
      estilos: [],
      independiente: false,
    },
    {
      n: 2,
      nombre: "Lucía",
      alias: "Lucía Torres",
      email: "demo.lucia@tattoomanager.example.test",
      rol: "ARTISTA" as const,
      estilos: ["Fine Line", "Botánico", "Ornamental"],
      independiente: false,
    },
    {
      n: 3,
      nombre: "Nicolás",
      alias: "Nicolás Vera",
      email: "demo.nicolas@tattoomanager.example.test",
      rol: "ARTISTA" as const,
      estilos: ["Blackwork", "Geométrico"],
      independiente: false,
    },
    {
      n: 4,
      nombre: "Camila",
      alias: "Camila Acosta",
      email: "demo.camila@tattoomanager.example.test",
      rol: "ARTISTA" as const,
      estilos: ["Tradicional", "Full Color", "Japonés"],
      independiente: false,
    },
    {
      n: 5,
      nombre: "Mateo",
      alias: "Mateo Ríos",
      email: "demo.mateo@tattoomanager.example.test",
      rol: "ARTISTA" as const,
      estilos: ["Realismo", "Microrealismo"],
      independiente: false,
    },
    {
      n: 6,
      nombre: "Inés",
      alias: "Inés Romero",
      email: "demo.ines@tattoomanager.example.test",
      rol: "ARTISTA" as const,
      estilos: ["Ornamental", "Fine Line", "Botánico"],
      independiente: true,
    },
  ];
  const imagen = (path: string) =>
    "https://res.cloudinary.com/kvudcxty/image/upload/c_limit,w_1200,f_auto,q_auto/tattoomanager/formulario/cotizacion/estilos/" +
    path;
  const fotos = [
    ["Fine Line", "negro-y-gris/fineLine"],
    ["Ornamental", "negro-y-gris/ornamental"],
    ["Blackwork", "negro-y-gris/blackwork"],
    ["Realismo", "negro-y-gris/realism"],
    ["Tradicional", "color/traditional"],
    ["Japonés", "color/japanese"],
  ];
  try {
    await fs.mkdir(carpeta, { recursive: true });
    let accesos: {
      id: string;
      email: string;
      nombre: string;
      rol: string;
      password: string;
    }[];
    try {
      accesos = JSON.parse(await fs.readFile(archivo, "utf8"));
    } catch {
      accesos = definiciones.map((a) => ({
        id: id(a.n),
        nombre: a.alias,
        email: a.email,
        rol: a.rol,
        password: "Tattoo!" + randomBytes(18).toString("base64url") + "9a",
      }));
      await fs.writeFile(archivo, JSON.stringify(accesos, null, 2), {
        flag: "wx",
        mode: 0o600,
      });
    }
    const hashes = await Promise.all(
      definiciones.map((a) => {
        const acceso = accesos.find(
          (c) => c.id === id(a.n) && c.email === a.email,
        );
        if (!acceso)
          throw Error(
            "El archivo privado de accesos no coincide con las identidades.",
          );
        return bcrypt.hash(acceso.password, 12);
      }),
    );
    const imagenes = await Promise.all(
      fotos.map(async ([, path]) => {
        const url = imagen(path!);
        const r = await fetch(url, {
          method: "HEAD",
          signal: AbortSignal.timeout(20000),
        });
        if (!r.ok)
          throw Error("Falta una imagen de Cloudinary para el portafolio.");
        return url;
      }),
    );
    const nombres = [
      "Sofía Aguirre",
      "Lucas Benítez",
      "Martina Costa",
      "Julieta Paz",
      "Agustín Ferrer",
      "Clara Molina",
      "Valentín Silva",
      "Alma Pereyra",
      "Franco Ortiz",
      "Lucía Méndez",
      "Joaquín Gil",
      "Paula Acuña",
      "Bruno Sosa",
      "Abril Herrera",
      "Tomás Castro",
      "Renata Vidal",
      "Emilia Cabrera",
      "Facundo Rojas",
      "Delfina Ruiz",
      "Santiago Cruz",
    ];
    const titulos = [
      "Rama de olivo en el antebrazo",
      "Composición ornamental en espalda",
      "Geometría en pantorrilla",
      "Flores silvestres en el hombro",
      "Golondrina tradicional",
      "Koi japonés a color",
      "Paisaje en línea fina",
      "Mandala para el antebrazo",
      "Retrato en realismo",
      "Serpiente y flores",
    ];
    const contactos: Prisma.ContactoCreateManyInput[] = Array.from(
      { length: 28 },
      (_, n) => ({
        id: id(1000 + n),
        nombre: nombres[n % 20]!,
        email: "contacto." + (n + 1) + "@clientes.example.test",
        telefono: "+54 9 11 5500 " + String(1000 + n),
        ciudad: "Buenos Aires",
        notas:
          n % 4 === 0
            ? "Prefiere coordinar por la tarde. Confirmar el diseño antes de la sesión."
            : "",
        estudioId: n < 20 ? estudioId : null,
        artistaId: n < 20 ? null : id(6),
        createdAt: hoy.minus({ days: 45 - n }).toJSDate(),
      }),
    );
    const solicitudes: Prisma.SolicitudCreateManyInput[] = [],
      cotizaciones: Prisma.CotizacionCreateManyInput[] = [],
      citas: Prisma.CitaCreateManyInput[] = [],
      avisos: Prisma.AvisoPanelCreateManyInput[] = [],
      conversaciones: Prisma.ConversacionCanalCreateManyInput[] = [],
      mensajes: Prisma.MensajeCanalCreateManyInput[] = [];
    for (let n = 0; n < 48; n++) {
      const independiente = n >= 36,
        local = independiente ? n - 36 : n,
        asignada = local < (independiente ? 8 : 24),
        artistaId = independiente ? id(6) : id(2 + (n % 3)),
        contactoId = id(1000 + (independiente ? 20 + (local % 8) : local % 20)),
        solicitudId = id(2000 + n),
        cotizacionId = id(3000 + n * 3),
        foto = imagenes[n % imagenes.length]!,
        creada = hoy.minus({ days: asignada ? 36 - local : 3 }).toJSDate();
      const estado = asignada
        ? "ASIGNADA"
        : local % 6 === 0
          ? "PENDIENTE"
          : local % 6 === 1
            ? "EN_COTIZACION"
            : local % 6 === 2
              ? "ELECCION_CLIENTE"
              : local % 6 === 3
                ? "POR_ASIGNAR"
                : local % 6 === 4
                  ? "PENDIENTE"
                  : "ARCHIVADA";
      const canal = (
        [
          "INSTAGRAM",
          "WHATSAPP",
          "WEB",
          "INSTAGRAM",
          "WEB",
          "FACEBOOK",
        ] as const
      )[n % 6]!;
      solicitudes.push({
        id: solicitudId,
        contactoId,
        estudioId: independiente ? null : estudioId,
        artistaDestinoId: independiente ? artistaId : null,
        artistaAsignadoId: asignada ? artistaId : null,
        titulo: titulos[n % titulos.length]!,
        estilo: fotos[n % fotos.length]![0]!,
        tipoColor: n % 6 >= 4 ? "COLOR" : "BLACK_AND_GREY",
        generoCuerpo: n % 2 ? "FEMENINO" : "MASCULINO",
        zonaGeneral: n % 3 === 0 ? "PIERNA" : n % 3 === 1 ? "TORSO" : "BRAZO",
        subZona:
          n % 3 === 0 ? "Pantorrilla" : n % 3 === 1 ? "Espalda" : "Antebrazo",
        descripcion:
          "Busco un diseño personalizado de " +
          titulos[n % titulos.length]!.toLowerCase() +
          ". Me gustaría que acompañe la forma del cuerpo, con buen contraste y una composición equilibrada.",
        referencias: [foto],
        canal,
        estado,
        cerradaAt:
          asignada || estado === "ELECCION_CLIENTE" || estado === "POR_ASIGNAR"
            ? creada
            : null,
        cierrePropuestasAt:
          estado === "PENDIENTE" || estado === "EN_COTIZACION"
            ? hoy.plus({ days: 2 }).toJSDate()
            : null,
        asignadaPor: asignada ? (independiente ? "ARTISTA" : "CLIENTE") : null,
        presupuestoMinimo: 100000,
        presupuestoMaximo: 250000,
        createdAt: creada,
      });
      if (
        asignada ||
        estado === "EN_COTIZACION" ||
        estado === "ELECCION_CLIENTE"
      ) {
        cotizaciones.push({
          id: cotizacionId,
          solicitudId,
          artistaId,
          monto: 120000 + (n % 5) * 25000,
          montoSena: 20000,
          duracionMinutos: 120,
          mensaje:
            "Diseño personalizado, revisión del boceto y sesión de dos horas. Incluye cuidados posteriores y control de cicatrización.",
          bocetoUrl: foto,
          validaHasta: hoy.plus({ days: 14 }).toJSDate(),
          createdAt: creada,
        });
        if (!asignada && !independiente)
          cotizaciones.push({
            id: id(3000 + n * 3 + 1),
            solicitudId,
            artistaId: id(2 + ((n + 1) % 3)),
            monto: 155000,
            duracionMinutos: 150,
            montoSena: 25000,
            mensaje:
              "Una propuesta alternativa con más detalle y una sesión de hasta dos horas y media.",
            bocetoUrl: imagenes[(n + 1) % imagenes.length]!,
            createdAt: creada,
          });
      }
      if (asignada) {
        const completada = local < (independiente ? 5 : 18),
          cancelada = !completada && local === (independiente ? 5 : 18),
          dia = completada ? -2 - local : local - (independiente ? 6 : 20),
          inicio = hoy.plus({ days: dia, hours: 11 });
        const estadoCita = completada
          ? "COMPLETADA"
          : cancelada
            ? "CANCELADA"
            : local % 2
              ? "PENDIENTE"
              : "CONFIRMADA";
        const cita = (
          extra: number,
          ini: DateTime,
          estado: typeof estadoCita,
        ) => ({
          id: id(5000 + n * 3 + extra),
          solicitudId,
          artistaId,
          cotizacionId,
          creadaPorId: independiente ? artistaId : id(1),
          titulo:
            titulos[n % titulos.length]! + (extra ? " · segunda sesión" : ""),
          inicioAt: ini.toJSDate(),
          finAt: ini.plus({ hours: 2 }).toJSDate(),
          importe: 120000 + (n % 5) * 25000,
          sena: extra ? 0 : 20000,
          estado,
          completadaAt:
            estado === "COMPLETADA" ? ini.plus({ hours: 2 }).toJSDate() : null,
          canceladaAt:
            estado === "CANCELADA" ? hoy.minus({ days: 1 }).toJSDate() : null,
          notas: extra
            ? "Continuación del diseño. Revisar la cicatrización de la sesión anterior."
            : "Boceto aprobado. Preparar el diseño antes de la llegada.",
          recordatorios: {},
          claveCreacion: id(5000 + n * 3 + extra),
          huellaCreacion: createHash("sha256")
            .update(id(5000 + n * 3 + extra))
            .digest("hex"),
          createdAt: creada,
        });
        citas.push(cita(0, inicio, estadoCita));
        if (!completada && !cancelada && local % 2 === 0)
          citas.push(cita(1, inicio.plus({ days: 7 }), "CONFIRMADA"));
        if (local < 3)
          citas.push(
            cita(
              2,
              hoy.minus({ days: 35 + local }).set({ hour: 15 }),
              "COMPLETADA",
            ),
          );
      }
      if ((n < 10 && n % 2 === 0) || (independiente && local < 2)) {
        const cid = id(7000 + n),
          contacto = contactos.find((c) => c.id === contactoId)!,
          fecha = hoy.set({ hour: 9, minute: n % 30 });
        conversaciones.push({
          id: cid,
          canal: "INSTAGRAM",
          cuentaId: independiente
            ? "demo-ines-sin-conexion"
            : "demo-trazo-sin-conexion",
          remitente: "demo-contacto-" + n,
          nombre: contacto.nombre,
          estudioId: independiente ? null : estudioId,
          artistaId: independiente ? artistaId : null,
          solicitudId,
          ultimaEntradaAt: fecha.toJSDate(),
          ultimaActividad: fecha.plus({ minutes: 3 }).toJSDate(),
        });
        const texto = [
          "Hola, me gustaría consultar por un tatuaje.",
          "¡Hola! Contanos qué tenés en mente y completá nuestro formulario.",
          "Ya lo envié. La idea es " +
            titulos[n % titulos.length]!.toLowerCase() +
            ".",
          "Recibimos tu consulta. El equipo está preparando las propuestas para que elijas tu diseño.",
        ];
        texto.forEach((t, k) =>
          mensajes.push({
            id: id(8000 + n * 10 + k),
            conversacionId: cid,
            proveedorId: "demo-panel-" + n + "-" + k,
            texto: t,
            propio: k % 2 === 1,
            estado: k % 2 === 1 ? "ENVIADO" : "RECIBIDO",
            fecha: fecha.plus({ minutes: k }).toJSDate(),
            leidoAt: k < 2 ? fecha.toJSDate() : null,
            botPendiente: false,
          }),
        );
      }
    }
    const preferencias = crearRecordatorios();
    preferencias.clientesHabilitados = false;
    preferencias.artistaHabilitado = false;
    await p.$transaction(
      async (tx) => {
        for (const a of definiciones) {
          const existentes = await tx.usuario.findMany({
            where: { OR: [{ id: id(a.n) }, { email: a.email }] },
            select: { id: true, email: true, rol: true },
          });
          if (
            existentes.some(
              (u) => u.id !== id(a.n) || u.email !== a.email || u.rol !== a.rol,
            )
          )
            throw Error(
              "Identidad demo en conflicto. No se modificaron cuentas ajenas.",
            );
        }
        await tx.estudio.createMany({
          data: [
            {
              id: estudioId,
              nombre: "Trazo Estudio",
              slug: "trazo-demo",
              biografia:
                "Un espacio dedicado al tatuaje personalizado en Buenos Aires. Cuatro artistas, estilos diversos y atención con turno previo.",
              emailContacto: "demo.trazo@tattoomanager.example.test",
              ciudad: "Buenos Aires",
              ciudadId: 704,
              pais: "AR",
              direccion: "Av. del Taller 1450",
              zonaHoraria: "America/Argentina/Buenos_Aires",
              plazoPropuestasHoras: 48,
            },
          ],
          skipDuplicates: true,
        });
        await tx.usuario.createMany({
          data: definiciones.map((a, i) => ({
            id: id(a.n),
            email: a.email,
            password: hashes[i]!,
            nombre: a.nombre,
            nombreArtistico: a.rol === "ARTISTA" ? a.alias : null,
            rol: a.rol,
            estudioId: a.independiente ? null : estudioId,
            estadoEnEstudio:
              a.n === 5 ? ("SUSPENDIDO" as const) : ("ACTIVO" as const),
            emailVerificado: true,
            estilosPrincipales: a.estilos,
            metodosPagoAceptados: ["TRANSFERENCIA", "EFECTIVO"],
            fotoPerfil:
              a.rol === "ARTISTA" ? imagenes[(i - 1) % imagenes.length]! : null,
            biografia:
              a.rol === "ARTISTA"
                ? "Tatuajes personalizados, atención con turno previo y acompañamiento durante todo el proceso. Diseños que respetan la anatomía y el estilo de cada persona."
                : null,
            ciudad: "Buenos Aires",
            ciudadId: 704,
            pais: "AR",
            paginaPublicada: a.rol === "ESTUDIO_ADMIN" || a.independiente,
            planSuscripcionActivo:
              a.rol === "ESTUDIO_ADMIN"
                ? ("ESTUDIO" as const)
                : a.independiente
                  ? ("INDIVIDUAL" as const)
                  : null,
            createdAt: hoy.minus({ days: 50 - i }).toJSDate(),
          })),
          skipDuplicates: true,
        });
        await tx.estudio.updateMany({
          where: { id: estudioId, propietarioId: null },
          data: { propietarioId: id(1) },
        });
        await tx.suscripcion.createMany({
          data: [1, 6].map((n) => ({
            id: id(500 + n),
            usuarioId: id(n),
            plan: n === 1 ? ("ESTUDIO" as const) : ("INDIVIDUAL" as const),
            ciclo: "ANUAL" as const,
            estado: "ACTIVA" as const,
            monto: 0,
            bonificada: true,
            referenciaExterna: "demo-panel-20261123-" + n,
            periodoHasta: hoy.plus({ days: 365 }).toJSDate(),
          })),
          skipDuplicates: true,
        });
        await tx.preferenciasCorreo.createMany({
          data: definiciones.map((a) => ({
            usuarioId: id(a.n),
            reglas: preferencias as unknown as Prisma.InputJsonValue,
          })),
          skipDuplicates: true,
        });
        await tx.fotoGaleria.createMany({
          data: definiciones
            .filter((a) => a.rol === "ARTISTA")
            .flatMap((a, i) =>
              Array.from({ length: 4 }, (_, j) => ({
                id: id(4000 + i * 10 + j),
                usuarioId: id(a.n),
                url: imagenes[(i + j) % imagenes.length]!,
                estilos: [fotos[(i + j) % fotos.length]![0]!],
                descripcion: [
                  "Composición que acompaña la forma natural del cuerpo.",
                  "Diseño personalizado con detalle y contraste.",
                  "Pieza realizada en una sesión.",
                  "Nuevo boceto en proceso.",
                ][j]!,
                estado:
                  j === 3 ? ("BORRADOR" as const) : ("PUBLICADO" as const),
                createdAt: hoy.minus({ days: 25 - i * 3 - j }).toJSDate(),
              })),
            ),
          skipDuplicates: true,
        });
        await tx.contacto.createMany({ data: contactos, skipDuplicates: true });
        await tx.solicitud.createMany({
          data: solicitudes,
          skipDuplicates: true,
        });
        await tx.cotizacion.createMany({
          data: cotizaciones,
          skipDuplicates: true,
        });
        await tx.cita.createMany({ data: citas, skipDuplicates: true });
        const semana = Array.from({ length: 7 }, (_, i) => ({
          dia: i + 1,
          rangos: i === 6 ? [] : [{ desde: "10:00", hasta: "19:00" }],
        }));
        await tx.disponibilidadArtista.createMany({
          data: definiciones
            .filter((a) => a.rol === "ARTISTA")
            .map((a) => ({
              id: id(6000 + a.n),
              artistaId: id(a.n),
              estudioId: a.independiente ? null : estudioId,
              ambito: a.independiente ? "INDEPENDIENTE" : estudioId,
              semana,
            })),
          skipDuplicates: true,
        });
        await tx.bloqueoAgenda.createMany({
          data: [
            {
              id: id(6500),
              disponibilidadId: id(6002),
              creadaPorId: id(1),
              motivo: "Preparación de diseños",
              inicioAt: hoy.plus({ days: 2, hours: 16 }).toJSDate(),
              finAt: hoy.plus({ days: 2, hours: 18 }).toJSDate(),
            },
          ],
          skipDuplicates: true,
        });
        await tx.conversacionCanal.createMany({
          data: conversaciones,
          skipDuplicates: true,
        });
        await tx.mensajeCanal.createMany({
          data: mensajes,
          skipDuplicates: true,
        });
        for (const n of [1, 2, 3, 4, 6])
          avisos.push(
            ...[
              "Nueva consulta recibida",
              "Una propuesta está lista para revisar",
              "Un cliente necesita confirmar su turno",
            ].map((titulo, i) => ({
              id: id(9000 + n * 10 + i),
              usuarioId: id(n),
              clave: "demo-panel-" + n + "-" + i,
              titulo,
              detalle: [
                "Rama de olivo en el antebrazo · Sofía Aguirre",
                "Revisá el presupuesto y el boceto del proyecto.",
                "La consulta está asignada y tiene un turno próximo.",
              ][i]!,
              destino:
                (n === 1 ? "/estudio" : "/artista") +
                (i === 2 ? "/agenda" : "/consultas"),
              urgente: false,
              createdAt: hoy.plus({ hours: 8, minutes: i * 15 }).toJSDate(),
            })),
          );
        await tx.avisoPanel.createMany({ data: avisos, skipDuplicates: true });
      },
      { timeout: 120000, maxWait: 15000 },
    );
    const lineas = accesos
      .map((a) => "| " + a.nombre + " | " + a.email + " | " + a.password + " |")
      .join("\n");
    await fs.writeFile(
      new URL("accesos.md", carpeta),
      "# Cuenta para recorrer TattooManager\n\nEntrá en http://127.0.0.1:3002 e iniciá sesión con email y contraseña.\n\nEl titular de Trazo Estudio abre /estudio. Los artistas abren /artista. Mateo está suspendido a propósito para mostrar ese estado. Inés es independiente y tiene su propio plan.\n\n| Cuenta | Email | Contraseña |\n| --- | --- | --- |\n" +
        lineas +
        "\n\nIncluye 28 contactos, 48 consultas, presupuestos con fotos, turnos pasados y próximos, trabajos publicados y borradores, horarios y conversaciones de ejemplo.\n\nLos datos son ficticios y están guardados en la base de datos. Los correos terminan en example.test. No se enviaron emails ni mensajes. Los historiales de Instagram se pueden leer pero no enviar: no se conectaron cuentas reales. Los recordatorios generales empiezan desactivados para evitar envíos automáticos. Los planes de estudio e independiente están bonificados por 365 días.\n\nPágina del estudio: /e/trazo-demo\n",
    );
    console.log(
      JSON.stringify({
        cuentas: accesos.length,
        contactos: contactos.length,
        consultas: solicitudes.length,
        presupuestos: cotizaciones.length,
        turnos: citas.length,
        conversaciones: conversaciones.length,
        archivo: "docs-local/accesos-demo/accesos.md",
      }),
    );
  } finally {
    await p.$disconnect();
  }
}
