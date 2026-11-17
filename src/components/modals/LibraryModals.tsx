import { useRef, useState } from 'react';

import { cn } from '../../lib/cn';
import { SUBJECT_COLORS, SUBJECT_ICONS } from '../../lib/constants';
import { getSubject } from '../../lib/selectors';
import { useApp } from '../../state/AppProvider';
import type { Note, Subject } from '../../types';
import { Button } from '../ui/Button';
import { ColorSwatches, Field, Select, TextArea, TextInput } from '../ui/Field';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';

interface BookModalProps {
  open: boolean;
  onClose: () => void;
}

export function BookModal({ open, onClose }: BookModalProps) {
  const { data, actions, notify } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [subjectId, setSubjectId] = useState(data.subjects[0]?.id ?? '');
  const [totalPages, setTotalPages] = useState('300');
  const [format, setFormat] = useState<'pdf' | 'print'>('pdf');
  const [fileName, setFileName] = useState('');

  const pickFile = (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    setFormat('pdf');
    if (!title.trim()) setTitle(file.name.replace(/\.pdf$/i, ''));
  };

  const save = () => {
    if (!title.trim() || !author.trim()) {
      notify('Completa el título y el autor', 'error');
      return;
    }
    const pages = Math.max(1, Number(totalPages) || 1);
    const subject = getSubject(data.subjects, subjectId);
    actions.addBook({
      title: title.trim(),
      author: author.trim(),
      subjectId,
      totalPages: pages,
      format,
      icon: subject.icon,
      chapter: 'Documento importado',
      fileName: fileName || undefined,
      edition: undefined,
    });
    notify(fileName ? 'PDF importado a tu biblioteca' : 'Libro añadido a tu biblioteca', 'upload_file');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Importar documento"
      subtitle="Añade un PDF o un libro a tu biblioteca"
      icon="upload_file"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} icon="check">
            Importar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-6 text-center transition-colors hover:bg-surface-container"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-fixed text-primary">
            <Icon name={fileName ? 'picture_as_pdf' : 'cloud_upload'} size={22} />
          </span>
          <span className="font-label-md text-[13px] font-medium text-on-surface">
            {fileName || 'Seleccionar archivo PDF'}
          </span>
          <span className="font-caption text-[11px] text-secondary">
            El documento se guardará como progreso de lectura
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(event) => pickFile(event.target.files?.[0])}
        />
        <Field label="Título">
          <TextInput
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ej. Histología de Ross"
          />
        </Field>
        <Field label="Autor o edición">
          <TextInput
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            placeholder="Ej. Ross · 8ª Ed."
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Asignatura">
            <Select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
              {data.subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Páginas">
            <TextInput
              type="number"
              min={1}
              value={totalPages}
              onChange={(event) => setTotalPages(event.target.value)}
            />
          </Field>
        </div>
        <Field label="Formato">
          <Select value={format} onChange={(event) => setFormat(event.target.value as 'pdf' | 'print')}>
            <option value="pdf">PDF / digital</option>
            <option value="print">Libro físico</option>
          </Select>
        </Field>
      </div>
    </Modal>
  );
}

type NoteDefaults = Partial<Pick<Note, 'title' | 'subjectId' | 'content' | 'kind' | 'bookId' | 'page' | 'color'>>;

interface NoteModalProps {
  open: boolean;
  onClose: () => void;
  note?: Note;
  defaults?: NoteDefaults;
}

