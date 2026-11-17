import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { BookModal, NoteModal, SubjectsManagerModal } from '../components/modals/LibraryModals';
import { SubjectFormModal } from '../components/modals/StudyModals';
import { ActionRow } from '../components/ui/ActionRow';
import { Button, IconButton } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { EmptyState } from '../components/ui/EmptyState';
import { Fab } from '../components/ui/Fab';
import { Icon } from '../components/ui/Icon';
import { Modal } from '../components/ui/Modal';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { timeAgo } from '../lib/date';
import { getBookProgress, getSubject } from '../lib/selectors';
import { useApp } from '../state/AppProvider';
import type { Book, Note } from '../types';

type Tab = 'books' | 'notes';
type ViewMode = 'grid' | 'list';

interface BibliotecaState {
  tab?: Tab;
  subjectId?: string;
  editNoteId?: string;
}

const noteTypeLabel: Record<Note['kind'], string> = {
  note: 'Nota',
  annotation: 'Anotación',
};

function BookOptionsModal({
  book,
  onClose,
  onRead,
  onFinish,
  onDelete,
}: {
  book: Book;
  onClose: () => void;
  onRead: () => void;
  onFinish: () => void;
  onDelete: () => void;
}) {
  const { data } = useApp();
  const subject = getSubject(data.subjects, book.subjectId);
  const progress = getBookProgress(book);
  const finished = book.currentPage >= book.totalPages;

  return (
    <Modal
      open
      onClose={onClose}
      title={book.title}
      subtitle={`${book.author} · ${progress}% leído`}
      icon={book.icon}
      footer={
        <Button variant="surface" onClick={onClose} fullWidth>
          Cerrar
        </Button>
      }
    >
      <div className="space-y-1">
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-surface-container-low px-3 py-2.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: subject.color }} />
          <span className="font-caption text-[12px] text-secondary">{subject.name}</span>
          <span className="ml-auto font-caption text-[12px] text-secondary">
            Pág. {book.currentPage} de {book.totalPages}
          </span>
        </div>
        <ActionRow
          icon="menu_book"
          title="Abrir lector"
          description={`Continuar desde la página ${Math.max(1, book.currentPage || 1)}`}
          onClick={onRead}
        />
        <ActionRow
          icon={finished ? 'restart_alt' : 'task_alt'}
          title={finished ? 'Reiniciar lectura' : 'Marcar como terminado'}
          description={finished ? 'Volver al principio del documento' : 'Guardar la última página como leída'}
          onClick={onFinish}
        />
        <ActionRow
          icon="delete"
          title="Eliminar de la biblioteca"
          description="Se conservarán las notas y anotaciones"
          onClick={onDelete}
          danger
        />
      </div>
    </Modal>
  );
}

