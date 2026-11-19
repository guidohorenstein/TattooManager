'use client';
import { useState } from 'react';
import Link from 'next/link';
import { CotizacionForm } from '@/components/forms/CotizacionForm';
import { MarcoCotizacion } from '@/app/cotizacion/components/MarcoCotizacion';
export default function FormularioEjemplo() {
  const [enviado, setEnviado] = useState(false);
  return (
    <MarcoCotizacion destinatario="Trazo Estudio (ejemplo)" volver="/ejemplo/estudio">
      <p style={{ fontSize: 13, color: '#666' }}>
        Este formulario es una demostración. No envía consultas ni guarda tus datos.
      </p>
      {enviado ? (
        <div role="status">
          <h2>Así termina tu consulta.</h2>
          <p>En la página de tu estudio, este envío llegaría directamente a tu panel.</p>
          <Link href="/ejemplo/estudio">Volver al estudio de ejemplo</Link>
        </div>
      ) : (
        <CotizacionForm onSubmit={async () => setEnviado(true)} />
      )}
    </MarcoCotizacion>
  );
}
