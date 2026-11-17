import { addDays, dateKey, lastNDays, parseKey, today } from '../lib/date';
import type { AppData, Book, Deck, Flashcard, Habit, StudyBlock, StudyGroup, StudyLog, Subject } from '../types';

const now = Date.now();
const hoursAgo = (hours: number) => new Date(now - hours * 3_600_000).toISOString();

const subjects: Subject[] = [
  { id: 's-anat', name: 'Anatomía', color: '#a33900', icon: 'accessibility_new' },
  { id: 's-fisio', name: 'Fisiología', color: '#3b82f6', icon: 'monitor_heart' },
  { id: 's-bioq', name: 'Bioquímica', color: '#10b981', icon: 'science' },
  { id: 's-farma', name: 'Farmacología', color: '#8b5cf6', icon: 'medication' },
  { id: 's-neuro', name: 'Neurología', color: '#ec4899', icon: 'psychology' },
  { id: 's-gen', name: 'Genética', color: '#f59e0b', icon: 'genetics' },
];

const books: Book[] = [
  {
    id: 'b-anat',
    title: 'Anatomía humana',
    author: 'Sobotta',
    edition: '12ª Ed.',
    subjectId: 's-anat',
    totalPages: 340,
    currentPage: 62,
    chapter: 'Capítulo 4 · Músculos del miembro superior',
    format: 'pdf',
    icon: 'auto_stories',
    lastReadAt: hoursAgo(5),
  },
  {
    id: 'b-fisio',
    title: 'Fisiología médica',
    author: 'Guyton & Hall',
    subjectId: 's-fisio',
    totalPages: 300,
    currentPage: 115,
    chapter: 'Capítulo 5 · Potenciales de membrana',
    format: 'pdf',
    icon: 'menu_book',
    lastReadAt: hoursAgo(20),
  },
  {
    id: 'b-bioq',
    title: 'Bioquímica ilustrada',
    author: 'Harper',
    subjectId: 's-bioq',
    totalPages: 300,
    currentPage: 45,
    chapter: 'Capítulo 2 · Metabolismo de lípidos',
    format: 'pdf',
    icon: 'science',
    lastReadAt: hoursAgo(32),
  },
  {
    id: 'b-farma',
    title: 'Farmacología básica',
    author: 'Rang & Dale',
    subjectId: 's-farma',
    totalPages: 248,
    currentPage: 210,
    chapter: 'Capítulo 12 · Antibióticos',
    format: 'print',
    icon: 'medication',
    lastReadAt: hoursAgo(48),
  },
];

const notes: AppData['notes'] = [
  {
    id: 'n-flexores',
    title: 'Resumen de flexores del codo y antebrazo',
    content:
      'Bíceps braquial: flexión y supinación. Braquial anterior: flexor puro del codo. Braquiorradial: flexión con el antebrazo en pronación.',
    subjectId: 's-anat',
    kind: 'note',
    updatedAt: hoursAgo(26),
  },
  {
    id: 'a-biceps',
    title: 'Anotación · Anatomía humana',
    content:
      '“...se origina mediante dos tendones principales en la escápula, actuando sobre el músculo bíceps braquial...”',
    subjectId: 's-anat',
    kind: 'annotation',
    bookId: 'b-anat',
    page: 62,
    color: '#FDE68A',
    updatedAt: hoursAgo(5),
  },
  {
    id: 'n-antibioticos',
    title: 'Antibióticos: mecanismos de acción',
    content:
      'Pared celular: beta-lactámicos y glucopéptidos. Subunidad 30S: aminoglucósidos y tetraciclinas. Subunidad 50S: macrólidos y cloranfenicol.',
    subjectId: 's-farma',
    kind: 'note',
    updatedAt: hoursAgo(40),
  },
  {
    id: 'n-potencial',
    title: 'Fórmulas del potencial de membrana',
    content:
      'Ecuación de Nernst: E = 61 · log([X]e / [X]i) a 37 °C. La bomba Na+/K+ mantiene el gradiente con gasto de ATP.',
    subjectId: 's-fisio',
    kind: 'note',
    updatedAt: hoursAgo(16),
  },
];

const todayKey = today();
const yesterday = addDays(todayKey, -1);