export function NoteModal({ open, onClose, note, defaults }: NoteModalProps) {
  const { data, actions, notify } = useApp();
  const [title, setTitle] = useState(note?.title ?? defaults?.title ?? '');
  const [subjectId, setSubjectId] = useState(note?.subjectId ?? defaults?.subjectId ?? data.subjects[0]?.id ?? '');
  const [content, setContent] = useState(note?.content ?? defaults?.content ?? '');

  const save = () => {
    if (!title.trim() && !content.trim()) {
      notify('Escribe un título o el contenido de la nota', 'error');
      return;
    }
    const finalTitle = title.trim() || content.trim().slice(0, 42);
    const cleanup = { title: finalTitle, subjectId, content: content.trim() };
    if (note) {
      actions.updateNote(note.id, cleanup);
      notify('Nota actualizada', 'edit_note');
    } else {
      actions.addNote({
        ...cleanup,
        kind: defaults?.kind ?? 'note',
        bookId: defaults?.bookId,
        page: defaults?.page,
        color: defaults?.color,
      });
      notify(defaults?.kind === 'annotation' ? 'Anotación guardada' : 'Nota creada', 'sticky_note_2');
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={note ? 'Editar nota' : defaults?.kind === 'annotation' ? 'Nueva anotación' : 'Nueva nota'}
      subtitle={defaults?.bookId ? 'Vinculada a tu lectura actual' : 'Captura una idea antes de que escape'}
      icon={defaults?.kind === 'annotation' ? 'ink_highlighter' : 'sticky_note_2'}
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
            placeholder="Ej. Resumen de flexores del codo"
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
        <Field label="Contenido">
          <TextArea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Escribe la idea, el resumen o la anotación…"
            className="min-h-[150px]"
          />
        </Field>
      </div>
    </Modal>
  );
}

interface SubjectsManagerModalProps {
  open: boolean;
  onClose: () => void;
}

export function SubjectsManagerModal({ open, onClose }: SubjectsManagerModalProps) {
  const { data, actions, notify } = useApp();
  const [editing, setEditing] = useState<'new' | string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(SUBJECT_COLORS[0]);
  const [icon, setIcon] = useState(SUBJECT_ICONS[0]);

  const usage = (subject: Subject) =>
    data.books.filter((book) => book.subjectId === subject.id).length +
    data.notes.filter((note) => note.subjectId === subject.id).length +
    data.tasks.filter((task) => task.subjectId === subject.id).length +
    data.blocks.filter((block) => block.subjectId === subject.id).length +
    data.decks.filter((deck) => deck.subjectId === subject.id).length;

  const startNew = () => {
    setEditing('new');
    setName('');
    setColor(SUBJECT_COLORS[data.subjects.length % SUBJECT_COLORS.length]);
    setIcon(SUBJECT_ICONS[data.subjects.length % SUBJECT_ICONS.length]);
  };

  const startEdit = (subject: Subject) => {
    setEditing(subject.id);
    setName(subject.name);
    setColor(subject.color);
    setIcon(subject.icon);
  };

  const save = () => {
    if (!name.trim()) {
      notify('Escribe el nombre de la asignatura', 'error');
      return;
    }
    if (editing === 'new') {
      actions.addSubject({ name: name.trim(), color, icon });
      notify('Asignatura creada', 'add_circle');
    } else if (editing) {
      actions.updateSubject(editing, { name: name.trim(), color, icon });
      notify('Asignatura actualizada', 'palette');
    }
    setEditing(null);
  };

  const remove = (subject: Subject) => {
    if (usage(subject) > 0) {
      notify('No se puede eliminar: tiene elementos asociados', 'info');
      return;
    }
    actions.removeSubject(subject.id);
    notify('Asignatura eliminada', 'delete');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Asignaturas y colores"
      subtitle={`${data.subjects.length} asignaturas configuradas`}
      icon="palette"
      footer={
        <Button onClick={onClose} className="w-full">
          Listo
        </Button>
      }
    >
      <div className="space-y-3">
        <button
          type="button"
          onClick={startNew}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary-fixed py-2.5 font-label-md text-[12px] font-medium text-on-primary-fixed active:scale-[0.99]"
        >
          <Icon name="add" size={16} />
          Añadir asignatura
        </button>

        {editing && (
          <div className="space-y-3 rounded-xl border border-outline-variant/60 bg-surface-container-low p-3">
            <Field label="Nombre">
              <TextInput
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nombre de la asignatura"
              />
            </Field>
            <Field label="Color">
              <ColorSwatches colors={SUBJECT_COLORS} value={color} onChange={setColor} />
            </Field>
            <Field label="Icono">
              <div className="mt-0.5 grid grid-cols-8 gap-1.5">
                {SUBJECT_ICONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setIcon(item)}
                    aria-label={`Icono ${item}`}
                    aria-pressed={icon === item}
                    className={cn(
                      'flex h-8 items-center justify-center rounded-lg transition-colors',
                      icon === item ? 'bg-primary text-on-primary' : 'bg-surface-container text-secondary',
                    )}
                  >
                    <Icon name={item} size={16} />
                  </button>
                ))}
              </div>
            </Field>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={save} icon="check">
                {editing === 'new' ? 'Crear' : 'Guardar'}
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-xl bg-surface-container-low">
          {data.subjects.map((subject, index) => {
            const count = usage(subject);
            return (
              <div key={subject.id}>
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${subject.color}22`, color: subject.color }}
                  >
                    <Icon name={subject.icon} size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body-md text-[14px] font-medium text-on-surface">{subject.name}</p>
                    <p className="font-caption text-[11px] text-secondary">
                      {count === 0 ? 'Sin elementos' : `${count} elementos asociados`}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Editar ${subject.name}`}
                    onClick={() => startEdit(subject)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-secondary hover:bg-surface-container-high hover:text-on-surface"
                  >
                    <Icon name="edit" size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Eliminar ${subject.name}`}
                    onClick={() => remove(subject)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-secondary hover:bg-error-container hover:text-error"
                  >
                    <Icon name="delete" size={16} />
                  </button>
                </div>
                {index < data.subjects.length - 1 && <div className="ml-14 h-px bg-outline-variant/30" />}
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
