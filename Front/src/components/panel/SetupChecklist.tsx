'use client';
import Link from 'next/link';
import { PanelIcon } from './PanelUI';
import css from './conversation-context.module.css';
export function SetupChecklist({
  items,
}: {
  items: { titulo: string; listo: boolean; href: string }[];
}) {
  const pendientes = items.filter((i) => !i.listo);
  if (!pendientes.length) return null;
  return (
    <details className={css.preparacion}>
      <summary>
        <PanelIcon nombre="ajustes" size={17} />
        <strong>Prepará tu espacio de trabajo</strong>
        <span>
          {items.length - pendientes.length} de {items.length} completos
        </span>
      </summary>
      <ul>
        {items.map((i) => (
          <li key={i.titulo}>
            <span className={i.listo ? css.positivo : css.pendiente}>
              <PanelIcon nombre={i.listo ? 'check' : 'reloj'} size={14} />
              {i.listo ? 'Completo' : 'Pendiente'}
            </span>
            <Link href={i.href}>{i.titulo}</Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