const tasks: AppData['tasks'] = [
  {
    id: 't-1',
    title: 'Resumen de osteología',
    subjectId: 's-anat',
    date: todayKey,
    time: '16:00',
    durationMinutes: 60,
    done: true,
  },
  {
    id: 't-2',
    title: 'Repaso de flashcards Anki',
    subjectId: 's-fisio',
    date: todayKey,
    time: '17:30',
    durationMinutes: 45,
    done: false,
  },
  {
    id: 't-3',
    title: 'Lectura Bioquímica Cap. 2',
    subjectId: 's-bioq',
    date: todayKey,
    time: '19:00',
    durationMinutes: 75,
    done: false,
  },
  {
    id: 't-4',
    title: 'Revisar apuntes de farmacología',
    subjectId: 's-farma',
    date: yesterday,
    time: '18:00',
    durationMinutes: 30,
    done: true,
  },
  {
    id: 't-5',
    title: 'Esquema del sistema renina-angiotensina',
    subjectId: 's-fisio',
    date: addDays(todayKey, 1),
    time: '10:00',
    durationMinutes: 40,
    done: false,
  },
];

const habitDays = lastNDays(9);
const habits: Habit[] = [
  {
    id: 'h-leer',
    name: 'Leer',
    icon: 'menu_book',
    history: [...habitDays.slice(1, 8), todayKey],
  },
  {
    id: 'h-repasar',
    name: 'Repasar',
    icon: 'layers',
    history: [habitDays[2], habitDays[4], todayKey],
  },
  {
    id: 'h-agua',
    name: 'Agua',
    icon: 'water_drop',
    history: habitDays.slice(0, 6),
  },
  {
    id: 'h-dormir',
    name: 'Dormir',
    icon: 'bedtime',
    history: [habitDays[1], habitDays[3], habitDays[6]],
  },
  {
    id: 'h-ejercicio',
    name: 'Ejercicio',
    icon: 'fitness_center',
    history: [habitDays[0], habitDays[5]],
  },
];

const blocks: StudyBlock[] = [
  {
    id: 'bl-1',
    title: 'Anatomía · Cap. 4',
    subjectId: 's-anat',
    date: todayKey,
    start: '14:00',
    durationMinutes: 60,
    done: true,
    kind: 'study',
    notes: 'Páginas 62 a 75',
  },
  {
    id: 'bl-2',
    title: 'Fisiología: sesión de repaso',
    subjectId: 's-fisio',
    date: todayKey,
    start: '16:00',
    durationMinutes: 60,
    done: false,
    kind: 'review',
    notes: '32 flashcards',
  },
  {
    id: 'bl-3',
    title: 'Bioquímica: ejercicios de lípidos',
    subjectId: 's-bioq',
    date: todayKey,
    start: '17:30',
    durationMinutes: 90,
    done: false,
    kind: 'study',
    notes: 'Problemas 4 al 12',
  },
  {
    id: 'bl-4',
    title: 'Lectura complementaria Genética',
    subjectId: 's-gen',
    date: todayKey,
    durationMinutes: 20,
    done: false,
    kind: 'study',
  },
  {
    id: 'bl-5',
    title: 'Subir dudas al foro de Fisiología',
    subjectId: 's-fisio',
    date: todayKey,
    durationMinutes: 10,
    done: false,
    kind: 'study',
  },
  {
    id: 'bl-6',
    title: 'Actualizar vocabulario farmacológico',
    subjectId: 's-farma',
    date: todayKey,
    durationMinutes: 15,
    done: false,
    kind: 'study',
  },
  {
    id: 'bl-7',
    title: 'Examen de Fisiología',
    subjectId: 's-fisio',
    date: addDays(todayKey, 6),
    start: '09:00',
    durationMinutes: 120,
    done: false,
    kind: 'exam',
    progress: 75,
    notes: 'Unidades 3 a 5',
  },
  {
    id: 'bl-8',
    title: 'Repaso de anatomía',
    subjectId: 's-anat',
    date: addDays(todayKey, 1),
    start: '10:00',
    durationMinutes: 60,
    done: false,
    kind: 'review',
  },
  {
    id: 'bl-9',
    title: 'Bioquímica · Cap. 2',
    subjectId: 's-bioq',
    date: yesterday,
    start: '18:00',
    durationMinutes: 50,
    done: true,
    kind: 'study',
  },
];

