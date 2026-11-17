import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { DeckDetailModal } from '../components/modals/DeckDetailModal';
import { CardModal, DeckModal } from '../components/modals/FlashcardModals';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { ProgressBar } from '../components/ui/ProgressBar';
import { dueCount, getDeckStats, getSubject } from '../lib/selectors';
import { useApp } from '../state/AppProvider';
import type { Deck } from '../types';

export default function Tarjetas() {
  const { data, notify } = useApp();
  const navigate = useNavigate();
  const [sortMode, setSortMode] = useState<'priority' | 'mastery'>('priority');
  const [deckDetail, setDeckDetail] = useState<Deck | null>(null);
  const [deckOpen, setDeckOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [cardDeckId, setCardDeckId] = useState<string | undefined>();
  const [fabOpen, setFabOpen] = useState(false);

  const pending = dueCount(data.cards);
  const decks = [...data.decks].sort((a, b) => {
    if (sortMode === 'mastery') {
      return getDeckStats(a, data.cards).mastery - getDeckStats(b, data.cards).mastery;
    }
    return getDeckStats(b, data.cards).due - getDeckStats(a, data.cards).due;
  });

  const openNewCard = () => {
    if (data.decks.length === 0) {
      notify('Crea primero un mazo para añadir tarjetas', 'info');
      setDeckOpen(true);
      return;
    }
    setCardDeckId(undefined);
    setCardOpen(true);
  };

  return (
    <div className="flex flex-col gap-5 pb-8">
      <section className="relative overflow-hidden rounded-xl bg-primary-fixed/40 p-5 text-center shadow-sm">
        <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-primary/5" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-surface/80 px-3 py-1 text-primary shadow-sm">
            <Icon name="bolt" size={15} fill />
            <span className="font-label-md text-[12px] font-medium">Meta diaria</span>
          </div>
          <span className="mb-1 font-headline-lg text-[52px] font-light leading-[54px] tracking-tight text-primary">
            {pending}
          </span>
          <p className="mb-5 font-label-md text-label-md text-secondary">
            {pending === 0 ? 'todo al día por hoy' : 'tarjetas pendientes para hoy'}
          </p>
          <Button
            fullWidth
            size="lg"
            icon="style"
            onClick={() => navigate(pending > 0 ? '/repaso/all' : `/repaso/${data.decks[0]?.id ?? 'all'}`)}
            className="font-body-md"
          >
            {pending === 0 ? 'Practicar de todos modos' : 'Repasar ahora'}
          </Button>
        </div>
      </section>

      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <h2 className="font-headline-md text-headline-md text-on-surface">Mazos de estudio</h2>
          <span className="h-1.5 w-1.5 rounded-full bg-secondary/40" />
          <span className="font-caption text-caption text-secondary">
            {data.decks.length} {data.decks.length === 1 ? 'mazo' : 'mazos'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSortMode((current) => (current === 'priority' ? 'mastery' : 'priority'))}
          className="flex items-center gap-1 font-caption text-caption text-secondary transition-colors hover:text-on-surface"
          aria-label="Cambiar orden de los mazos"
        >
          <Icon name="swap_vert" size={16} />
          {sortMode === 'priority' ? 'Prioridad' : 'Dominio'}
        </button>
      </div>

      {decks.length === 0 ? (
        <EmptyState
          icon="style"
          title="Todavía no hay mazos"
          description="Crea tu primer mazo y convierte tus apuntes en preguntas activas."
          action={
            <Button icon="add" onClick={() => setDeckOpen(true)}>
              Nuevo mazo
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {decks.map((deck) => {
            const subject = getSubject(data.subjects, deck.subjectId);
            const stats = getDeckStats(deck, data.cards);
            return (
              <article
                key={deck.id}
                onClick={() => setDeckDetail(deck)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') setDeckDetail(deck);
                }}
                role="button"
                tabIndex={0}
                className="cursor-pointer rounded-xl bg-surface-container-low p-4 shadow-sm transition-shadow hover:shadow-md active:scale-[0.995]"
              >
                <div className="mb-2.5 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col">
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: subject.color }} />
                      <span className="font-caption text-[12px] text-secondary">{subject.name}</span>
                    </div>
                    <h3 className="truncate font-body-md text-body-md font-medium text-on-surface">{deck.name}</h3>
                  </div>
                  <Icon name="chevron_right" size={20} className="mt-0.5 shrink-0 text-secondary" />
                </div>
                <div className="mb-3 flex flex-wrap items-center gap-2 py-1 font-label-md">
                  <span
                    className={`rounded-full px-2 py-0.5 font-caption text-[11px] font-medium ${
                      stats.new > 0 ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container text-secondary'
                    }`}
                  >
                    {stats.new} nuevas
                  </span>
                  <span className="rounded-full bg-surface-container-high px-2 py-0.5 font-caption text-[11px] font-medium text-on-surface-variant">
                    {stats.learning} en aprendizaje
                  </span>
                  <span className="rounded-full bg-surface-container px-2 py-0.5 font-caption text-[11px] font-medium text-secondary">
                    {stats.review} repaso
                  </span>
                </div>
                <ProgressBar value={stats.mastery} height="h-1.5" className="mb-2" />
                <div className="flex items-center justify-between font-caption text-caption text-secondary">
                  <span>{stats.mastery}% dominado</span>
                  <span>{stats.total} tarjetas en total</span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3 rounded-xl bg-surface-container p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-primary">
          <Icon name="psychology" size={18} />
        </div>
        <p className="font-caption text-caption leading-snug text-secondary">
          La memoria a largo plazo florece cuando repasas en el límite del olvido. Tómate 10 minutos conscientes.
        </p>
      </div>

      {fabOpen && (
        <div
          className="fixed right-5 z-40 flex animate-pop-in flex-col items-end gap-2"
          style={{ bottom: 'calc(198px + env(safe-area-inset-bottom, 0px))' }}
        >
          <button
            type="button"
            onClick={() => {
              setFabOpen(false);
              setDeckOpen(true);
            }}
            className="flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2.5 font-label-md text-[12px] font-medium text-on-surface shadow-float active:scale-95"
          >
            <Icon name="library_add" size={17} className="text-primary" />
            Nuevo mazo
          </button>
          <button
            type="button"
            onClick={() => {
              setFabOpen(false);
              openNewCard();
            }}
            className="flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2.5 font-label-md text-[12px] font-medium text-on-surface shadow-float active:scale-95"
          >
            <Icon name="note_add" size={17} className="text-primary" />
            Nueva tarjeta
          </button>
        </div>
      )}

      <div
        className="fixed right-5 z-40 flex flex-col items-end gap-2"
        style={{ bottom: 'calc(130px + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          type="button"
          aria-label={fabOpen ? 'Cerrar creación rápida' : 'Crear nuevo contenido'}
          onClick={() => setFabOpen((current) => !current)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-primary-float transition-all hover:brightness-105 active:scale-90"
        >
          <Icon name={fabOpen ? 'close' : 'add'} size={28} />
        </button>
      </div>

      {deckOpen && <DeckModal open onClose={() => setDeckOpen(false)} />}
      {cardOpen && <CardModal open deckId={cardDeckId} onClose={() => setCardOpen(false)} />}
      {deckDetail && (
        <DeckDetailModal
          deck={deckDetail}
          onClose={() => setDeckDetail(null)}
          onAddCard={(deckId) => {
            setDeckDetail(null);
            setCardDeckId(deckId);
            setCardOpen(true);
          }}
          onStudy={(deckId) => {
            setDeckDetail(null);
            navigate(`/repaso/${deckId}`);
          }}
        />
      )}
    </div>
  );
}
