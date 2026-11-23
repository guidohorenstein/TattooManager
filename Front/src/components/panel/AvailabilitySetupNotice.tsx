'use client';
import Link from 'next/link';
import { useAuth } from '@/store/AuthProvider';
import { useConsultas } from '@/hooks/useConsultas';
import { PanelIcon } from './PanelUI';
import styles from './availability.module.css';

export function AvailabilitySetupNotice() {
  const { datos } = useConsultas();
  const { usuario } = useAuth();
  const estudio = usuario?.rol === 'ESTUDIO_ADMIN';
  const pendientes =
    datos?.equipo.filter(
      (a) =>
        a.estado === 'ACTIVO' &&
        (estudio || a.id === usuario?.id) &&
        (a.estadoAgenda === 'SIN_CONFIGURAR' || a.estadoAgenda === 'CERRADA'),
    ) || [];
  if (!pendientes.length) return null;
  const primero = pendientes[0]!;
  return (
    <aside className={styles.setupNotice} aria-label="Configuración de agenda pendiente">
      <span className={styles.noticeIcon}>
        <PanelIcon nombre="reloj" size={19} />
      </span>
      <div>
        <strong>
          {estudio
            ? pendientes.length === 1
              ? primero.nombre + ' necesita configurar su agenda'
              : pendientes.length + ' artistas necesitan configurar su agenda'
            : 'Completá tus horarios de atención'}
        </strong>
        <p>
          {estudio
            ? 'Cargá los días y horarios para que puedan recibir reservas.'
            : 'Definí al menos un horario para que los clientes puedan reservar.'}
        </p>
      </div>
      <Link
        href={estudio ? '/estudio/disponibilidad?artista=' + primero.id : '/artista/disponibilidad'}
      >
        Configurar horarios <PanelIcon nombre="flecha" size={16} />
      </Link>
    </aside>
  );
}
