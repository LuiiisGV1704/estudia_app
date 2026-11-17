import { useState } from 'react';

import { useApp } from '../../state/AppProvider';
import { Button } from '../ui/Button';
import { Field, Select, TextArea, TextInput } from '../ui/Field';
import { Modal } from '../ui/Modal';

interface DeckModalProps {
  open: boolean;
  onClose: () => void;
}

export function DeckModal({ open, onClose }: DeckModalProps) {
  const { data, actions, notify } = useApp();
  const [name, setName] = useState('');
  const [subjectId, setSubjectId] = useState(data.subjects[0]?.id ?? '');

  const save = () => {
    if (!name.trim()) {
      notify('Escribe un nombre para el mazo', 'error');
      return;
    }
    actions.addDeck(name.trim(), subjectId);
    notify('Mazo creado', 'library_add');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo mazo"
      subtitle="Agrupa tarjetas de una misma asignatura"
      icon="style"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} icon="check">
            Crear mazo
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nombre del mazo">
          <TextInput
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Anatomía: nervios craneales"
          />
        </Field>
        <Field label="Asignatura">
          <Select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
            {data.subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-start gap-2 rounded-xl bg-primary-fixed/40 px-3 py-2.5">
          <span className="material-symbols-outlined mt-0.5 text-[16px] text-primary">bolt</span>
          <p className="font-caption text-[11px] leading-snug text-on-surface-variant">
            Las tarjetas nuevas se programarán con el algoritmo{' '}
            <strong className="font-medium">{data.settings.algorithm}</strong>.
          </p>
        </div>
      </div>
    </Modal>
  );
}

interface CardModalProps {
  open: boolean;
  onClose: () => void;
  deckId?: string;
  initialQuestion?: string;
}

export function CardModal({ open, onClose, deckId, initialQuestion }: CardModalProps) {
  const { data, actions, notify } = useApp();
  const [selectedDeck, setSelectedDeck] = useState(deckId ?? data.decks[0]?.id ?? '');
  const [question, setQuestion] = useState(initialQuestion ?? '');
  const [answer, setAnswer] = useState('');
  const [hint, setHint] = useState('');
  const [keyPoint, setKeyPoint] = useState('');

  const save = () => {
    if (!selectedDeck) {
      notify('Crea primero un mazo', 'error');
      return;
    }
    if (!question.trim() || !answer.trim()) {
      notify('Completa la pregunta y la respuesta', 'error');
      return;
    }
    actions.addCard({
      deckId: selectedDeck,
      question: question.trim(),
      answer: answer.trim(),
      hint: hint.trim() || undefined,
      keyPoint: keyPoint.trim() || undefined,
    });
    notify('Tarjeta añadida al mazo', 'note_add');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva tarjeta"
      subtitle="Pregunta breve, respuesta clara"
      icon="note_add"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} icon="check" disabled={data.decks.length === 0}>
            Guardar
          </Button>
        </>
      }
    >
      {data.decks.length === 0 ? (
        <div className="rounded-xl bg-surface-container-low p-4 text-center">
          <p className="font-body-md text-[14px] text-on-surface">Todavía no tienes mazos.</p>
          <p className="mt-1 font-caption text-[12px] text-secondary">
            Crea un mazo y vuelve para añadir tu primera tarjeta.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <Field label="Mazo">
            <Select value={selectedDeck} onChange={(event) => setSelectedDeck(event.target.value)}>
              {data.decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Pregunta">
            <TextArea
              autoFocus
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="¿Cuál es el origen de…?"
              className="min-h-[78px]"
            />
          </Field>
          <Field label="Respuesta">
            <TextArea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Escribe una respuesta corta y precisa"
              className="min-h-[92px]"
            />
          </Field>
          <Field label="Pista (opcional)">
            <TextInput
              value={hint}
              onChange={(event) => setHint(event.target.value)}
              placeholder="Una pista que active la memoria"
            />
          </Field>
          <Field label="Clave de examen (opcional)">
            <TextInput
              value={keyPoint}
              onChange={(event) => setKeyPoint(event.target.value)}
              placeholder="Un dato de alto rendimiento"
            />
          </Field>
        </div>
      )}
    </Modal>
  );
}
