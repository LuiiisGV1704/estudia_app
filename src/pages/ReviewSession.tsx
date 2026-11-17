import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { ProgressBar } from '../components/ui/ProgressBar';
import { formatTimer } from '../lib/date';
import { getDueCards, getSubject } from '../lib/selectors';
import { useApp } from '../state/AppProvider';
import type { Flashcard, Rating } from '../types';

const ratingDays: Record<Rating, number> = { again: 0, hard: 1, good: 3, easy: 7 };
const ratingFactor: Record<Rating, number> = { again: 0, hard: 1.2, good: 1.5, easy: 2.1 };

const timestamp = (): number => Date.now();

const ratingOptions: {
  value: Rating;
  label: string;
  icon: string;
  className: string;
}[] = [
  {
    value: 'again',
    label: 'Otra vez',
    icon: 'replay',
    className: 'bg-error-container text-on-error-container hover:brightness-95',
  },
  {
    value: 'hard',
    label: 'Difícil',
    icon: 'sentiment_dissatisfied',
    className: 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest',
  },
  {
    value: 'good',
    label: 'Bien',
    icon: 'sentiment_satisfied',
    className: 'bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed-dim',
  },
  {
    value: 'easy',
    label: 'Fácil',
    icon: 'sentiment_very_satisfied',
    className: 'bg-primary text-on-primary hover:brightness-105',
  },
];

const stateLabel: Record<Flashcard['state'], string> = {
  new: 'Nueva',
  learning: 'Aprendiendo',
  review: 'Repaso',
};

const previewInterval = (card: Flashcard, rating: Rating): string => {
  if (rating === 'again') return 'Ahora';
  const days = Math.max(ratingDays[rating], Math.round(Math.max(1, card.intervalDays) * ratingFactor[rating]));
  return days === 1 ? '1 día' : `${days} días`;
};

function ReviewHeader({
  title,
  subtitle,
  progress,
  counter,
  onClose,
}: {
  title: string;
  subtitle: string;
  progress: number;
  counter: string;
  onClose: () => void;
}) {
  return (
    <header className="safe-top fixed inset-x-0 top-0 z-40 bg-surface/90 shadow-soft backdrop-blur-xl">
      <div className="mx-auto max-w-[560px] px-margin">
        <div className="flex h-14 items-center gap-2.5">
          <button
            type="button"
            aria-label="Cerrar sesión de repaso"
            onClick={onClose}
            className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container active:scale-95"
          >
            <Icon name="close" size={22} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-headline-md text-[15px] font-medium text-on-surface">{title}</h1>
            <p className="truncate font-caption text-[10px] text-secondary">{subtitle}</p>
          </div>
          <span className="shrink-0 rounded-full bg-surface-container px-2.5 py-1 font-label-md text-[11px] font-medium text-secondary tabular-nums">
            {counter}
          </span>
        </div>
        <ProgressBar value={progress} height="h-1" className="mb-3" />
      </div>
    </header>
  );
}

