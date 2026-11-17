import { useState } from 'react';

import { cn } from '../../lib/cn';
import { HABIT_ICONS, SUBJECT_COLORS, SUBJECT_ICONS } from '../../lib/constants';
import { today } from '../../lib/date';
import { useApp } from '../../state/AppProvider';
import type { BlockKind, Subject } from '../../types';
import { Button } from '../ui/Button';
import { ColorSwatches, Field, Select, TextArea, TextInput } from '../ui/Field';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';

const durations = [10, 15, 20, 25, 30, 45, 60, 75, 90, 120];

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
}

export function TaskModal({ open, onClose, defaultDate }: TaskModalProps) {
  const { data, actions, notify } = useApp();
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(data.subjects[0]?.id ?? '');
  const [date, setDate] = useState(defaultDate ?? today());
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(30);

  const save = () => {
    if (!title.trim()) {
      notify('Escribe un título para la tarea', 'error');
      return;
    }
    actions.addTask({
      title: title.trim(),
      subjectId,
      date,
      time: time || undefined,
      durationMinutes: duration,
    });
    notify('Tarea añadida a tu agenda', 'task_alt');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva tarea"
      subtitle="Añádela al plan de hoy o a otro día"
      icon="task_alt"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} icon="check">
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Título">
          <TextInput
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ej. Resumen de osteología"
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
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha">
            <TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </Field>
          <Field label="Hora (opcional)">
            <TextInput type="time" value={time} onChange={(event) => setTime(event.target.value)} />
          </Field>
        </div>
        <Field label="Duración estimada">
          <Select value={duration} onChange={(event) => setDuration(Number(event.target.value))}>
            {durations.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes < 60 ? `${minutes} min` : `${minutes / 60} h`}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}

interface BlockModalProps {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
}

export function BlockModal({ open, onClose, defaultDate }: BlockModalProps) {
  const { data, actions, notify } = useApp();
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(data.subjects[0]?.id ?? '');
  const [date, setDate] = useState(defaultDate ?? today());
  const [start, setStart] = useState('');
  const [duration, setDuration] = useState(60);
  const [kind, setKind] = useState<BlockKind>('study');
  const [notes, setNotes] = useState('');
  const [progress, setProgress] = useState(0);

  const save = () => {
    if (!title.trim()) {
      notify('Ponle un nombre al bloque', 'error');
      return;
    }
    actions.addBlock({
      title: title.trim(),
      subjectId,
      date,
      start: start || undefined,
      durationMinutes: duration,
      kind,
      notes: notes.trim() || undefined,
      progress: kind === 'exam' ? Math.min(100, Math.max(0, progress)) : undefined,
    });
    notify(kind === 'exam' ? 'Examen añadido a la agenda' : 'Bloque de estudio añadido', 'event_available');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo bloque de estudio"
      subtitle="Organiza enfoque, repasos o exámenes"
      icon="edit_calendar"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} icon="check">
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Título">
          <TextInput
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ej. Repaso de fisiología"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo">
            <Select value={kind} onChange={(event) => setKind(event.target.value as BlockKind)}>
              <option value="study">Estudio</option>
              <option value="review">Repaso</option>
              <option value="exam">Examen</option>
            </Select>
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
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha">
            <TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </Field>
          <Field label="Hora">
            <TextInput type="time" value={start} onChange={(event) => setStart(event.target.value)} />
          </Field>
        </div>
        <p className="-mt-2 font-caption text-[11px] text-secondary">
          Si dejas la hora vacía, el bloque aparecerá en «Sin hora asignada».
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Duración">
            <Select value={duration} onChange={(event) => setDuration(Number(event.target.value))}>
              {durations.concat(180).map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes < 60 ? `${minutes} min` : `${minutes / 60} h`}
                </option>
              ))}
            </Select>
          </Field>
          {kind === 'exam' && (
            <Field label="Preparación (%)">
              <TextInput
                type="number"
                min={0}
                max={100}
                value={progress}
                onChange={(event) => setProgress(Number(event.target.value))}
              />
            </Field>
          )}
        </div>
        <Field label="Notas (opcional)">
          <TextArea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Páginas, temas o recordatorios…"
            className="min-h-[76px]"
          />
        </Field>
      </div>
    </Modal>
  );
}

interface HabitModalProps {
  open: boolean;
  onClose: () => void;
}

export function HabitModal({ open, onClose }: HabitModalProps) {
  const { actions, notify } = useApp();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(HABIT_ICONS[0]);

  const save = () => {
    if (!name.trim()) {
      notify('Ponle un nombre al hábito', 'error');
      return;
    }
    actions.addHabit(name.trim(), icon);
    notify('Hábito creado', 'check_circle');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo hábito"
      subtitle="Pequeños gestos, grandes rachas"
      icon="checklist"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} icon="check">
            Crear
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nombre">
          <TextInput
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Meditar 10 min"
          />
        </Field>
        <Field label="Icono">
          <div className="mt-1 grid grid-cols-4 gap-2">
            {HABIT_ICONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setIcon(item)}
                className={cn(
                  'flex h-12 items-center justify-center rounded-xl transition-all active:scale-95',
                  icon === item
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-secondary hover:bg-surface-container-high',
                )}
                aria-label={`Icono ${item}`}
                aria-pressed={icon === item}
              >
                <Icon name={item} size={22} />
              </button>
            ))}
          </div>
        </Field>
      </div>
    </Modal>
  );
}

interface SubjectFormModalProps {
  open: boolean;
  onClose: () => void;
  subject?: Subject;
}

export function SubjectFormModal({ open, onClose, subject }: SubjectFormModalProps) {
  const { actions, notify } = useApp();
  const [name, setName] = useState(subject?.name ?? '');
  const [color, setColor] = useState(subject?.color ?? SUBJECT_COLORS[1]);
  const [icon, setIcon] = useState(subject?.icon ?? SUBJECT_ICONS[0]);

  const save = () => {
    if (!name.trim()) {
      notify('Escribe el nombre de la asignatura', 'error');
      return;
    }
    if (subject) {
      actions.updateSubject(subject.id, { name: name.trim(), color, icon });
      notify('Asignatura actualizada', 'palette');
    } else {
      actions.addSubject({ name: name.trim(), color, icon });
      notify('Asignatura creada', 'add_circle');
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={subject ? 'Editar asignatura' : 'Nueva asignatura'}
      subtitle="Color e icono te ayudarán a reconocerla"
      icon="school"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} icon="check">
            {subject ? 'Guardar' : 'Crear'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nombre">
          <TextInput
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Histología"
          />
        </Field>
        <Field label="Color">
          <ColorSwatches colors={SUBJECT_COLORS} value={color} onChange={setColor} />
        </Field>
        <Field label="Icono">
          <div className="mt-1 grid grid-cols-4 gap-2">
            {SUBJECT_ICONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setIcon(item)}
                className={cn(
                  'flex h-12 items-center justify-center rounded-xl transition-all active:scale-95',
                  icon === item
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-secondary hover:bg-surface-container-high',
                )}
                aria-label={`Icono ${item}`}
                aria-pressed={icon === item}
              >
                <Icon name={item} size={22} />
              </button>
            ))}
          </div>
        </Field>
        <div className="flex items-center gap-2 rounded-xl bg-surface-container px-3 py-2.5">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full"
            style={{ backgroundColor: `${color}22`, color }}
          >
            <Icon name={icon} size={16} />
          </span>
          <span className="font-caption text-[11px] text-secondary">Vista previa de la asignatura</span>
        </div>
      </div>
    </Modal>
  );
}
