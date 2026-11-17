import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { HabitModal, TaskModal } from '../components/modals/StudyModals';
import { ThemeModal } from '../components/modals/ThemeModal';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { ProgressBar } from '../components/ui/ProgressBar';
import { daysUntil, formatDuration, formatLongDate, greeting, today } from '../lib/date';
import { dueCount, getBookProgress, getSubject, nextExam } from '../lib/selectors';
import { useApp } from '../state/AppProvider';
import { useSession } from '../state/SessionProvider';

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

const examLabel = (date: string): string => {
  const days = daysUntil(date);
  if (days <= 0) return 'hoy';
  if (days === 1) return 'mañana';
  return `en ${days} días`;
};

export default function Home() {
  const { data, actions, notify } = useApp();
  const { begin } = useSession();
  const navigate = useNavigate();
  const [taskOpen, setTaskOpen] = useState(false);
  const [habitOpen, setHabitOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [listening, setListening] = useState(false);

  const todayTasks = data.tasks
    .filter((task) => task.date === today())
    .sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'));
  const pendingCards = dueCount(data.cards);
  const exam = nextExam(data.blocks);
  const book = [...data.books].sort(
    (a, b) => new Date(b.lastReadAt ?? 0).getTime() - new Date(a.lastReadAt ?? 0).getTime(),
  )[0];
  const bookSubject = book ? getSubject(data.subjects, book.subjectId) : undefined;
  const progress = book ? getBookProgress(book) : 0;
  const todayHabits = data.habits;

  const startFocus = () => {
    begin({
      subjectId: book?.subjectId ?? data.subjects[0]?.id,
      bookId: book?.id,
    });
    navigate('/enfoque');
  };

  const saveQuickNote = () => {
    const content = quickNote.trim();
    if (!content) return;
    actions.addNote({
      title: content.slice(0, 48),
      content,
      subjectId: data.subjects[0]?.id ?? 'none',
      kind: 'note',
    });
    setQuickNote('');
    notify('Nota rápida guardada', 'check_circle');
  };

  const toggleMic = () => {
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      notify('El dictado no está disponible en este dispositivo', 'mic_off');
      return;
    }
    if (listening) {
      setListening(false);
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      setQuickNote((current) => `${current} ${transcript}`.trim());
    };
    recognition.onend = () => setListening(false);
    recognition.start();
    setListening(true);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="font-caption text-caption text-secondary">{formatLongDate()}</span>
          <h1 className="mt-0.5 font-headline-lg text-headline-lg text-on-surface">{greeting()}</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Cambiar paleta de color"
            onClick={() => setThemeOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-secondary transition-all hover:bg-surface-container hover:text-on-surface active:scale-95"
          >
            <Icon name="palette" size={22} />
          </button>
          <button
            type="button"
            aria-label="Estadísticas"
            onClick={() => navigate('/estadisticas')}
            className="flex h-10 w-10 items-center justify-center rounded-full text-secondary transition-all hover:bg-surface-container hover:text-on-surface active:scale-95"
          >
            <Icon name="bar_chart" size={22} />
          </button>
          <button
            type="button"
            aria-label="Ajustes"
            onClick={() => navigate('/ajustes')}
            className="flex h-10 w-10 items-center justify-center rounded-full text-secondary transition-all hover:bg-surface-container hover:text-on-surface active:scale-95"
          >
            <Icon name="tune" size={22} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <section className="relative flex flex-col gap-3 overflow-hidden rounded-xl bg-primary-fixed/40 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className="flex h-14 w-10 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg bg-surface-container-lowest p-1 text-center shadow-sm"
              style={{ color: bookSubject?.color }}
            >
              <Icon name={book?.icon ?? 'auto_stories'} size={16} />
              <span className="font-caption text-[9px] font-medium leading-tight text-secondary">
                {(bookSubject?.name ?? 'EST').slice(0, 4).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-headline-md text-headline-md text-on-surface">
                {book?.title ?? 'Tu próxima lectura'}
              </h2>
              <p className="mt-0.5 truncate font-caption text-caption text-secondary">
                {book
                  ? `${book.chapter ?? 'Continuar'} · pág. ${book.currentPage} de ${book.totalPages}`
                  : 'Importa un PDF para empezar a leer'}
              </p>
            </div>
          </div>
          <ProgressBar value={progress} height="h-1" />
          <div className="flex items-center justify-between pt-1">
            <Button
              size="sm"
              onClick={() => (book ? navigate(`/lector/${book.id}`) : navigate('/biblioteca'))}
              className="rounded-xl px-3.5"
            >
              {book ? 'Continuar' : 'Abrir biblioteca'}
            </Button>
            <div className="flex items-center gap-2">
              <span className="font-label-md text-[11px] font-medium text-tertiary">
                Estudiar {String(data.settings.pomodoroFocus).padStart(2, '0')}:00
              </span>
              <button
                type="button"
                aria-label="Iniciar estudio"
                onClick={startFocus}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary shadow-md transition-transform active:scale-90"
              >
                <Icon name="play_arrow" size={20} fill />
              </button>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="font-headline-md text-headline-md text-on-surface">Hoy</h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Añadir tarea"
                onClick={() => setTaskOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                <Icon name="add" size={18} />
              </button>
              <button
                type="button"
                onClick={() => navigate('/agenda')}
                className="flex items-center gap-0.5 font-label-md text-label-md text-tertiary hover:underline"
              >
                Ver agenda
                <Icon name="chevron_right" size={16} />
              </button>
            </div>
          </div>

          {todayTasks.length === 0 ? (
            <EmptyState
              icon="task_alt"
              title="Día despejado"
              description="Añade una tarea para dar forma a tu sesión de estudio."
              action={
                <Button size="sm" icon="add" onClick={() => setTaskOpen(true)}>
                  Nueva tarea
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-2">
              {todayTasks.map((task) => {
                const subject = getSubject(data.subjects, task.subjectId);
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3 shadow-sm transition-all"
                  >
                    <button
                      type="button"
                      aria-label={task.done ? 'Marcar como pendiente' : 'Marcar como completada'}
                      aria-pressed={task.done}
                      onClick={() => actions.toggleTask(task.id)}
                      className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full transition-all active:scale-90 ${
                        task.done ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-transparent'
                      }`}
                    >
                      <Icon name="check" size={15} className="font-semibold" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate font-body-md text-[14px] leading-tight ${
                          task.done ? 'text-secondary line-through' : 'text-on-surface'
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className="flex items-center gap-1 font-caption text-[12px] font-medium"
                          style={{ color: task.done ? undefined : subject.color }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: subject.color }} />
                          {subject.name}
                        </span>
                        <span className="font-caption text-[12px] text-secondary">
                          {task.time ? `· ${task.time}` : '· Sin hora'} · {formatDuration(task.durationMinutes)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="flex items-center justify-between rounded-xl bg-surface-container-low p-4 shadow-sm">
          <div className="flex flex-col">
            <span className="font-headline-lg text-[32px] font-semibold leading-none text-on-surface">
              {pendingCards}
            </span>
            <span className="mt-1 font-caption text-caption text-secondary">
              {pendingCards === 0 ? 'todo al día' : 'tarjetas pendientes'}
            </span>
          </div>
          <Button
            onClick={() => navigate(pendingCards > 0 ? '/repaso/all' : '/tarjetas')}
            icon={pendingCards === 0 ? 'check' : undefined}
          >
            {pendingCards === 0 ? 'Ver mazos' : 'Repasar'}
          </Button>
        </section>

        {exam && (
          <section className="flex flex-col gap-2.5 rounded-xl bg-surface-container-low p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Icon name="flag" size={20} className="text-primary" fill />
                <span className="truncate font-headline-md text-[15px] font-medium text-on-surface">
                  {getSubject(data.subjects, exam.subjectId).name} · {examLabel(exam.date)}
                </span>
              </div>
              <span className="shrink-0 font-caption text-caption text-secondary">
                Preparación: {exam.progress ?? 0}%
              </span>
            </div>
            <ProgressBar value={exam.progress ?? 0} height="h-1" />
          </section>
        )}

        <section className="flex flex-col">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-headline-md text-[16px] font-medium text-on-surface">Hábitos</h2>
            <button
              type="button"
              aria-label="Añadir hábito"
              onClick={() => setHabitOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-secondary hover:bg-surface-container"
            >
              <Icon name="add" size={17} />
            </button>
          </div>
          <div className="no-scrollbar -mx-1 flex items-center gap-3 overflow-x-auto px-1 pb-1">
            {todayHabits.map((habit) => {
              const done = habit.history.includes(today());
              return (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() => actions.toggleHabit(habit.id)}
                  className="group flex shrink-0 flex-col items-center gap-1.5 focus:outline-none"
                  aria-pressed={done}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full shadow-sm transition-all active:scale-95 ${
                      done ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-secondary'
                    }`}
                  >
                    <Icon name={habit.icon} size={20} />
                  </div>
                  <span className="font-caption text-[11px] font-medium text-secondary">{habit.name}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setHabitOpen(true)}
              className="flex shrink-0 flex-col items-center gap-1.5"
              aria-label="Crear hábito"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-outline-variant bg-surface-container-lowest text-secondary">
                <Icon name="add" size={20} />
              </span>
              <span className="font-caption text-[11px] text-secondary">Nuevo</span>
            </button>
          </div>
        </section>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            saveQuickNote();
          }}
          className="mt-1 flex items-center justify-between gap-2 rounded-full bg-surface-container-low px-4 py-2.5 shadow-sm transition-colors focus-within:bg-surface-container"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 text-secondary">
            <Icon name="edit_note" size={18} />
            <input
              value={quickNote}
              onChange={(event) => setQuickNote(event.target.value)}
              className="w-full border-0 bg-transparent p-0 font-body-md text-[14px] text-on-surface outline-none placeholder:text-secondary"
              placeholder={listening ? 'Escuchando…' : 'Escribe una nota rápida…'}
              type="text"
              aria-label="Nota rápida"
            />
          </div>
          <button
            type="button"
            aria-label={quickNote ? 'Guardar nota' : 'Dictar nota'}
            onClick={quickNote ? saveQuickNote : toggleMic}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
              listening ? 'animate-soft-pulse bg-primary text-on-primary' : 'text-secondary hover:text-primary'
            }`}
          >
            <Icon name={quickNote ? 'arrow_upward' : listening ? 'graphic_eq' : 'mic'} size={20} />
          </button>
        </form>
      </div>

      {taskOpen && <TaskModal open onClose={() => setTaskOpen(false)} />}
      {habitOpen && <HabitModal open onClose={() => setHabitOpen(false)} />}
      {themeOpen && <ThemeModal open onClose={() => setThemeOpen(false)} />}
    </div>
  );
}
