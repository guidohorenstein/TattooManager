export type ContextoRegistro = 'profesional' | 'general';
export interface AuthModalProps {
  show: boolean;
  onHide: () => void;
  onSwitch: () => void;
}
export interface RegisterModalProps extends AuthModalProps {
  contexto: ContextoRegistro;
}
export interface LoginValues {
  email: string;
  password: string;
}
export interface RegisterValues extends LoginValues {
  nombre: string;
  confirmPassword: string;
  rol: 'ARTISTA' | 'ESTUDIO_ADMIN';
  nombreArtistico: string;
  nombreEstudio: string;
}
export type PerfilRegistroGoogle =
  { rol: 'ARTISTA'; nombreArtistico: string } | { rol: 'ESTUDIO_ADMIN'; nombreEstudio: string };
