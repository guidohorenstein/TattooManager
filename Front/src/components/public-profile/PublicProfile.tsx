import Image from 'next/image';
import Link from 'next/link';
import type { PaginaPublica } from '@/types/pagina-publica';
import { PublicGallery } from './PublicGallery';
import styles from './public-profile.module.css';
const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export function PublicProfile({ pagina: p }: { pagina: PaginaPublica }) {
  const lugar = [p.direccion, p.ciudad].filter(Boolean).join(', ');
  return (
    <div className={styles.page}>
      <a href="#contenido" className="visually-hidden-focusable">
        Ir al contenido
      </a>
      <header className={styles.header}>
        <a href="#contenido" className={styles.identity}>
          {p.nombre}
        </a>
        <nav aria-label="Secciones del perfil">
          <a href="#trabajos">Trabajos</a>
          {p.tipo === 'ESTUDIO' && p.artistas.length > 0 && <a href="#artistas">Artistas</a>}
          <a href="#visita">Visitanos</a>
        </nav>
        <Link href={p.formulario} className={styles.button}>
          Pedir presupuesto <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <main id="contenido">
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>
              {p.tipo === 'ESTUDIO' ? 'Estudio de tatuajes' : 'Artista independiente'}
              {p.ciudad ? ' / ' + p.ciudad : ''}
            </p>
            <h1>{p.nombre}</h1>
            {p.biografia && <p className={styles.bio}>{p.biografia}</p>}
            <Link href={p.formulario} className={styles.button}>
              Contanos tu idea <span aria-hidden="true">↗</span>
            </Link>
            <p className={styles.note}>Un presupuesto pensado para tu próximo tatuaje.</p>
          </div>
          {p.portada ? (
            <div className={styles.heroImage}>
              <Image
                src={p.portada}
                alt={'Trabajo de ' + p.nombre}
                fill
                sizes="(max-width: 760px) 100vw, 50vw"
                loading="eager"
                fetchPriority="high"
              />
            </div>
          ) : (
            <div className={styles.typeCover} aria-hidden="true">
              <span>{p.nombre}</span>
              <span>TATTOO</span>
            </div>
          )}
        </section>
        <section id="trabajos" className={styles.section}>
          <header className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Portafolio</p>
            <h2>Tinta con identidad.</h2>
            <p>Conocé los trabajos y encontrá el estilo para tu idea.</p>
          </header>
          <PublicGallery trabajos={p.trabajos} formulario={p.formulario} />
        </section>
        {p.tipo === 'ESTUDIO' && p.artistas.length > 0 && (
          <section id="artistas" className={styles.section}>
            <header className={styles.sectionHeader}>
              <p className={styles.eyebrow}>El equipo</p>
              <h2>Quienes crean cada pieza.</h2>
            </header>
            <div className={styles.artists}>
              {p.artistas.map((a) => (
                <article key={a.id}>
                  {a.foto ? (
                    <Image
                      src={a.foto}
                      alt={a.nombre}
                      width={500}
                      height={560}
                      sizes="(max-width: 600px) 90vw, 30vw"
                    />
                  ) : (
                    <div className={styles.initial}>{a.nombre.slice(0, 1)}</div>
                  )}
                  <h3>{a.nombre}</h3>
                  {a.biografia && <p>{a.biografia}</p>}
                  <p className={styles.specialties}>{a.estilos.join(' / ')}</p>
                </article>
              ))}
            </div>
          </section>
        )}
        <section id="visita" className={styles.visit}>
          <div>
            <p className={styles.eyebrow}>Tu visita</p>
            <h2>Nos vemos en el estudio.</h2>
            {lugar ? (
              <>
                <p>{lugar}</p>
                <a
                  className={styles.textLink}
                  href={
                    'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(lugar)
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Cómo llegar ↗
                </a>
              </>
            ) : (
              <p>Consultanos la ubicación al coordinar tu tatuaje.</p>
            )}
          </div>
          <div>
            <h3>Horarios de atención</h3>
            {p.horarios.length ? (
              p.horarios.map((h, i) => (
                <div className={styles.hours} key={i}>
                  {p.tipo === 'ESTUDIO' && <h4>{h.artista}</h4>}
                  {h.semana
                    .filter((d) => d.rangos.length)
                    .sort((a, b) => ((a.dia + 6) % 7) - ((b.dia + 6) % 7))
                    .map((d) => (
                      <div key={d.dia}>
                        <span>{dias[d.dia]}</span>
                        <span>{d.rangos.map((r) => r.desde + ' a ' + r.hasta).join(' / ')}</span>
                      </div>
                    ))}
                </div>
              ))
            ) : (
              <p>Atención con turno previo.</p>
            )}
            <p className={styles.note}>Los turnos se coordinan después de conocer tu idea.</p>
          </div>
        </section>
        <section className={styles.final}>
          <p className={styles.eyebrow}>Tu próxima pieza</p>
          <h2>Todo empieza con una idea.</h2>
          <Link href={p.formulario} className={styles.button}>
            Solicitar presupuesto <span aria-hidden="true">↗</span>
          </Link>
        </section>
      </main>
      <footer className={styles.footer}>
        <span>{p.nombre}</span>
        <Link href="/">Hecho con TattooManager ↗</Link>
      </footer>
    </div>
  );
}
