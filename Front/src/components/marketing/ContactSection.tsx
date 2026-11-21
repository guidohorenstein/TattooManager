'use client';
import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { sendContactMessage } from '@/app/contacto/actions';
import styles from './marketing.module.css';
type Errors = Partial<Record<'name' | 'email' | 'message', string>>;
export function ContactSection() {
  const form = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string }>();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const element = event.currentTarget;
    const data = new FormData(element);
    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();
    const next: Errors = {};
    if (name.length < 2 || name.length > 100)
      next.name = 'Ingresá un nombre de 2 a 100 caracteres.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
      next.email = 'Ingresá un email válido.';
    if (message.length < 10 || message.length > 5000)
      next.message = 'Escribí entre 10 y 5000 caracteres.';
    setErrors(next);
    setFeedback(undefined);
    if (Object.keys(next).length) {
      element
        .querySelector<HTMLInputElement | HTMLTextAreaElement>(
          '[name="' + Object.keys(next)[0] + '"]',
        )
        ?.focus();
      return;
    }
    setSending(true);
    try {
      const result = await sendContactMessage(name, email, message);
      setFeedback(result);
      if (result.success) {
        form.current?.reset();
        setErrors({});
      }
    } catch {
      setFeedback({
        success: false,
        message: 'No pudimos enviar tu consulta. Intentá nuevamente.',
      });
    } finally {
      setSending(false);
    }
  }
  return (
    <section id="contacto" className={styles.contactSection} data-reveal>
      <header>
        <p className={styles.eyebrow}>Hablemos de tu estudio</p>
        <h2>
          ¿Tenés algo
          <br />
          en mente?
        </h2>
        <p>Contanos cómo trabajás y qué necesitás resolver. Estamos del otro lado.</p>
      </header>
      <form ref={form} onSubmit={submit} noValidate className={styles.contactForm}>
        <fieldset disabled={sending}>
          <div className={styles.contactRow}>
            {(['name', 'email'] as const).map((key) => (
              <div className={styles.contactField} key={key}>
                <label htmlFor={'landing-' + key}>
                  {key === 'name' ? 'Tu nombre' : 'Tu email'}
                </label>
                <input
                  id={'landing-' + key}
                  name={key}
                  type={key === 'email' ? 'email' : 'text'}
                  autoComplete={key}
                  required
                  minLength={key === 'name' ? 2 : undefined}
                  maxLength={key === 'name' ? 100 : 254}
                  placeholder={key === 'name' ? 'Nombre y apellido' : 'vos@tuestudio.com'}
                  aria-invalid={Boolean(errors[key])}
                  aria-describedby={errors[key] ? key + '-error' : undefined}
                />
                {errors[key] && (
                  <p id={key + '-error'} className={styles.fieldError}>
                    {errors[key]}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className={styles.contactField}>
            <label htmlFor="landing-message">¿En qué podemos ayudarte?</label>
            <textarea
              id="landing-message"
              name="message"
              rows={5}
              required
              minLength={10}
              maxLength={5000}
              placeholder="Quiero organizar las consultas de mi estudio…"
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? 'message-error' : undefined}
            />
            {errors.message && (
              <p id="message-error" className={styles.fieldError}>
                {errors.message}
              </p>
            )}
          </div>
          <div className={styles.contactBottom}>
            <p>
              Usaremos tus datos para responder esta consulta.{' '}
              <Link href="/terminos-y-condiciones">Privacidad y condiciones</Link>.
            </p>
            <button className={styles.primary} type="submit" disabled={sending}>
              {sending ? 'Enviando…' : 'Enviar consulta'} <span aria-hidden="true">↗</span>
            </button>
          </div>
        </fieldset>
        {feedback && (
          <p
            className={feedback.success ? styles.contactSuccess : styles.fieldError}
            role={feedback.success ? 'status' : 'alert'}
          >
            {feedback.message}
          </p>
        )}
      </form>
    </section>
  );
}
