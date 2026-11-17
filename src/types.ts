export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  subjectId: string;
  totalPages: number;
  currentPage: number;
  edition?: string;
  format: 'pdf' | 'print';
  icon: string;
  chapter?: string;
  lastReadAt?: string;
  fileName?: string;
}

export type NoteKind = 'note' | 'annotation';

export interface Note {
  id: string;
  title: string;
  content: string;
  subjectId: string;
  kind: NoteKind;
  bookId?: string;
  page?: number;
  color?: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  subjectId: string;
  date: string;
  time?: string;
  durationMinutes: number;
  done: boolean;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  history: string[];
}

export type BlockKind = 'study' | 'review' | 'exam';

export interface StudyBlock {
  id: string;
  title: string;
  subjectId: string;
  date: string;
  start?: string;
  durationMinutes: number;
  done: boolean;
  kind: BlockKind;
  notes?: string;
  progress?: number;
}

export type CardState = 'new' | 'learning' | 'review';

export interface Flashcard {
  id: string;
  deckId: string;
  question: string;
  answer: string;
  hint?: string;
  keyPoint?: string;
  state: CardState;
  due: string;
  intervalDays: number;
  lapses: number;
}

export interface Deck {
  id: string;
  name: string;
  subjectId: string;
  createdAt: string;
}

export interface GroupActivity {
  id: string;
  text: string;
  icon: string;
  at: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  subjectId?: string;
  memberCount: number;
  memberInitials: string[];
  live: boolean;
  archived: boolean;
  joinedAt: string;
  activities: GroupActivity[];
}

export interface StudyLog {
  date: string;
  minutes: number;
  pages: number;
  reviews: number;
  correct: number;
  minutesBySubject: Record<string, number>;
}

export interface Settings {
  pomodoroFocus: number;
  pomodoroBreak: number;
  cycles: number;
  algorithm: 'FSRS v4.5' | 'SM-2';
  notifications: boolean;
  reminderMorning: string;
  reminderEvening: string;
  sounds: boolean;
  ambient: string;
  lastBackup?: string;
}

export interface Profile {
  name: string;
  email: string;
  plan: string;
}

export interface AppData {
  subjects: Subject[];
  books: Book[];
  notes: Note[];
  tasks: Task[];
  habits: Habit[];
  blocks: StudyBlock[];
  decks: Deck[];
  cards: Flashcard[];
  groups: StudyGroup[];
  logs: StudyLog[];
  profile: Profile;
  settings: Settings;
}

export type SessionMode = 'pomodoro' | 'free';
export type SessionKind = 'focus' | 'break';

export interface StudySession {
  active: boolean;
  running: boolean;
  mode: SessionMode;
  kind: SessionKind;
  total: number;
  remaining: number;
  subjectId?: string;
  bookId?: string;
  cyclesDone: number;
}

export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface ThemeSettings {
  mode: 'light' | 'dark' | 'system';
  palette: string;
  customColor: string;
}
