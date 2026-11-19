'use client';
import { useState } from 'react';
import Link from 'next/link';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import { Brand } from '@/components/brand/Brand';
import { AuthControls } from '@/components/auth/AuthControls';
import styles from './marketing.module.css';
export function ProductHeader() {
  const [abierto, setAbierto] = useState(false);
  return (
    <header className={styles.header}>
      <Navbar
        expand="lg"
        expanded={abierto}
        onToggle={setAbierto}
        data-bs-theme="dark"
        className={styles.navbar}
      >
        <Link href="/" className={styles.brand}>
          <Brand />
        </Link>
        <Navbar.Toggle aria-controls="product-nav" label="Abrir o cerrar menú" />
        <Navbar.Collapse id="product-nav">
          <Nav className="mx-auto" onSelect={() => setAbierto(false)}>
            <Nav.Link href="#producto">Producto</Nav.Link>
            <Nav.Link href="#recorrido">Cómo funciona</Nav.Link>
            <Nav.Link href="#tu-pagina">Tu página</Nav.Link>
            <Nav.Link href="#planes">Planes</Nav.Link>
          </Nav>
          <AuthControls light contextoRegistro="profesional" onOpen={() => setAbierto(false)} />
        </Navbar.Collapse>
      </Navbar>
    </header>
  );
}
