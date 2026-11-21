export type DemoStage = 'nueva' | 'propuesta' | 'aceptada' | 'agendada';
export type DemoLead = {
  id: string;
  name: string;
  initials: string;
  style: string;
  idea: string;
  area: string;
  artist: string;
  price: number;
  stage: DemoStage;
  slot: string | null;
};
export type DemoMessage = { id: number; from: 'cliente' | 'estudio'; text: string };
export type DemoState = {
  leads: DemoLead[];
  messages: Record<string, DemoMessage[]>;
  reminders: Record<string, boolean>;
  published: boolean[];
  feedback: string;
};
export const artists = ['Lucía Torres', 'Nicolás Vera'];
export const slots = [
  { id: 'vie-11', day: 'Viernes 27 nov.', time: '11:00', short: 'Vie 27 · 11:00' },
  { id: 'vie-15', day: 'Viernes 27 nov.', time: '15:00', short: 'Vie 27 · 15:00' },
  { id: 'sab-11', day: 'Sábado 28 nov.', time: '11:00', short: 'Sáb 28 · 11:00' },
  { id: 'sab-15', day: 'Sábado 28 nov.', time: '15:00', short: 'Sáb 28 · 15:00' },
];
export const workImages = [
  'https://res.cloudinary.com/kvudcxty/image/upload/c_fill,w_650,h_700,f_auto,q_auto/tattoomanager/formulario/cotizacion/estilos/negro-y-gris/ornamental',
  'https://res.cloudinary.com/kvudcxty/image/upload/c_fill,w_650,h_700,f_auto,q_auto/tattoomanager/formulario/cotizacion/estilos/negro-y-gris/blackwork',
  'https://res.cloudinary.com/kvudcxty/image/upload/c_fill,w_650,h_700,f_auto,q_auto/tattoomanager/formulario/cotizacion/estilos/negro-y-gris/fineLine',
];
export function initialDemo(): DemoState {
  return {
    leads: [
      {
        id: 'sofia',
        name: 'Sofía Martínez',
        initials: 'SM',
        style: 'Ornamental',
        idea: 'Quiero una composición ornamental de flores que acompañe la forma del antebrazo, en negro y gris.',
        area: 'Antebrazo · Negro y gris',
        artist: 'Lucía Torres',
        price: 85000,
        stage: 'nueva',
        slot: null,
      },
      {
        id: 'mateo',
        name: 'Mateo Ríos',
        initials: 'MR',
        style: 'Blackwork',
        idea: 'Una pieza de blackwork en la pantorrilla, con líneas definidas y mucho contraste.',
        area: 'Pierna · Negro y gris',
        artist: 'Nicolás Vera',
        price: 120000,
        stage: 'propuesta',
        slot: null,
      },
      {
        id: 'valentina',
        name: 'Valentina Costa',
        initials: 'VC',
        style: 'Fine Line',
        idea: 'Una ramita de olivo pequeña, con líneas muy finas, en la parte interna del brazo.',
        area: 'Brazo · Negro y gris',
        artist: 'Lucía Torres',
        price: 65000,
        stage: 'agendada',
        slot: 'vie-15',
      },
    ],
    messages: {
      sofia: [
        {
          id: 1,
          from: 'cliente',
          text: '¡Hola! Me gustaría tatuarme unas flores en el antebrazo.',
        },
        {
          id: 2,
          from: 'estudio',
          text: '¡Hola, Sofía! Ya recibimos tu idea y las referencias. Lucía está revisando la propuesta.',
        },
      ],
      mateo: [
        { id: 1, from: 'cliente', text: 'Me encanta el boceto. ¿Cómo seguimos?' },
        {
          id: 2,
          from: 'estudio',
          text: 'Te compartimos la propuesta de Nicolás. Cuando la elijas podemos coordinar un horario.',
        },
      ],
      valentina: [
        {
          id: 1,
          from: 'estudio',
          text: 'Tu sesión quedó reservada para el viernes 27 de noviembre a las 15:00 con Lucía.',
        },
      ],
    },
    reminders: { turno: true, cuidados: true, resena: false, agenda: true },
    published: [true, true, false],
    feedback: '',
  };
}
export type DemoAction =
  | { type: 'quote'; id: string; artist: string; price: number }
  | { type: 'accept'; id: string }
  | { type: 'book'; id: string; slot: string }
  | { type: 'message'; id: string; text: string }
  | { type: 'reminder'; id: string }
  | { type: 'publish'; index: number }
  | { type: 'reset' };