const decks: Deck[] = [
  { id: 'd-anat', name: 'Anatomía: Huesos del cráneo', subjectId: 's-anat', createdAt: hoursAgo(72) },
  {
    id: 'd-fisio',
    name: 'Fisiología: Potencial de acción',
    subjectId: 's-fisio',
    createdAt: hoursAgo(110),
  },
  {
    id: 'd-farma',
    name: 'Farmacología: Antibióticos',
    subjectId: 's-farma',
    createdAt: hoursAgo(28),
  },
];

type CardSeed = {
  deckId: string;
  question: string;
  answer: string;
  hint?: string;
  keyPoint?: string;
  state: Flashcard['state'];
  dueIn: number;
  interval?: number;
};

const cardSeeds: CardSeed[] = [
  {
    deckId: 'd-anat',
    question: '¿Cuál es el origen de la cabeza corta y la cabeza larga del músculo bíceps braquial?',
    answer:
      'Cabeza corta: vértice de la apófisis coracoides de la escápula. Cabeza larga: tubérculo supraglenoideo de la escápula.',
    hint: 'Piensa en dos prominencias anatómicas de la escápula anterior y superior.',
    keyPoint: 'Inervación: nervio musculocutáneo (C5-C6).',
    state: 'new',
    dueIn: 0,
  },
  {
    deckId: 'd-anat',
    question: '¿Qué huesos forman la calota craneal?',
    answer: 'Frontal, occipital, parietales y temporales.',
    state: 'new',
    dueIn: 0,
  },
  {
    deckId: 'd-anat',
    question: '¿Qué sutura separa el hueso frontal de los parietales?',
    answer: 'La sutura coronal.',
    state: 'new',
    dueIn: 0,
  },
  {
    deckId: 'd-anat',
    question: '¿Cuál es el principal músculo supinador del antebrazo?',
    answer: 'El bíceps braquial, especialmente con el codo flexionado.',
    state: 'learning',
    dueIn: 0,
    interval: 1,
  },
  {
    deckId: 'd-anat',
    question: '¿Qué nervio inerva el músculo deltoides?',
    answer: 'El nervio axilar (circunflejo), con raíces C5-C6.',
    state: 'learning',
    dueIn: 0,
    interval: 2,
  },
  {
    deckId: 'd-anat',
    question: '¿Cómo se articulan el atlas y el axis?',
    answer: 'Mediante la articulación atlantoaxial media, entre el arco anterior del atlas y el diente del axis.',
    state: 'review',
    dueIn: 0,
    interval: 5,
  },
  {
    deckId: 'd-anat',
    question: '¿Qué estructura atraviesa el foramen transverso de las vértebras cervicales?',
    answer: 'La arteria vertebral.',
    state: 'review',
    dueIn: 3,
    interval: 8,
  },
  {
    deckId: 'd-anat',
    question: '¿Dónde se inserta el tendón distal del bíceps braquial?',
    answer: 'En la tuberosidad del radio.',
    state: 'review',
    dueIn: 5,
    interval: 12,
  },
  {
    deckId: 'd-fisio',
    question: '¿Cuáles son las fases principales del potencial de acción?',
    answer:
      'Despolarización por entrada de Na+, repolarización por salida de K+ y, en algunas fibras, una fase de meseta.',
    hint: 'Sigue el movimiento de los iones a través de la membrana.',
    keyPoint: 'En el corazón, la meseta prolonga la despolarización y protege el periodo refractario.',
    state: 'new',
    dueIn: 0,
  },
  {
    deckId: 'd-fisio',
    question: '¿Qué valor aproximado tiene el umbral de excitación de una neurona?',
    answer: 'Alrededor de -55 mV.',
    state: 'new',
    dueIn: 0,
  },
  {
    deckId: 'd-fisio',
    question: '¿Cuál es la estequiometría de la bomba Na+/K+?',
    answer: 'Expulsa 3 Na+ e introduce 2 K+ por cada molécula de ATP hidrolizada.',
    state: 'learning',
    dueIn: 0,
    interval: 2,
  },
  {
    deckId: 'd-fisio',
    question: '¿Qué es el periodo refractario absoluto?',
    answer: 'El intervalo en el que ningún estímulo puede desencadenar un nuevo potencial de acción.',
    state: 'learning',
    dueIn: 0,
    interval: 1,
  },
  {
    deckId: 'd-fisio',
    question: '¿Qué ion es responsable de la despolarización del potencial de acción?',
    answer: 'El sodio (Na+), que entra a favor de su gradiente electroquímico.',
    state: 'review',
    dueIn: 0,
    interval: 6,
  },
  {
    deckId: 'd-fisio',
    question: '¿Qué produce la repolarización de la membrana?',
    answer: 'La salida de potasio (K+) a través de canales dependientes de voltaje.',
    state: 'review',
    dueIn: 4,
    interval: 10,
  },
  {
    deckId: 'd-fisio',
    question: '¿En qué fibras ocurre la conducción saltatoria?',
    answer: 'En las fibras nerviosas mielinizadas, saltando entre los nódulos de Ranvier.',
    state: 'review',
    dueIn: 8,
    interval: 16,
  },
  {
    deckId: 'd-farma',
    question: '¿Cuál es el mecanismo de acción de las penicilinas?',
    answer:
      'Inhiben la síntesis de la pared bacteriana al bloquear las transpeptidasas (proteínas fijadoras de penicilina).',
    hint: 'Actúan sobre el peptidoglicano.',
    keyPoint: 'Son bactericidas y su efecto depende de bacterias en fase de crecimiento activo.',
    state: 'new',
    dueIn: 0,
  },
  {
    deckId: 'd-farma',
    question: '¿Qué subunidad ribosomal inhiben los aminoglucósidos?',
    answer: 'La subunidad 30S. Son bactericidas y pueden causar nefrotoxicidad y ototoxicidad.',
    state: 'new',
    dueIn: 0,
  },
  {
    deckId: 'd-farma',
    question: '¿En qué casos están contraindicadas las tetraciclinas?',
    answer: 'En embarazo y niños menores de 8 años por alteraciones del esmalte dental y del hueso.',
    state: 'new',
    dueIn: 0,
  },
  {
    deckId: 'd-farma',
    question: '¿Cuál es el mecanismo de la vancomicina?',
    answer:
      'Inhibe la síntesis de la pared celular uniéndose a los precursores del peptidoglicano. Se usa en infecciones por MRSA.',
    keyPoint: 'Infusión rápida: síndrome del hombre rojo por liberación de histamina.',
    state: 'new',
    dueIn: 0,
  },
  {
    deckId: 'd-farma',
    question: '¿Qué subunidad ribosomal inhiben los macrólidos?',
    answer: 'La subunidad 50S. Son bacteriostáticos y pueden prolongar el intervalo QT.',
    state: 'learning',
    dueIn: 0,
    interval: 2,
  },
  {
    deckId: 'd-farma',
    question: '¿Cuáles son los principales mecanismos de resistencia bacteriana?',
    answer:
      'Producción de enzimas inactivadoras, bombas de expulsión, alteración de la diana y reducción de la permeabilidad.',
    state: 'review',
    dueIn: 0,
    interval: 4,
  },
  {
    deckId: 'd-farma',
    question: '¿Qué antibiótico se usa habitualmente en profilaxis quirúrgica?',
    answer: 'Cefazolina, administrada 30-60 minutos antes de la incisión.',
    state: 'review',
    dueIn: 6,
    interval: 14,
  },
];

