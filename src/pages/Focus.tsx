import { useState } from 'react';

import { StackPage } from '../components/layout/StackPage';
import { PomodoroModal } from '../components/modals/SettingsModals';
import { IconButton } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { Icon } from '../components/ui/Icon';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { formatDuration, formatTimer, today } from '../lib/date';
import { useApp } from '../state/AppProvider';
import { useSession } from '../state/SessionProvider';
import type { SessionMode } from '../types';

const AMBIENT_SOUNDS = [
  { id: 'Lluvia suave', label: 'Lluvia suave', detail: 'Gotas constantes', icon: 'rainy' },
  { id: 'Ruido marrón', label: 'Ruido marrón', detail: 'Enfoque profundo', icon: 'graphic_eq' },
  { id: 'Bosque', label: 'Bosque', detail: 'Hojas y pájaros', icon: 'forest' },
  { id: 'Silencio', label: 'Silencio', detail: 'Sin sonido', icon: 'volume_off' },
];

const RADIUS = 130;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Focus() {
  const { data, actions, notify } = useApp();
  const { session, begin, pause, resume, reset, skip, stop, setMode, setSubject, setBook } = useSession();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soundPlaying, setSoundPlaying] = useState(false);

  const focusSeconds = data.settings.pomodoroFocus * 60;
  const freeSeconds = 90 * 60;
  const idleTotal = session.mode === 'pomodoro' ? focusSeconds : freeSeconds;
  const total = session.active ? session.total : idleTotal;
  const remaining = session.active ? session.remaining : idleTotal;
  const progress =
    session.active && total > 0 ? Math.min(1, Math.max(0, (session.total - session.remaining) / total)) : 0;
  const todayLog = data.logs.find((log) => log.date === today());
  const sessionElapsed = session.active ? Math.max(0, session.total - session.remaining) : 0;
  const subjectBooks = data.books.filter((book) => book.subjectId === session.subjectId);
  const currentCycle =
    session.active && session.kind === 'focus' ? Math.min(session.cyclesDone, data.settings.cycles - 1) : -1;
  const statusLabel = session.active
    ? session.kind === 'break'
      ? 'Descanso'
      : 'Enfoque'
    : session.mode === 'pomodoro'
      ? 'Listo para empezar'
      : 'Tiempo libre';
  const statusDetail = session.active
    ? session.kind === 'break'
      ? 'Respira y suelta el esfuerzo'
      : `Ciclo ${Math.min(session.cyclesDone + 1, data.settings.cycles)} de ${data.settings.cycles}`
    : session.mode === 'pomodoro'
      ? `${data.settings.pomodoroFocus} min de enfoque · ${data.settings.pomodoroBreak} min de descanso`
      : 'Sin límite de tiempo · tú marcas el ritmo';

  const handlePrimary = () => {
    if (!session.active) {
      begin({
        subjectId: session.subjectId ?? data.subjects[0]?.id,
        bookId: session.bookId,
        mode: session.mode,
      });
      return;
    }
    if (session.running) pause();
    else resume();
  };

  const handleMode = (mode: SessionMode) => {
    if (mode === session.mode) return;
    if (session.active) stop();
    setMode(mode);
    notify(
      mode === 'pomodoro' ? 'Modo Pomodoro activado' : 'Modo libre activado',
      mode === 'pomodoro' ? 'timer' : 'all_inclusive',
    );
  };

  const chooseSound = (soundId: string) => {
    if (soundId === 'Silencio') {
      actions.updateSettings({ ambient: soundId });
      setSoundPlaying(false);
      notify('Sonido ambiente desactivado', 'volume_off');
      return;
    }
    const same = data.settings.ambient === soundId;
    actions.updateSettings({ ambient: soundId });
    setSoundPlaying(same ? !soundPlaying : true);
    notify(
      same && soundPlaying ? 'Sonido en pausa' : `Sonido ambiente: ${soundId}`,
      same && soundPlaying ? 'pause' : 'music_note',
    );
  };

  return (
    <StackPage
      title="Concentración"
      subtitle={session.active ? 'Sesión en curso' : 'Un bloque de calma a la vez'}
      right={<IconButton icon="tune" label="Ajustar temporizador Pomodoro" onClick={() => setSettingsOpen(true)} />}
      contentClassName="pb-10"
    >
      <div className="flex flex-col gap-5">
        <SegmentedControl
          ariaLabel="Modo de concentración"
          value={session.mode}
          onChange={handleMode}
          options={[
            { value: 'pomodoro', label: 'Pomodoro' },
            { value: 'free', label: 'Tiempo libre' },
          ]}
        />

        <section className="relative overflow-hidden rounded-3xl bg-surface-container-low px-4 py-6 shadow-sm">
          <div className="pointer-events-none absolute left-1/2 top-10 h-56 w-56 -translate-x-1/2 rounded-full bg-primary/5 blur-2xl" />
          <div className="relative mx-auto flex h-[292px] w-[292px] items-center justify-center">
            <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
              <circle
                cx="150"
                cy="150"
                r={RADIUS}
                fill="none"
                strokeWidth="7"
                className="stroke-surface-container-high"
              />
              <circle
                cx="150"
                cy="150"
                r={RADIUS}
                fill="none"
                strokeWidth="7"
                strokeLinecap="round"
                style={{
                  stroke: session.kind === 'break' ? 'rgb(var(--c-tertiary))' : 'rgb(var(--c-primary))',
                  strokeDasharray: CIRCUMFERENCE,
                  strokeDashoffset: CIRCUMFERENCE * (1 - progress),
                  transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s ease',
                }}
              />
            </svg>

            <div className="relative flex flex-col items-center">
              <span
                className={`mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-caption text-[10px] font-medium ${
                  session.active && session.kind === 'focus'
                    ? 'bg-primary-fixed text-primary'
                    : 'bg-surface-container text-secondary'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    session.running ? 'animate-pulse bg-primary' : 'bg-secondary/50'
                  }`}
                />
                {statusLabel}
              </span>
              <span className="font-headline-lg text-[56px] font-light leading-none tracking-tight text-on-surface tabular-nums">
                {formatTimer(remaining)}
              </span>
              <span className="mt-2 max-w-[190px] text-center font-caption text-[11px] leading-snug text-secondary">
                {statusDetail}
              </span>

              <div className="mt-4 flex items-center gap-1.5" aria-label="Ciclos de la sesión">
                {Array.from({ length: data.settings.cycles }, (_, index) => {
                  const completed = index < session.cyclesDone;
                  const current = index === currentCycle;
                  return (
                    <span
                      key={index}
                      className={`h-1.5 rounded-full transition-all ${
                        completed
                          ? 'w-5 bg-primary'
                          : current
                            ? 'w-5 animate-soft-pulse bg-primary/60'
                            : 'w-1.5 bg-surface-container-high'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="relative mt-2 flex items-center justify-center gap-5">
            <IconButton
              icon="restart_alt"
              label="Reiniciar temporizador"
              onClick={reset}
              disabled={!session.active}
              className="bg-surface-container-lowest shadow-sm"
            />
            <button
              type="button"
              onClick={handlePrimary}
              aria-label={session.active && session.running ? 'Pausar sesión' : 'Iniciar sesión'}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-on-primary shadow-primary-float transition-all hover:brightness-105 active:scale-90"
            >
              <Icon name={session.active && session.running ? 'pause' : 'play_arrow'} size={32} fill />
            </button>
            <IconButton
              icon="skip_next"
              label="Saltar al siguiente intervalo"
              onClick={skip}
              disabled={!session.active}
              className="bg-surface-container-lowest shadow-sm"
            />
          </div>

          {session.active && (
            <button
              type="button"
              onClick={() => {
                stop();
                notify('Sesión finalizada', 'stop_circle');
              }}
              className="relative mx-auto mt-4 flex items-center gap-1 font-caption text-[11px] text-secondary transition-colors hover:text-error"
            >
              <Icon name="stop_circle" size={14} />
              Finalizar sesión
            </button>
          )}
        </section>

        <section className="grid grid-cols-3 gap-2">
          {[
            { icon: 'today', label: 'Hoy', value: formatDuration(todayLog?.minutes ?? 0) },
            {
              icon: 'repeat',
              label: 'Ciclos',
              value: `${session.cyclesDone}/${data.settings.cycles}`,
            },
            {
              icon: 'bolt',
              label: 'En esta sesión',
              value: formatDuration(Math.round(sessionElapsed / 60)),
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center rounded-xl bg-surface-container-low px-1 py-3 text-center shadow-sm"
            >
              <Icon name={stat.icon} size={17} className="mb-1 text-primary" />
              <span className="truncate font-label-md text-[12px] font-semibold text-on-surface tabular-nums">
                {stat.value}
              </span>
              <span className="mt-0.5 font-caption text-[9px] text-secondary">{stat.label}</span>
            </div>
          ))}
        </section>

        <section className="rounded-2xl bg-surface-container-low p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline-md text-[15px] font-medium text-on-surface">¿Qué vas a estudiar?</h2>
              <p className="mt-0.5 font-caption text-[11px] text-secondary">Vincula la sesión a una asignatura</p>
            </div>
            <Icon name="school" size={20} className="text-primary" />
          </div>
          <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-0.5">
            {data.subjects.map((subject) => (
              <Chip
                key={subject.id}
                selected={session.subjectId === subject.id}
                dotColor={subject.color}
                onClick={() => {
                  setSubject(subject.id);
                  if (session.bookId) {
                    const book = data.books.find((entry) => entry.id === session.bookId);
                    if (book && book.subjectId !== subject.id) setBook(undefined);
                  }
                }}
              >
                {subject.name}
              </Chip>
            ))}
          </div>

          <label className="mt-3 flex items-center gap-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2">
            <Icon name="auto_stories" size={18} className="shrink-0 text-secondary" />
            <span className="min-w-0 flex-1">
              <span className="block font-caption text-[9px] uppercase tracking-wider text-secondary">
                Material de apoyo
              </span>
              <select
                value={session.bookId ?? ''}
                onChange={(event) => setBook(event.target.value || undefined)}
                disabled={subjectBooks.length === 0}
                aria-label="Libro vinculado a la sesión"
                className="w-full cursor-pointer appearance-none truncate border-0 bg-transparent p-0 pr-4 font-body-md text-[12px] text-on-surface outline-none disabled:text-secondary/70"
              >
                <option value="">Sin libro vinculado</option>
                {subjectBooks.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title}
                  </option>
                ))}
              </select>
            </span>
            <Icon name="expand_more" size={17} className="shrink-0 text-secondary" />
          </label>
        </section>

        <section className="rounded-2xl bg-surface-container-low p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline-md text-[15px] font-medium text-on-surface">Sonido ambiente</h2>
              <p className="mt-0.5 font-caption text-[11px] text-secondary">
                {soundPlaying ? `Reproduciendo ${data.settings.ambient}` : 'Elige tu paisaje sonoro'}
              </p>
            </div>
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                soundPlaying ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-secondary'
              }`}
            >
              <Icon name={soundPlaying ? 'graphic_eq' : 'music_note'} size={17} />
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {AMBIENT_SOUNDS.map((sound) => {
              const selected = data.settings.ambient === sound.id;
              return (
                <button
                  key={sound.id}
                  type="button"
                  onClick={() => chooseSound(sound.id)}
                  className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all active:scale-[0.98] ${
                    selected
                      ? 'border-primary/40 bg-primary-fixed/40'
                      : 'border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container'
                  }`}
                  aria-pressed={selected}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      selected ? 'bg-primary text-on-primary' : 'bg-surface-container text-secondary'
                    }`}
                  >
                    {selected && soundPlaying && sound.id !== 'Silencio' ? (
                      <span className="flex items-end gap-[2px]" aria-hidden="true">
                        {[6, 12, 8].map((height, index) => (
                          <span
                            key={index}
                            className="w-[2px] animate-soft-pulse rounded-full bg-on-primary"
                            style={{
                              height,
                              animationDelay: `${index * 0.18}s`,
                            }}
                          />
                        ))}
                      </span>
                    ) : (
                      <Icon name={sound.icon} size={17} />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-label-md text-[11px] font-medium text-on-surface">
                      {sound.label}
                    </span>
                    <span className="block truncate font-caption text-[9px] text-secondary">{sound.detail}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="flex items-start gap-3 rounded-xl bg-primary-fixed/30 p-3.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest text-primary">
            <Icon name="psychology" size={18} />
          </span>
          <p className="font-caption text-[11px] leading-snug text-secondary">
            El cambio de tarea tiene un coste. Antes de empezar, cierra las pestañas que no necesitas y deja el móvil
            fuera de la mesa.
          </p>
        </div>
      </div>

      {settingsOpen && <PomodoroModal open onClose={() => setSettingsOpen(false)} />}
    </StackPage>
  );
}