function withMessage(state: DemoState, id: string, text: string) {
  const messages = state.messages[id] ?? [];
  return {
    ...state.messages,
    [id]: [...messages, { id: (messages.at(-1)?.id ?? 0) + 1, from: 'estudio' as const, text }],
  };
}
export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  if (action.type === 'reset') return initialDemo();
  if (action.type === 'reminder')
    return {
      ...state,
      reminders: { ...state.reminders, [action.id]: !state.reminders[action.id] },
      feedback: 'Preferencia de recordatorio actualizada.',
    };
  if (action.type === 'publish')
    return {
      ...state,
      published: state.published.map((p, i) => (i === action.index ? !p : p)),
      feedback: state.published[action.index]
        ? 'Trabajo guardado como borrador.'
        : 'Trabajo publicado en la página del estudio.',
    };
  const lead = state.leads.find((l) => l.id === action.id);
  if (!lead) return state;
  if (action.type === 'message') {
    const text = action.text.trim();
    if (!text || text.length > 1000) return state;
    return {
      ...state,
      messages: withMessage(state, lead.id, text),
      feedback: 'Mensaje agregado a la conversación de ejemplo.',
    };
  }
  if (action.type === 'quote') {
    if (
      lead.stage !== 'nueva' ||
      !artists.includes(action.artist) ||
      !Number.isFinite(action.price) ||
      action.price < 1000 ||
      action.price > 10000000
    )
      return { ...state, feedback: 'Revisá el artista y un importe entre $1.000 y $10.000.000.' };
    return {
      ...state,
      leads: state.leads.map((l) =>
        l.id === lead.id
          ? { ...l, artist: action.artist, price: action.price, stage: 'propuesta' }
          : l,
      ),
      messages: withMessage(
        state,
        lead.id,
        'Te compartimos la propuesta de ' +
          action.artist +
          ' por $' +
          action.price.toLocaleString('es-AR') +
          '. Incluye diseño y una sesión.',
      ),
      feedback: 'Propuesta enviada. Ahora podés simular la elección del cliente.',
    };
  }
  if (action.type === 'accept') {
    if (lead.stage !== 'propuesta') return state;
    return {
      ...state,
      leads: state.leads.map((l) => (l.id === lead.id ? { ...l, stage: 'aceptada' } : l)),
      feedback: 'Propuesta elegida. Reservá un horario en la agenda.',
    };
  }
  if (action.type === 'book') {
    const slot = slots.find((s) => s.id === action.slot);
    if (lead.stage !== 'aceptada' || !slot)
      return { ...state, feedback: 'Primero elegí una propuesta y un horario disponible.' };
    if (state.leads.some((l) => l.slot === slot.id && l.artist === lead.artist))
      return { ...state, feedback: 'Ese horario ya está ocupado. Elegí otro.' };
    return {
      ...state,
      leads: state.leads.map((l) =>
        l.id === lead.id ? { ...l, stage: 'agendada', slot: slot.id } : l,
      ),
      messages: withMessage(
        state,
        lead.id,
        'Tu turno quedó confirmado: ' +
          slot.day +
          ' a las ' +
          slot.time +
          ' con ' +
          lead.artist +
          '. Duración: 2 horas.',
      ),
      feedback: 'Turno reservado. Ya aparece en la agenda y en la conversación.',
    };
  }
  return state;
}
export const stageLabels: Record<DemoStage, string> = {
  nueva: 'Nueva consulta',
  propuesta: 'Propuesta enviada',
  aceptada: 'Por agendar',
  agendada: 'Turno confirmado',
};
export function demoMoney(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}