const cards: Flashcard[] = cardSeeds.map((seed, index) => ({
  id: `c-${index + 1}`,
  deckId: seed.deckId,
  question: seed.question,
  answer: seed.answer,
  hint: seed.hint,
  keyPoint: seed.keyPoint,
  state: seed.state,
  due: addDays(todayKey, seed.dueIn),
  intervalDays: seed.interval ?? 0,
  lapses: seed.state === 'learning' ? 1 : 0,
}));

export interface GroupInvite {
  code: string;
  name: string;
  subjectId: string;
  memberCount: number;
  memberInitials: string[];
}

export const GROUP_INVITES: GroupInvite[] = [
  {
    code: '842615',
    name: 'Repaso de Fisiología',
    subjectId: 's-fisio',
    memberCount: 14,
    memberInitials: ['DR', 'LC', 'PM'],
  },
  {
    code: '193407',
    name: 'Club de Farmacología',
    subjectId: 's-farma',
    memberCount: 9,
    memberInitials: ['NV', 'RB', 'GS'],
  },
];

const groups: StudyGroup[] = [
  {
    id: 'g-medicina',
    name: 'Medicina 2025',
    subjectId: 's-anat',
    memberCount: 5,
    memberInitials: ['MD', 'AL', 'CM'],
    live: true,
    archived: false,
    joinedAt: hoursAgo(900),
    activities: [
      {
        id: 'ga-1',
        text: 'Ana compartió el mazo Huesos',
        icon: 'style',
        at: hoursAgo(2),
      },
      {
        id: 'ga-2',
        text: 'Carlos inició una sala de estudio',
        icon: 'podcasts',
        at: hoursAgo(4),
      },
    ],
  },
  {
    id: 'g-sobotta',
    name: 'Grupo de Anatomía Sobotta',
    subjectId: 's-anat',
    memberCount: 12,
    memberInitials: ['CL', 'JR', 'MG'],
    live: false,
    archived: false,
    joinedAt: hoursAgo(3000),
    activities: [
      {
        id: 'ga-3',
        text: 'Carlos completó una sesión de 50 min',
        icon: 'timer',
        at: hoursAgo(4),
      },
    ],
  },
  {
    id: 'g-guyton',
    name: 'Fisiología Guyton Club',
    subjectId: 's-fisio',
    memberCount: 8,
    memberInitials: ['CR', 'LP', 'MV'],
    live: false,
    archived: false,
    joinedAt: hoursAgo(600),
    activities: [
      {
        id: 'ga-4',
        text: '3 notas nuevas compartidas ayer',
        icon: 'description',
        at: hoursAgo(28),
      },
    ],
  },
  {
    id: 'g-bioq',
    name: 'Bioquímica Intensivo',
    subjectId: 's-bioq',
    memberCount: 6,
    memberInitials: ['BT', 'NG', 'SV'],
    live: false,
    archived: true,
    joinedAt: hoursAgo(5000),
    activities: [
      {
        id: 'ga-5',
        text: 'Mazo de lípidos archivado',
        icon: 'inventory_2',
        at: hoursAgo(2000),
      },
    ],
  },
];

