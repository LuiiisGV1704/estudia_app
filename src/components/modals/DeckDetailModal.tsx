import { getDeckStats, getSubject } from '../../lib/selectors';
import { useApp } from '../../state/AppProvider';
import type { Deck } from '../../types';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { ProgressBar } from '../ui/ProgressBar';

interface DeckDetailModalProps {
  deck: Deck;
  onClose: () => void;
  onAddCard: (deckId: string) => void;
  onStudy: (deckId: string) => void;
}

const stateLabel: Record<string, string> = {
  new: 'Nueva',
  learning: 'Aprendiendo',
  review: 'Repaso',
};

export function DeckDetailModal({ deck, onClose, onAddCard, onStudy }: DeckDetailModalProps) {
  const { data } = useApp();
  const subject = getSubject(data.subjects, deck.subjectId);
  const cards = data.cards.filter((card) => card.deckId === deck.id);
  const stats = getDeckStats(deck, data.cards);

  return (
    <Modal
      open
      onClose={onClose}
      title={deck.name}
      subtitle={`${subject.name} · ${stats.total} tarjetas`}
      icon={subject.icon}
      footer={
        <div className="flex w-full gap-2">
          <Button variant="surface" className="flex-1" icon="note_add" onClick={() => onAddCard(deck.id)}>
            Añadir tarjeta
          </Button>
          <Button className="flex-1" icon="play_arrow" onClick={() => onStudy(deck.id)}>
            Estudiar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-surface-container-low p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-label-md text-[12px] font-medium text-on-surface">Dominio del mazo</span>
            <span className="font-headline-md text-[15px] font-semibold text-primary">{stats.mastery}%</span>
          </div>
          <ProgressBar value={stats.mastery} height="h-1.5" />
          <div className="mt-2.5 flex items-center gap-2">
            <span className="rounded-full bg-primary-fixed px-2 py-0.5 font-caption text-[10px] font-medium text-on-primary-fixed">
              {stats.new} nuevas
            </span>
            <span className="rounded-full bg-surface-container-high px-2 py-0.5 font-caption text-[10px] font-medium text-on-surface-variant">
              {stats.learning} en aprendizaje
            </span>
            <span className="rounded-full bg-surface-container px-2 py-0.5 font-caption text-[10px] font-medium text-secondary">
              {stats.review} en repaso
            </span>
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl bg-surface-container-low px-4 py-8 text-center">
            <Icon name="note_add" size={28} className="text-secondary" />
            <p className="mt-2 font-body-md text-[14px] text-on-surface">Este mazo está vacío</p>
            <p className="mt-1 font-caption text-[12px] text-secondary">
              Añade tu primera pregunta para empezar a repasar.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl bg-surface-container-low">
            {cards.map((card, index) => (
              <div key={card.id}>
                <div className="flex items-start gap-2.5 px-3 py-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-body-md text-[13px] leading-snug text-on-surface">
                      {card.question}
                    </p>
                    <p className="mt-1 font-caption text-[10px] text-secondary">
                      {stateLabel[card.state]} · vence {card.due}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 font-caption text-[9px] font-medium ${
                      card.state === 'new'
                        ? 'bg-primary-fixed text-on-primary-fixed'
                        : card.state === 'learning'
                          ? 'bg-surface-container-high text-on-surface-variant'
                          : 'bg-surface-container text-secondary'
                    }`}
                  >
                    {stateLabel[card.state]}
                  </span>
                </div>
                {index < cards.length - 1 && <div className="ml-7 h-px bg-outline-variant/30" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
