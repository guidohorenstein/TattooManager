'use client';
import { Slide, ToastContainer } from 'react-toastify';

export function ActionNotifications() {
  return (
    <ToastContainer
      position="bottom-right"
      limit={3}
      autoClose={3500}
      hideProgressBar
      newestOnTop
      pauseOnHover
      pauseOnFocusLoss
      closeOnClick={false}
      draggable
      transition={Slide}
      role="status"
      aria-label="Avisos de la aplicación. Alt + T para enfocar."
    />
  );
}