const buildLogs = (): StudyLog[] => {
  const baseMinutes = [45, 120, 145, 110, 150, 135, 95];
  const subjectIds = subjects.map((subject) => subject.id);
  return Array.from({ length: 365 }, (_, index) => {
    const date = addDays(todayKey, -index);
    const weekday = parseKey(date).getDay();
    const isRecent = index < 9;
    const skip = !isRecent && index > 20 && index % 17 === 0;
    const minutes = skip ? 0 : baseMinutes[weekday] + ((index * 37) % 55) - 20;
    const primary = subjectIds[index % subjectIds.length];
    const secondary = subjectIds[(index + 2) % subjectIds.length];
    const primaryMinutes = Math.round(minutes * 0.68);
    const reviews = minutes === 0 ? 0 : Math.round(minutes / 5) + (index % 9);
    const accuracy = 0.8 + ((index * 13) % 14) / 100;
    return {
      date,
      minutes: Math.max(0, minutes),
      pages: minutes === 0 ? 0 : Math.round(minutes / 24),
      reviews,
      correct: Math.round(reviews * accuracy),
      minutesBySubject:
        minutes === 0
          ? {}
          : {
              [primary]: primaryMinutes,
              [secondary]: Math.max(0, minutes - primaryMinutes),
            },
    };
  });
};

export const createSeedData = (): AppData => ({
  subjects,
  books,
  notes,
  tasks,
  habits,
  blocks,
  decks,
  cards,
  groups,
  logs: buildLogs(),
  profile: {
    name: 'Martín Domínguez',
    email: 'm.dominguez@estudia.app',
    plan: 'Plan Estudiante Pro',
  },
  settings: {
    pomodoroFocus: 25,
    pomodoroBreak: 5,
    cycles: 4,
    algorithm: 'FSRS v4.5',
    notifications: true,
    reminderMorning: '09:00',
    reminderEvening: '16:00',
    sounds: true,
    ambient: 'Lluvia suave',
    lastBackup: new Date(now - 7_200_000).toISOString(),
  },
});

export const seedToday = dateKey;
