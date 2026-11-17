import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import type { SessionKind, SessionMode, StudySession } from '../types';

import { useApp } from './AppProvider';

interface BeginOptions {
  subjectId?: string;
  bookId?: string;
  mode?: SessionMode;
}

interface SessionContextValue {
  session: StudySession;
  begin: (options?: BeginOptions) => void;
  toggle: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skip: () => void;
  stop: () => void;
  setMode: (mode: SessionMode) => void;
  setSubject: (subjectId: string) => void;
  setBook: (bookId?: string) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const durationFor = (mode: SessionMode, focusMinutes: number): number => (mode === 'pomodoro' ? focusMinutes : 90) * 60;

const initialSession = (focusMinutes: number, subjectId?: string): StudySession => ({
  active: false,
  running: false,
  mode: 'pomodoro',
  kind: 'focus',
  total: focusMinutes * 60,
  remaining: focusMinutes * 60,
  subjectId,
  cyclesDone: 0,
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const { data, notify, actions } = useApp();
  const logStudy = actions.logStudy;
  const [session, setSession] = useState<StudySession>(() =>
    initialSession(data.settings.pomodoroFocus, data.subjects[0]?.id),
  );
  const previousKind = useRef<SessionKind>(session.kind);
  const completedFocus = useRef(false);

  useEffect(() => {
    if (!session.active || !session.running) return;
    const interval = window.setInterval(() => {
      setSession((prev) => {
        if (!prev.active || !prev.running) return prev;
        if (prev.remaining > 1) return { ...prev, remaining: prev.remaining - 1 };
        if (prev.mode === 'free') {
          return { ...prev, remaining: 0, running: false };
        }
        if (prev.kind === 'focus') {
          completedFocus.current = true;
          const total = data.settings.pomodoroBreak * 60;
          return {
            ...prev,
            kind: 'break',
            total,
            remaining: total,
            cyclesDone: prev.cyclesDone + 1,
          };
        }
        const total = data.settings.pomodoroFocus * 60;
        return { ...prev, kind: 'focus', total, remaining: total };
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [session.active, session.running, data.settings.pomodoroBreak, data.settings.pomodoroFocus]);

  useEffect(() => {
    if (previousKind.current !== session.kind && session.active) {
      if (session.kind === 'break' && completedFocus.current) {
        logStudy(data.settings.pomodoroFocus, session.subjectId);
      }
      completedFocus.current = false;
      const message =
        session.kind === 'break'
          ? `Enfoque completado · descanso de ${data.settings.pomodoroBreak} min`
          : 'Descanso terminado · de vuelta al enfoque';
      notify(message, session.kind === 'break' ? 'coffee' : 'bolt');
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.([180, 80, 180]);
      }
    }
    previousKind.current = session.kind;
  }, [
    session.kind,
    session.active,
    session.subjectId,
    notify,
    logStudy,
    data.settings.pomodoroFocus,
    data.settings.pomodoroBreak,
  ]);

  const value = useMemo<SessionContextValue>(() => {
    const elapsedFocusMinutes = (entry: StudySession): number =>
      entry.active && entry.kind === 'focus' ? Math.max(0, Math.round((entry.total - entry.remaining) / 60)) : 0;

    const begin = (options: BeginOptions = {}) =>
      setSession((prev) => {
        const mode = options.mode ?? prev.mode;
        if (prev.active) {
          return {
            ...prev,
            running: true,
            subjectId: options.subjectId ?? prev.subjectId,
            bookId: options.bookId ?? prev.bookId,
          };
        }
        const total = durationFor(mode, data.settings.pomodoroFocus);
        return {
          active: true,
          running: true,
          mode,
          kind: 'focus',
          total,
          remaining: total,
          subjectId: options.subjectId ?? prev.subjectId ?? data.subjects[0]?.id,
          bookId: options.bookId,
          cyclesDone: 0,
        };
      });
    return {
      session,
      begin,
      toggle: () =>
        setSession((prev) =>
          prev.active ? { ...prev, running: !prev.running } : { ...prev, active: true, running: true },
        ),
      pause: () => setSession((prev) => ({ ...prev, running: false })),
      resume: () => setSession((prev) => ({ ...prev, active: true, running: true })),
      reset: () => setSession((prev) => ({ ...prev, remaining: prev.total, running: false })),
      skip: () => {
        const elapsed = elapsedFocusMinutes(session);
        if (elapsed > 0 && session.mode === 'pomodoro') logStudy(elapsed, session.subjectId);
        setSession((prev) => {
          if (prev.mode === 'free') {
            const total = durationFor('free', data.settings.pomodoroFocus);
            return { ...prev, kind: 'focus', total, remaining: total };
          }
          const kind: SessionKind = prev.kind === 'focus' ? 'break' : 'focus';
          const total = (kind === 'focus' ? data.settings.pomodoroFocus : data.settings.pomodoroBreak) * 60;
          return { ...prev, kind, total, remaining: total };
        });
      },
      stop: () => {
        const elapsed = elapsedFocusMinutes(session);
        if (elapsed > 0) logStudy(elapsed, session.subjectId);
        setSession({
          ...initialSession(data.settings.pomodoroFocus, data.subjects[0]?.id),
        });
      },
      setMode: (mode) =>
        setSession((prev) => {
          if (prev.mode === mode) return prev;
          const total = durationFor(mode, data.settings.pomodoroFocus);
          return {
            ...prev,
            mode,
            kind: 'focus',
            total,
            remaining: total,
            running: false,
            cyclesDone: 0,
          };
        }),
      setSubject: (subjectId) => setSession((prev) => ({ ...prev, subjectId })),
      setBook: (bookId) => setSession((prev) => ({ ...prev, bookId })),
    };
  }, [session, logStudy, data.settings.pomodoroFocus, data.settings.pomodoroBreak, data.subjects]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used inside SessionProvider');
  return context;
}