export default function Biblioteca() {
  const { data, actions, notify } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? null) as BibliotecaState | null;

  const [tab, setTab] = useState<Tab>(state?.tab ?? 'books');
  const [view, setView] = useState<ViewMode>('grid');
  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState(state?.subjectId ?? 'all');
  const [bookOpen, setBookOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [subjectsOpen, setSubjectsOpen] = useState(false);
  const [bookOptions, setBookOptions] = useState<Book | null>(null);
  const [editingNote, setEditingNote] = useState<Note | undefined>(() =>
    data.notes.find((note) => note.id === state?.editNoteId),
  );
  const [pendingDelete, setPendingDelete] = useState<{ kind: 'book' | 'note'; id: string; title: string } | null>(null);

  const term = query.trim().toLowerCase();
  const matches = (text: string) => text.toLowerCase().includes(term);
  const hasFilters = term.length > 0 || subjectFilter !== 'all';

  const books = data.books
    .filter(
      (book) =>
        (subjectFilter === 'all' || book.subjectId === subjectFilter) &&
        (!term || matches(book.title) || matches(book.author) || matches(book.chapter ?? '')),
    )
    .sort((a, b) => new Date(b.lastReadAt ?? 0).getTime() - new Date(a.lastReadAt ?? 0).getTime());

  const notes = data.notes
    .filter(
      (note) =>
        (subjectFilter === 'all' || note.subjectId === subjectFilter) &&
        (!term ||
          matches(note.title) ||
          matches(note.content) ||
          matches(getSubject(data.subjects, note.subjectId).name)),
    )
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const totalPagesRead = data.books.reduce((total, book) => total + Math.min(book.currentPage, book.totalPages), 0);

  const clearFilters = () => {
    setQuery('');
    setSubjectFilter('all');
  };

  const openBook = (book: Book) => {
    setBookOptions(null);
    navigate(`/lector/${book.id}`);
  };

  const finishBook = (book: Book) => {
    if (book.currentPage >= book.totalPages) {
      actions.updateBook(book.id, { currentPage: 0 });
      notify('Lectura reiniciada', 'restart_alt');
    } else {
      actions.updateBook(book.id, { currentPage: book.totalPages });
      notify('Libro marcado como terminado', 'task_alt');
    }
    setBookOptions(null);
  };

  const requestDelete = (kind: 'book' | 'note', id: string, title: string) => {
    setBookOptions(null);
    setPendingDelete({ kind, id, title });
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.kind === 'book') {
      actions.removeBook(pendingDelete.id);
      notify('Libro eliminado de la biblioteca', 'delete');
    } else {
      actions.removeNote(pendingDelete.id);
      notify('Nota eliminada', 'delete');
    }
    setPendingDelete(null);
  };

  const createAction = () => {
    if (tab === 'books') setBookOpen(true);
    else setNoteOpen(true);
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <section className="grid grid-cols-3 gap-2">
        {[
          { icon: 'auto_stories', value: data.books.length, label: 'libros' },
          { icon: 'sticky_note_2', value: data.notes.length, label: 'notas' },
          { icon: 'menu_book', value: totalPagesRead, label: 'páginas' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center rounded-xl bg-surface-container-low px-2 py-3 text-center shadow-sm"
          >
            <Icon name={stat.icon} size={18} className="mb-1 text-primary" />
            <span className="font-headline-md text-[19px] font-semibold text-on-surface">{stat.value}</span>
            <span className="font-caption text-[10px] text-secondary">{stat.label}</span>
          </div>
        ))}
      </section>

      <div className="flex items-center gap-2 rounded-2xl bg-surface-container-low px-3.5 py-2.5 shadow-sm transition-colors focus-within:bg-surface-container">
        <Icon name="search" size={19} className="shrink-0 text-secondary" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="search"
          aria-label="Buscar en la biblioteca"
          placeholder={tab === 'books' ? 'Buscar libros o autores…' : 'Buscar en tus notas…'}
          className="min-w-0 flex-1 border-0 bg-transparent p-0 font-body-md text-[14px] text-on-surface outline-none placeholder:text-secondary/70"
        />
        {query ? (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            onClick={() => setQuery('')}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-secondary hover:bg-surface-container-high"
          >
            <Icon name="close" size={17} />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Gestionar asignaturas"
            onClick={() => setSubjectsOpen(true)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-secondary hover:bg-surface-container-high"
          >
            <Icon name="tune" size={17} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <SegmentedControl
          ariaLabel="Contenido de la biblioteca"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'books', label: `Libros (${data.books.length})` },
            { value: 'notes', label: `Notas (${data.notes.length})` },
          ]}
          className="flex-1"
        />
        {tab === 'books' ? (
          <IconButton
            icon={view === 'grid' ? 'view_list' : 'grid_view'}
            label={view === 'grid' ? 'Ver en lista' : 'Ver en cuadrícula'}
            onClick={() => setView((current) => (current === 'grid' ? 'list' : 'grid'))}
            className="bg-surface-container-low shadow-sm"
          />
        ) : (
          <IconButton
            icon="note_add"
            label="Nueva nota"
            onClick={() => setNoteOpen(true)}
            className="bg-surface-container-low shadow-sm"
          />
        )}
      </div>

      <div className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-0.5">
        <Chip selected={subjectFilter === 'all'} onClick={() => setSubjectFilter('all')}>
          Todas
        </Chip>
        {data.subjects.map((subject) => (
          <Chip
            key={subject.id}
            selected={subjectFilter === subject.id}
            dotColor={subject.color}
            onClick={() => setSubjectFilter(subject.id)}
          >
            {subject.name}
          </Chip>
        ))}
        <button
          type="button"
          aria-label="Añadir asignatura"
          onClick={() => setSubjectOpen(true)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-outline-variant text-secondary transition-colors hover:bg-surface-container"
        >
          <Icon name="add" size={17} />
        </button>
      </div>

      {tab === 'books' ? (
        books.length === 0 ? (
          <EmptyState
            icon="auto_stories"
            title={hasFilters ? 'Sin libros que coincidan' : 'Tu biblioteca está vacía'}
            description={
              hasFilters
                ? 'Prueba con otro término o cambia el filtro de asignatura.'
                : 'Importa un PDF o añade un libro físico para empezar a leer y anotar.'
            }
            action={
              <Button
                variant={hasFilters ? 'surface' : 'primary'}
                icon={hasFilters ? 'filter_alt_off' : 'upload_file'}
                onClick={() => (hasFilters ? clearFilters() : setBookOpen(true))}
              >
                {hasFilters ? 'Limpiar filtros' : 'Importar documento'}
              </Button>
            }
          />
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 gap-3">
            {books.map((book) => {
              const subject = getSubject(data.subjects, book.subjectId);
              const progress = getBookProgress(book);
              return (
                <article
                  key={book.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openBook(book)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') openBook(book);
                  }}
                  className="group cursor-pointer rounded-xl bg-surface-container-low p-2.5 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
                >
                  <div
                    className="relative mb-2.5 flex h-28 items-center justify-center overflow-hidden rounded-lg"
                    style={{
                      background: `linear-gradient(145deg, ${subject.color}2b, ${subject.color}0a)`,
                    }}
                  >
                    <span className="absolute left-2 top-2 rounded-full bg-surface/75 px-1.5 py-0.5 font-caption text-[9px] font-medium uppercase tracking-wide text-secondary">
                      {book.format === 'pdf' ? 'PDF' : 'Físico'}
                    </span>
                    <button
                      type="button"
                      aria-label={`Opciones de ${book.title}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setBookOptions(book);
                      }}
                      className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface/70 hover:text-on-surface"
                    >
                      <Icon name="more_vert" size={17} />
                    </button>
                    <span
                      className="flex h-16 w-12 items-end justify-center rounded-[4px] bg-surface-container-lowest shadow-md"
                      style={{ borderLeft: `3px solid ${subject.color}` }}
                    >
                      <Icon name={book.icon} size={24} className="mb-5" style={{ color: subject.color }} />
                    </span>
                  </div>
                  <h3 className="line-clamp-2 min-h-[34px] font-body-md text-[13px] font-medium leading-tight text-on-surface">
                    {book.title}
                  </h3>
                  <p className="mt-1 truncate font-caption text-[10px] text-secondary">{book.author}</p>
                  <ProgressBar value={progress} height="h-1" className="mt-2.5" />
                  <div className="mt-1.5 flex items-center justify-between font-caption text-[10px] text-secondary">
                    <span>{progress}%</span>
                    <span>
                      {book.currentPage}/{book.totalPages}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {books.map((book) => {
              const subject = getSubject(data.subjects, book.subjectId);
              const progress = getBookProgress(book);
              return (
                <article
                  key={book.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openBook(book)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') openBook(book);
                  }}
                  className="flex cursor-pointer items-center gap-3 rounded-xl bg-surface-container-low p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.995]"
                >
                  <span
                    className="flex h-16 w-12 shrink-0 flex-col items-center justify-center gap-1 rounded-lg shadow-sm"
                    style={{
                      backgroundColor: `${subject.color}20`,
                      borderLeft: `3px solid ${subject.color}`,
                      color: subject.color,
                    }}
                  >
                    <Icon name={book.icon} size={21} />
                    <span className="font-caption text-[8px] font-medium">
                      {(book.format === 'pdf' ? 'PDF' : 'LIBRO').toUpperCase()}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: subject.color }} />
                      <span className="truncate font-caption text-[10px] text-secondary">{subject.name}</span>
                    </div>
                    <h3 className="truncate font-body-md text-[14px] font-medium text-on-surface">{book.title}</h3>
                    <p className="truncate font-caption text-[11px] text-secondary">
                      {book.author}
                      {book.edition ? ` · ${book.edition}` : ''}
                    </p>
                    <ProgressBar value={progress} height="h-1" className="mt-2" />
                    <div className="mt-1 flex items-center justify-between font-caption text-[10px] text-secondary">
                      <span>
                        Pág. {book.currentPage} de {book.totalPages}
                      </span>
                      <span>{progress}% leído</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Opciones de ${book.title}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setBookOptions(book);
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-secondary hover:bg-surface-container-high hover:text-on-surface"
                  >
                    <Icon name="more_vert" size={18} />
                  </button>
                </article>
              );
            })}
          </div>
        )
      ) : notes.length === 0 ? (
        <EmptyState
          icon="sticky_note_2"
          title={hasFilters ? 'Sin notas que coincidan' : 'Aún no tienes notas'}
          description={
            hasFilters
              ? 'Cambia la búsqueda o el filtro para encontrar lo que buscas.'
              : 'Captura una idea, un resumen o una anotación vinculada a tu lectura.'
          }
          action={
            <Button
              variant={hasFilters ? 'surface' : 'primary'}
              icon={hasFilters ? 'filter_alt_off' : 'note_add'}
              onClick={() => (hasFilters ? clearFilters() : setNoteOpen(true))}
            >
              {hasFilters ? 'Limpiar filtros' : 'Nueva nota'}
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {notes.map((note) => {
            const subject = getSubject(data.subjects, note.subjectId);
            const book = data.books.find((entry) => entry.id === note.bookId);
            return (
              <article
                key={note.id}
                role="button"
                tabIndex={0}
                onClick={() => setEditingNote(note)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') setEditingNote(note);
                }}
                className="cursor-pointer overflow-hidden rounded-xl bg-surface-container-low shadow-sm transition-all hover:shadow-md active:scale-[0.995]"
              >
                <div className="flex items-start gap-3 p-3.5">
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{
                      backgroundColor:
                        note.kind === 'annotation' ? `${note.color ?? subject.color}45` : `${subject.color}20`,
                      color: subject.color,
                    }}
                  >
                    <Icon name={note.kind === 'annotation' ? 'ink_highlighter' : 'description'} size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: subject.color }} />
                      <span className="font-caption text-[10px] font-medium text-secondary">{subject.name}</span>
                      <span className="text-[10px] text-secondary/50">·</span>
                      <span className="font-caption text-[10px] text-secondary">{noteTypeLabel[note.kind]}</span>
                      <span className="ml-auto shrink-0 font-caption text-[10px] text-secondary/80">
                        {timeAgo(note.updatedAt)}
                      </span>
                    </div>
                    <h3 className="line-clamp-1 font-body-md text-[14px] font-medium text-on-surface">{note.title}</h3>
                    <p className="mt-1 line-clamp-2 font-caption text-[12px] leading-snug text-secondary">
                      {note.content}
                    </p>
                    {note.kind === 'annotation' && book && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-surface-container px-2 py-0.5 font-caption text-[10px] text-secondary">
                        <Icon name={book.icon} size={12} />
                        {book.title}
                        {note.page ? ` · pág. ${note.page}` : ''}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-outline-variant/25 px-3.5 py-2">
                  <span className="font-caption text-[10px] text-secondary">Tocar para editar</span>
                  <button
                    type="button"
                    aria-label={`Eliminar ${note.title}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      requestDelete('note', note.id, note.title);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-secondary transition-colors hover:bg-error-container hover:text-error"
                  >
                    <Icon name="delete" size={15} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <section className="flex items-center gap-3 rounded-xl bg-surface-container p-3.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-primary">
          <Icon name="lightbulb" size={18} />
        </span>
        <p className="font-caption text-[11px] leading-snug text-secondary">
          Subraya mientras lees y convierte cada anotación en una tarjeta de repaso. Tu memoria agradecerá el esfuerzo
          activo.
        </p>
      </section>

      <Fab
        onClick={createAction}
        label={tab === 'books' ? 'Importar documento' : 'Crear nota'}
        icon={tab === 'books' ? 'upload_file' : 'note_add'}
      />

      {bookOpen && <BookModal open onClose={() => setBookOpen(false)} />}
      {noteOpen && <NoteModal open onClose={() => setNoteOpen(false)} />}
      {editingNote && <NoteModal open note={editingNote} onClose={() => setEditingNote(undefined)} />}
      {subjectOpen && <SubjectFormModal open onClose={() => setSubjectOpen(false)} />}
      {subjectsOpen && <SubjectsManagerModal open onClose={() => setSubjectsOpen(false)} />}
      {bookOptions && (
        <BookOptionsModal
          book={bookOptions}
          onClose={() => setBookOptions(null)}
          onRead={() => openBook(bookOptions)}
          onFinish={() => finishBook(bookOptions)}
          onDelete={() => requestDelete('book', bookOptions.id, bookOptions.title)}
        />
      )}
      <ConfirmModal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={pendingDelete?.kind === 'book' ? 'Eliminar libro' : 'Eliminar nota'}
        description={
          <>
            ¿Seguro que quieres eliminar <strong className="text-on-surface">{pendingDelete?.title}</strong>? Esta
            acción no se puede deshacer.
          </>
        }
        confirmLabel="Eliminar"
        icon="delete_forever"
        danger
      />
    </div>
  );
}
