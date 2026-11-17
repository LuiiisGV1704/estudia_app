import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { GROUP_INVITES, createSeedData } from '../data/seed';
import { addDays, today } from '../lib/date';
import { loadData, saveData } from '../lib/storage';
import type {
  AppData,
  Book,
  Deck,
  Flashcard,
  Note,
  Rating,
  Settings,
  StudyBlock,
  StudyGroup,
  StudyLog,
  Subject,
  Task,
} from '../types';

type NewTask = Pick<Task, 'title' | 'subjectId' | 'date' | 'time' | 'durationMinutes'>;
type NewBlock = Omit<StudyBlock, 'id' | 'done'> & { done?: boolean };
type NewBook = Omit<Book, 'id' | 'currentPage' | 'lastReadAt'> & { currentPage?: number };
type NewNote = Omit<Note, 'id' | 'updatedAt'>;
type NewCard = Pick<Flashcard, 'deckId' | 'question' | 'answer' | 'hint' | 'keyPoint'>;

interface ToastState {
  id: number;
  message: string;
  icon: string;
}

interface AppActions {
  toggleTask: (id: string) => void;
  addTask: (input: NewTask) => void;
  removeTask: (id: string) => void;
  addHabit: (name: string, icon: string) => void;
  toggleHabit: (id: string, date?: string) => void;
  removeHabit: (id: string) => void;
  addBlock: (input: NewBlock) => void;
  toggleBlock: (id: string) => void;
  removeBlock: (id: string) => void;
  addSubject: (input: { name: string; color: string; icon?: string }) => Subject;
  updateSubject: (id: string, patch: Partial<Omit<Subject, 'id'>>) => void;
  removeSubject: (id: string) => void;
  addBook: (input: NewBook) => Book;
  updateBook: (id: string, patch: Partial<Omit<Book, 'id'>>) => void;
  removeBook: (id: string) => void;
  addNote: (input: NewNote) => Note;
  updateNote: (id: string, patch: Partial<Omit<Note, 'id'>>) => void;
  removeNote: (id: string) => void;
  addDeck: (name: string, subjectId: string) => Deck;
  removeDeck: (id: string) => void;
  addCard: (input: NewCard) => Flashcard;
  removeCard: (id: string) => void;
  rateCard: (id: string, rating: Rating) => void;
  logStudy: (minutes: number, subjectId?: string) => void;
  addGroup: (name: string, subjectId?: string) => StudyGroup;
  joinGroup: (code: string) => { ok: boolean; message: string };
  toggleGroupArchive: (id: string) => void;
  removeGroup: (id: string) => void;
  updateProfile: (patch: Partial<AppData['profile']>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetData: () => void;
}

interface AppContextValue {
  data: AppData;
  actions: AppActions;
  notify: (message: string, icon?: string) => void;
  toast: ToastState | null;
}

const AppContext = createContext<AppContextValue | null>(null);

const uid = (prefix: string): string =>
  `${prefix}-${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10)}`;

const RATING_DAYS: Record<Rating, number> = { again: 0, hard: 1, good: 3, easy: 7 };
const RATING_FACTOR: Record<Rating, number> = { again: 0, hard: 1.2, good: 1.5, easy: 2.1 };

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData() ?? createSeedData());
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    saveData(data);
  }, [data]);

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    },
    [],
  );

  const notify = useCallback((message: string, icon = 'check_circle') => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    const id = Date.now();
    setToast({ id, message, icon });
    toastTimer.current = window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 2800);
  }, []);

  const actions: AppActions = {
    toggleTask: (id) =>
      setData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
      })),
    addTask: (input) =>
      setData((prev) => ({
        ...prev,
        tasks: [...prev.tasks, { ...input, id: uid('task'), done: false }],
      })),
    removeTask: (id) => setData((prev) => ({ ...prev, tasks: prev.tasks.filter((task) => task.id !== id) })),
    addHabit: (name, icon) =>
      setData((prev) => ({
        ...prev,
        habits: [...prev.habits, { id: uid('habit'), name, icon, history: [] }],
      })),
    toggleHabit: (id, date = today()) =>
      setData((prev) => ({
        ...prev,
        habits: prev.habits.map((habit) => {
          if (habit.id !== id) return habit;
          const included = habit.history.includes(date);
          return {
            ...habit,
            history: included ? habit.history.filter((day) => day !== date) : [...habit.history, date],
          };
        }),
      })),
    removeHabit: (id) => setData((prev) => ({ ...prev, habits: prev.habits.filter((habit) => habit.id !== id) })),
    addBlock: (input) =>
      setData((prev) => ({
        ...prev,
        blocks: [...prev.blocks, { ...input, id: uid('block'), done: input.done ?? false }],
      })),
    toggleBlock: (id) =>
      setData((prev) => ({
        ...prev,
        blocks: prev.blocks.map((block) => (block.id === id ? { ...block, done: !block.done } : block)),
      })),
    removeBlock: (id) => setData((prev) => ({ ...prev, blocks: prev.blocks.filter((block) => block.id !== id) })),
    addSubject: (input) => {
      const subject: Subject = {
        id: uid('subject'),
        name: input.name,
        color: input.color,
        icon: input.icon ?? 'school',
      };
      setData((prev) => ({ ...prev, subjects: [...prev.subjects, subject] }));
      return subject;
    },
    updateSubject: (id, patch) =>
      setData((prev) => ({
        ...prev,
        subjects: prev.subjects.map((subject) => (subject.id === id ? { ...subject, ...patch } : subject)),
      })),
    removeSubject: (id) =>
      setData((prev) => ({
        ...prev,
        subjects: prev.subjects.filter((subject) => subject.id !== id),
      })),
    addBook: (input) => {
      const book: Book = {
        ...input,
        id: uid('book'),
        currentPage: input.currentPage ?? 0,
        lastReadAt: new Date().toISOString(),
      };
      setData((prev) => ({ ...prev, books: [...prev.books, book] }));
      return book;
    },
    updateBook: (id, patch) =>
      setData((prev) => ({
        ...prev,
        books: prev.books.map((book) =>
          book.id === id
            ? {
                ...book,
                ...patch,
                lastReadAt: patch.currentPage !== undefined ? new Date().toISOString() : book.lastReadAt,
              }
            : book,
        ),
      })),
    removeBook: (id) => setData((prev) => ({ ...prev, books: prev.books.filter((book) => book.id !== id) })),
    addNote: (input) => {
      const note: Note = { ...input, id: uid('note'), updatedAt: new Date().toISOString() };
      setData((prev) => ({ ...prev, notes: [note, ...prev.notes] }));
      return note;
    },
    updateNote: (id, patch) =>
      setData((prev) => ({
        ...prev,
        notes: prev.notes.map((note) =>
          note.id === id ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note,
        ),
      })),
    removeNote: (id) => setData((prev) => ({ ...prev, notes: prev.notes.filter((note) => note.id !== id) })),
    addDeck: (name, subjectId) => {
      const deck: Deck = {
        id: uid('deck'),
        name,
        subjectId,
        createdAt: new Date().toISOString(),
      };
      setData((prev) => ({ ...prev, decks: [...prev.decks, deck] }));
      return deck;
    },
    removeDeck: (id) =>
      setData((prev) => ({
        ...prev,
        decks: prev.decks.filter((deck) => deck.id !== id),
        cards: prev.cards.filter((card) => card.deckId !== id),
      })),
    addCard: (input) => {
      const card: Flashcard = {
        ...input,
        id: uid('card'),
        state: 'new',
        due: today(),
        intervalDays: 0,
        lapses: 0,
      };
      setData((prev) => ({ ...prev, cards: [...prev.cards, card] }));
      return card;
    },
    removeCard: (id) => setData((prev) => ({ ...prev, cards: prev.cards.filter((card) => card.id !== id) })),
    rateCard: (id, rating) =>
      setData((prev) => {
        const cards = prev.cards.map((card) => {
          if (card.id !== id) return card;
          const days =
            rating === 'hard' || rating === 'good' || rating === 'easy'
              ? Math.max(RATING_DAYS[rating], Math.round(Math.max(1, card.intervalDays) * RATING_FACTOR[rating]))
              : 0;
          return {
            ...card,
            state: rating === 'again' || rating === 'hard' ? 'learning' : 'review',
            due: addDays(today(), days),
            intervalDays: days,
            lapses: card.lapses + (rating === 'again' ? 1 : 0),
          } as Flashcard;
        });
        const dayKey = today();
        const existing = prev.logs.find((log) => log.date === dayKey);
        const logs = existing
          ? prev.logs.map((log) =>
              log.date === dayKey
                ? {
                    ...log,
                    reviews: log.reviews + 1,
                    correct: log.correct + (rating === 'again' ? 0 : 1),
                  }
                : log,
            )
          : [
              {
                date: dayKey,
                minutes: 0,
                pages: 0,
                reviews: 1,
                correct: rating === 'again' ? 0 : 1,
                minutesBySubject: {},
              },
              ...prev.logs,
            ];
        return { ...prev, cards, logs };
      }),
    logStudy: (minutes, subjectId) => {
      const logged = Math.max(0, Math.round(minutes));
      if (logged === 0) return;
      setData((prev) => {
        const date = today();
        const merge = (log: StudyLog): StudyLog => ({
          ...log,
          minutes: log.minutes + logged,
          minutesBySubject: subjectId
            ? {
                ...log.minutesBySubject,
                [subjectId]: (log.minutesBySubject[subjectId] ?? 0) + logged,
              }
            : log.minutesBySubject,
        });
        const existing = prev.logs.find((log) => log.date === date);
        const logs = existing
          ? prev.logs.map((log) => (log.date === date ? merge(log) : log))
          : [merge({ date, minutes: 0, pages: 0, reviews: 0, correct: 0, minutesBySubject: {} }), ...prev.logs];
        return { ...prev, logs };
      });
    },
    addGroup: (name, subjectId) => {
      const group: StudyGroup = {
        id: uid('group'),
        name,
        subjectId,
        memberCount: 1,
        memberInitials: ['YO'],
        live: false,
        archived: false,
        joinedAt: new Date().toISOString(),
        activities: [
          {
            id: uid('activity'),
            text: 'Creaste el grupo',
            icon: 'group_add',
            at: new Date().toISOString(),
          },
        ],
      };
      setData((prev) => ({ ...prev, groups: [group, ...prev.groups] }));
      return group;
    },
    joinGroup: (code) => {
      const invite = GROUP_INVITES.find((entry) => entry.code === code.trim());
      if (!invite) return { ok: false, message: 'Código no válido. Prueba con 842615.' };
      if (data.groups.some((group) => group.name === invite.name)) {
        return { ok: false, message: 'Ya formas parte de ese grupo.' };
      }
      const group: StudyGroup = {
        id: uid('group'),
        name: invite.name,
        subjectId: invite.subjectId,
        memberCount: invite.memberCount,
        memberInitials: invite.memberInitials,
        live: false,
        archived: false,
        joinedAt: new Date().toISOString(),
        activities: [
          {
            id: uid('activity'),
            text: 'Te uniste con el código del grupo',
            icon: 'login',
            at: new Date().toISOString(),
          },
        ],
      };
      setData((prev) => ({ ...prev, groups: [group, ...prev.groups] }));
      return { ok: true, message: `Te uniste a ${invite.name}` };
    },
    toggleGroupArchive: (id) =>
      setData((prev) => ({
        ...prev,
        groups: prev.groups.map((group) => (group.id === id ? { ...group, archived: !group.archived } : group)),
      })),
    removeGroup: (id) => setData((prev) => ({ ...prev, groups: prev.groups.filter((group) => group.id !== id) })),
    updateProfile: (patch) => setData((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } })),
    updateSettings: (patch) => setData((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } })),
    resetData: () => setData(createSeedData()),
  };

  return <AppContext.Provider value={{ data, actions, notify, toast }}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