export default function ReviewSession() {
  const { deckId = 'all' } = useParams();
  const { data, actions } = useApp();
  const navigate = useNavigate();

  const deck = deckId === 'all' ? undefined : data.decks.find((entry) => entry.id === deckId);
  const deckExists = deckId === 'all' || Boolean(deck);
  const scopedCards = data.cards.filter((card) => deckId === 'all' || card.deckId === deckId);
  const dueCards = getDueCards(data.cards, deckId);

  const [queue, setQueue] = useState<Flashcard[]>(() => (dueCards.length > 0 ? dueCards : scopedCards));
  const [practiceMode, setPracticeMode] = useState(() => dueCards.length === 0);
  const [initialDue, setInitialDue] = useState(dueCards.length);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState<Record<Rating, number>>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });
  const [startedAt, setStartedAt] = useState(timestamp);
  const [elapsed, setElapsed] = useState(0);

  const current = queue[index];
  const currentDeck = current ? data.decks.find((entry) => entry.id === current.deckId) : undefined;
  const currentSubject = getSubject(data.subjects, currentDeck?.subjectId);
  const title = deckId === 'all' ? 'Repaso global' : (deck?.name ?? 'Mazo no encontrado');
  const subtitle =
    deckId === 'all'
      ? `${data.decks.length} mazos · ${queue.length} tarjetas`
      : `${currentSubject.name} · ${practiceMode ? 'modo práctica' : `${initialDue} pendientes`}`;
  const progress = finished ? 100 : queue.length === 0 ? 0 : Math.round((index / queue.length) * 100);
  const counter = `${Math.min(queue.length, finished ? queue.length : index + 1)}/${queue.length}`;
  const totalAnswered = results.again + results.hard + results.good + results.easy;
  const accuracy = totalAnswered === 0 ? 0 : Math.round(((totalAnswered - results.again) / totalAnswered) * 100);

  const close = () => navigate('/tarjetas');

  const answer = (rating: Rating) => {
    if (!current) return;
    actions.rateCard(current.id, rating);
    setResults((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));
    if (index + 1 >= queue.length) {
      setElapsed(Math.max(1, Math.round((timestamp() - startedAt) / 1000)));
      setFinished(true);
    } else {
      setIndex((currentIndex) => currentIndex + 1);
      setRevealed(false);
      setHintShown(false);
    }
  };

  const startAgain = () => {
    const refreshed = data.cards.filter((card) => deckId === 'all' || card.deckId === deckId);
    const refreshedDue = getDueCards(data.cards, deckId);
    setQueue(refreshedDue.length > 0 ? refreshedDue : refreshed);
    setPracticeMode(refreshedDue.length === 0);
    setInitialDue(refreshedDue.length);
    setIndex(0);
    setRevealed(false);
    setHintShown(false);
    setFinished(false);
    setResults({ again: 0, hard: 0, good: 0, easy: 0 });
    setStartedAt(Date.now());
    setElapsed(0);
  };

  if (!deckExists) {
    return (
      <div className="min-h-dvh bg-surface">
        <ReviewHeader
          title="Mazo no encontrado"
          subtitle="Vuelve a tus mazos para elegir otro"
          progress={0}
          counter="0/0"
          onClose={close}
        />
        <main
          className="mx-auto w-full max-w-[560px] px-margin"
          style={{
            paddingTop: 'calc(5.5rem + env(safe-area-inset-top, 0px))',
            paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <EmptyState
            icon="search_off"
            title="Este mazo ya no existe"
            description="Puede que lo hayas eliminado. Tus demás mazos siguen esperándote."
            action={
              <Button icon="style" onClick={close}>
                Volver a tarjetas
              </Button>
            }
          />
        </main>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="min-h-dvh bg-surface">
        <ReviewHeader title={title} subtitle="Sin tarjetas para repasar" progress={0} counter="0/0" onClose={close} />
        <main
          className="mx-auto w-full max-w-[560px] px-margin"
          style={{
            paddingTop: 'calc(5.5rem + env(safe-area-inset-top, 0px))',
            paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <EmptyState
            icon="style"
            title="Este mazo está vacío"
            description="Añade tarjetas desde la pantalla de Tarjetas y vuelve cuando quieras practicar."
            action={
              <Button icon="arrow_back" onClick={close}>
                Ir a Tarjetas
              </Button>
            }
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface">
      <ReviewHeader title={title} subtitle={subtitle} progress={progress} counter={counter} onClose={close} />

      <main
        className="mx-auto w-full max-w-[560px] px-margin"
        style={{
          paddingTop: 'calc(5.5rem + env(safe-area-inset-top, 0px))',
          paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {finished ? (
          <div className="flex animate-pop-in flex-col items-center pt-6 text-center">
            <div className="relative mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary-fixed">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary text-on-primary shadow-primary-float">
                <Icon name="celebration" size={32} fill />
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Sesión completada</h1>
            <p className="mt-1 max-w-[290px] font-caption text-[12px] leading-snug text-secondary">
              Has repasado {totalAnswered} {totalAnswered === 1 ? 'tarjeta' : 'tarjetas'}. Ese pequeño esfuerzo de hoy
              es memoria mañana.
            </p>

            <div className="mt-5 grid w-full grid-cols-3 gap-2">
              {[
                { label: 'Repasadas', value: String(totalAnswered) },
                { label: 'Precisión', value: `${accuracy}%` },
                { label: 'Tiempo', value: formatTimer(elapsed) },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-surface-container-low px-2 py-3 shadow-sm">
                  <p className="font-headline-md text-[18px] font-semibold text-on-surface tabular-nums">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 font-caption text-[9px] uppercase tracking-wide text-secondary">{stat.label}</p>
                </div>
              ))}
            </div>

            <section className="mt-3 w-full rounded-xl bg-surface-container-low p-3.5 text-left shadow-sm">
              <p className="mb-2 font-label-md text-[11px] font-medium uppercase tracking-wider text-secondary">
                Desglose del repaso
              </p>
              <div className="space-y-2">
                {ratingOptions.map((option) => {
                  const dotColor: Record<Rating, string> = {
                    again: 'bg-error',
                    hard: 'bg-tertiary',
                    good: 'bg-primary/60',
                    easy: 'bg-primary',
                  };
                  return (
                    <div key={option.value} className="flex items-center gap-2.5">
                      <span className={`h-2 w-2 rounded-full ${dotColor[option.value]}`} />
                      <span className="flex-1 font-body-md text-[12px] text-on-surface">{option.label}</span>
                      <span className="font-label-md text-[12px] font-medium text-secondary tabular-nums">
                        {results[option.value]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="mt-4 flex w-full flex-col gap-2">
              <Button fullWidth size="lg" icon="refresh" onClick={startAgain}>
                Repasar otra vez
              </Button>
              <Button fullWidth variant="surface" icon="style" onClick={close}>
                Volver a tarjetas
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: currentSubject.color }} />
                <span className="font-caption text-[11px] font-medium text-secondary">
                  {currentDeck?.name ?? 'Repaso global'}
                </span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 font-caption text-[10px] font-medium ${
                  current?.state === 'new'
                    ? 'bg-primary-fixed text-on-primary-fixed'
                    : 'bg-surface-container text-secondary'
                }`}
              >
                {current ? stateLabel[current.state] : ''}
              </span>
            </div>

            {current && (
              <div
                key={current.id}
                className="flex min-h-[390px] animate-pop-in flex-col rounded-2xl bg-surface-container-lowest p-5 shadow-float"
              >
                <div className="flex-1">
                  <p className="font-caption text-[9px] uppercase tracking-[0.18em] text-secondary">Pregunta</p>
                  <h2 className="mt-3 font-headline-lg text-[22px] font-medium leading-snug text-on-surface">
                    {current.question}
                  </h2>

                  {!revealed && current.hint && (
                    <div className="mt-4">
                      {hintShown ? (
                        <div className="flex items-start gap-2 rounded-xl bg-primary-fixed/40 px-3 py-2.5 animate-fade-in">
                          <Icon name="lightbulb" size={16} className="mt-0.5 text-primary" />
                          <p className="font-caption text-[11px] leading-snug text-on-surface-variant">
                            {current.hint}
                          </p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setHintShown(true)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5 font-label-md text-[11px] font-medium text-secondary transition-colors hover:bg-surface-container-high"
                        >
                          <Icon name="lightbulb" size={14} />
                          Mostrar pista
                        </button>
                      )}
                    </div>
                  )}

                  {revealed && (
                    <div className="mt-5 animate-fade-in border-t border-outline-variant/30 pt-4">
                      <p className="font-caption text-[9px] uppercase tracking-[0.18em] text-secondary">Respuesta</p>
                      <p className="mt-2 font-body-md text-[15px] leading-relaxed text-on-surface">{current.answer}</p>
                      {current.keyPoint && (
                        <div className="mt-3 flex items-start gap-2 rounded-xl bg-primary-fixed/40 p-3">
                          <Icon name="bolt" size={16} className="mt-0.5 text-primary" fill />
                          <p className="font-caption text-[11px] leading-snug text-on-surface-variant">
                            {current.keyPoint}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!revealed ? (
                  <div className="mt-5">
                    <Button fullWidth size="lg" icon="visibility" onClick={() => setRevealed(true)}>
                      Mostrar respuesta
                    </Button>
                    <p className="mt-2 text-center font-caption text-[10px] text-secondary">
                      Intenta recordarlo antes de mirar
                    </p>
                  </div>
                ) : (
                  <div className="mt-5">
                    <p className="mb-2 text-center font-caption text-[10px] text-secondary">¿Qué tal lo recordaste?</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {ratingOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => answer(option.value)}
                          className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2.5 transition-all active:scale-95 ${option.className}`}
                        >
                          <Icon name={option.icon} size={17} />
                          <span className="font-label-md text-[10px] font-medium">{option.label}</span>
                          <span className="font-caption text-[8px] opacity-70">
                            {previewInterval(current, option.value)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-3.5 py-2.5">
              <div className="flex items-center gap-1.5">
                <Icon name="filter_alt" size={14} className="text-secondary" />
                <span className="font-caption text-[10px] text-secondary">
                  {practiceMode ? 'Modo práctica · sin tarjetas vencidas' : 'Repaso del día'}
                </span>
              </div>
              <span className="font-caption text-[10px] text-secondary">
                {Math.max(0, queue.length - index - 1)} restantes
              </span>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl bg-surface-container p-3">
              <Icon name="psychology" size={16} className="mt-0.5 text-primary" />
              <p className="font-caption text-[10px] leading-snug text-secondary">
                Sé honesto con la calificación. El algoritmo necesita saber qué recuerdas de verdad para programar el
                próximo repaso.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
