import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { StackPage } from '../components/layout/StackPage';
import { CardModal } from '../components/modals/FlashcardModals';
import { NoteModal } from '../components/modals/LibraryModals';
import { Button, IconButton } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Modal } from '../components/ui/Modal';
import { ProgressBar } from '../components/ui/ProgressBar';
import { cn } from '../lib/cn';
import { HIGHLIGHT_COLORS } from '../lib/constants';
import { timeAgo } from '../lib/date';
import { getSubject } from '../lib/selectors';
import { useApp } from '../state/AppProvider';
import type { Book, Note } from '../types';

type Tool = 'highlight' | 'underline' | 'note' | 'eraser';

const TOOLS: { id: Tool; icon: string; label: string; hint: string }[] = [
  {
    id: 'highlight',
    icon: 'ink_highlighter',
    label: 'Resaltar',
    hint: 'Toca un párrafo para resaltarlo',
  },
  {
    id: 'underline',
    icon: 'format_underlined',
    label: 'Subrayar',
    hint: 'Toca un párrafo para subrayarlo',
  },
  {
    id: 'note',
    icon: 'sticky_note_2',
    label: 'Nota',
    hint: 'Toca un párrafo para escribir una nota',
  },
  {
    id: 'eraser',
    icon: 'auto_fix_high',
    label: 'Borrar',
    hint: 'Toca un párrafo anotado para borrar su marca',
  },
];

const READING_POOL = [
  'La comprensión de cualquier sistema comienza por identificar sus componentes y la relación que guardan entre sí. Al estudiar, conviene preguntarse qué función cumple cada estructura y cómo cambiaría el conjunto si una de sus partes fallara.',
  'A medida que se avanza en el capítulo, los detalles adquieren sentido cuando se conectan con los conocimientos previos. Una lectura atenta alterna la observación de los esquemas con la explicación en voz alta, porque explicar obliga a ordenar las ideas.',
  'Los mecanismos descritos no ocurren de forma aislada. Se encadenan en secuencias que responden a señales concretas y que pueden regularse en distintos puntos. Detenerse en esos puntos de control ayuda a predecir el efecto de una alteración.',
  'Una buena forma de fijar el contenido es transformarlo en preguntas. ¿Qué estructura interviene primero? ¿Qué ocurre si la señal aumenta? ¿Qué diferencia hay entre este proceso y el que se estudió en el capítulo anterior? Preguntar convierte la lectura pasiva en práctica activa.',
  'Las figuras y los esquemas no son un adorno: resumen relaciones que el texto desarrolla con palabras. Antes de pasar la página, intenta describir la figura sin mirarla y comprueba después qué detalles faltaron. Ese error señalado es la próxima oportunidad de aprender.',
  'Conviene registrar las dudas tal como aparecen, sin esperar a tenerlas resueltas. Una nota breve con la página y la pregunta exacta permite volver después al punto donde el razonamiento se detuvo y aprovechar mejor una segunda lectura.',
  'El estudio eficaz no consiste en leer más veces, sino en recuperar la información desde la memoria. Al terminar el apartado, cierra el libro y explica con tus palabras las tres ideas principales. Compara después con el texto y anota solo lo que no recordabas.',
  'Cada concepto nuevo compite por espacio con los anteriores. Relacionarlo con un ejemplo clínico, una imagen o una experiencia concreta crea más caminos de recuperación y hace que el recuerdo sea menos frágil cuando llegue el examen.',
];

const buildParagraphs = (book: Book, page: number, subjectName: string): string[] => {
  const start = (page + book.title.length) % READING_POOL.length;
  return [
    `Esta página de «${book.title}» presenta una visión de conjunto antes de entrar en los detalles. ${book.author} propone leer el apartado como una cadena de causas y consecuencias, no como una lista aislada de definiciones.`,
    READING_POOL[start],
    READING_POOL[(start + 1) % READING_POOL.length],
    `${subjectName}: aplica lo leído a un caso concreto. Imaginа que una de las variables descritas cambia de forma inesperada; recorre mentalmente el proceso y anticipa qué consecuencias tendría en el resto del sistema.`,
    READING_POOL[(start + 2) % READING_POOL.length],
  ];
};

function PageAnnotationsModal({
  annotations,
  page,
  onClose,
  onEdit,
  onDelete,
}: {
  annotations: Note[];
  page: number;
  onClose: () => void;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Anotaciones de la página"
      subtitle={`${annotations.length} ${annotations.length === 1 ? 'elemento' : 'elementos'} en la página ${page}`}
      icon="ink_highlighter"
      footer={
        <Button fullWidth variant="surface" onClick={onClose}>
          Listo
        </Button>
      }
    >
      {annotations.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl bg-surface-container-low px-4 py-8 text-center">
          <Icon name="auto_awesome" size={28} className="text-secondary" />
          <p className="mt-2 font-body-md text-[14px] text-on-surface">Página sin anotaciones</p>
          <p className="mt-1 font-caption text-[11px] text-secondary">
            Usa la barra inferior para resaltar, subrayar o escribir una nota.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {annotations.map((note) => {
            const isUnderline = note.title.startsWith('Subrayado');
            return (
              <div key={note.id} className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-3">
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: `${note.color ?? HIGHLIGHT_COLORS[0]}55`,
                      color: 'rgb(var(--c-on-surface-variant))',
                    }}
                  >
                    <Icon name={isUnderline ? 'format_underlined' : 'ink_highlighter'} size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-label-md text-[11px] font-medium text-on-surface">
                      {isUnderline ? 'Subrayado' : 'Resaltado'}
                    </p>
                    <p className="font-caption text-[9px] text-secondary">Editado {timeAgo(note.updatedAt)}</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Editar anotación"
                    onClick={() => onEdit(note)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-secondary hover:bg-surface-container-high hover:text-on-surface"
                  >
                    <Icon name="edit" size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label="Eliminar anotación"
                    onClick={() => onDelete(note)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-secondary hover:bg-error-container hover:text-error"
                  >
                    <Icon name="delete" size={14} />
                  </button>
                </div>
                <p className="mt-2 line-clamp-3 font-body-md text-[12px] leading-snug text-on-surface-variant">
                  {note.content}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

export default function Reader() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { data, actions, notify } = useApp();
  const book = data.books.find((entry) => entry.id === bookId);

  const [page, setPage] = useState(() => Math.min(book?.totalPages ?? 1, Math.max(1, book?.currentPage || 1)));
  const [tool, setTool] = useState<Tool>('highlight');
  const [highlightColor, setHighlightColor] = useState<string>(HIGHLIGHT_COLORS[0]);
  const [bookmarkedPages, setBookmarkedPages] = useState<number[]>([]);
  const [noteTarget, setNoteTarget] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<Note | undefined>();
  const [annotationsOpen, setAnnotationsOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Note | null>(null);

  if (!book) {
    return (
      <StackPage title="Lector" close backTo="/biblioteca">
        <EmptyState
          icon="menu_book"
          title="No encontramos este libro"
          description="Puede que se haya eliminado de tu biblioteca. Vuelve para elegir otra lectura."
          action={
            <Button icon="arrow_back" onClick={() => navigate('/biblioteca')}>
              Ir a la biblioteca
            </Button>
          }
        />
      </StackPage>
    );
  }

  const subject = getSubject(data.subjects, book.subjectId);
  const annotations = data.notes.filter(
    (note) => note.kind === 'annotation' && note.bookId === book.id && note.page === page,
  );
  const chapterParts = (book.chapter ?? 'Documento').split('·').map((part) => part.trim());
  const chapterLabel = chapterParts[0] || 'Lectura';
  const chapterHeading = chapterParts.slice(1).join(' · ') || chapterParts[0] || 'Documento';
  const paragraphs = buildParagraphs(book, page, subject.name);
  const progress = Math.round((page / Math.max(1, book.totalPages)) * 100);
  const bookmarked = bookmarkedPages.includes(page);
  const activeTool = TOOLS.find((entry) => entry.id === tool) ?? TOOLS[0];

  const goToPage = (nextPage: number, scroll = true) => {
    const clamped = Math.min(book.totalPages, Math.max(1, nextPage));
    if (clamped === page) return;
    setPage(clamped);
    actions.updateBook(book.id, { currentPage: clamped });
    if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const annotationFor = (text: string) => annotations.find((note) => note.content === text);

  const handleParagraph = (text: string) => {
    const existing = annotations.filter((note) => note.content === text);

    if (tool === 'eraser') {
      if (existing.length === 0) {
        notify('Este párrafo no tiene anotaciones', 'info');
        return;
      }
      existing.forEach((note) => actions.removeNote(note.id));
      notify('Anotación eliminada', 'auto_fix_high');
      return;
    }

    if (tool === 'note') {
      setNoteTarget(text);
      return;
    }

    if (existing.length > 0) {
      notify('Este párrafo ya tiene una anotación', 'info');
      return;
    }

    actions.addNote({
      title: `${tool === 'highlight' ? 'Anotación' : 'Subrayado'} · pág. ${page}`,
      content: text,
      subjectId: book.subjectId,
      kind: 'annotation',
      bookId: book.id,
      page,
      color: tool === 'highlight' ? highlightColor : subject.color,
    });
    notify(
      tool === 'highlight' ? 'Resaltado guardado' : 'Subrayado guardado',
      tool === 'highlight' ? 'ink_highlighter' : 'format_underlined',
    );
  };

  const toggleBookmark = () => {
    setBookmarkedPages((current) =>
      current.includes(page) ? current.filter((entry) => entry !== page) : [...current, page],
    );
    notify(
      bookmarked ? 'Marcador eliminado' : `Marcador guardado en la página ${page}`,
      bookmarked ? 'bookmark_remove' : 'bookmark_added',
    );
  };

  return (
    <div className="min-h-dvh bg-surface">
      <header className="safe-top fixed inset-x-0 top-0 z-40 bg-surface/90 shadow-soft backdrop-blur-xl">
        <div className="mx-auto max-w-[620px] px-margin">
          <div className="flex h-14 items-center gap-1.5">
            <button
              type="button"
              aria-label="Volver a la biblioteca"
              onClick={() => navigate('/biblioteca')}
              className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container active:scale-95"
            >
              <Icon name="arrow_back" size={22} />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-headline-md text-[14px] font-medium text-on-surface">{book.title}</h1>
              <p className="truncate font-caption text-[10px] text-secondary">
                {book.author} · pág. {page} de {book.totalPages}
              </p>
            </div>
            <IconButton icon="add_card" label="Crear tarjeta desde esta página" onClick={() => setCardOpen(true)} />
            <IconButton
              icon="bookmark"
              label={bookmarked ? 'Quitar marcador' : 'Guardar marcador'}
              active={bookmarked}
              onClick={toggleBookmark}
            />
          </div>
          <ProgressBar value={progress} height="h-0.5" className="mb-2" />
        </div>
      </header>

      <main
        className="mx-auto w-full max-w-[620px] px-margin"
        style={{
          paddingTop: 'calc(4.75rem + env(safe-area-inset-top, 0px))',
          paddingBottom: 'calc(11.5rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: subject.color }} />
            <span className="truncate font-caption text-[10px] font-medium text-secondary">{subject.name}</span>
            <span className="text-[10px] text-secondary/50">·</span>
            <span className="shrink-0 font-caption text-[10px] text-secondary">
              {book.format === 'pdf' ? 'PDF' : 'Libro físico'}
            </span>
          </div>
          <span className="shrink-0 rounded-full bg-surface-container px-2 py-0.5 font-caption text-[9px] font-medium text-secondary">
            {progress}% leído
          </span>
        </div>

        <article className="rounded-2xl bg-surface-container-lowest px-5 py-5 shadow-soft">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2.5">
            <span className="font-caption text-[9px] font-medium uppercase tracking-[0.16em] text-secondary">
              {chapterLabel}
            </span>
            <span className="font-caption text-[9px] text-secondary">Página {page}</span>
          </div>

          <h2 className="mt-4 font-headline-lg text-[22px] font-medium leading-tight text-on-surface">
            {chapterHeading}
          </h2>
          <p className="mt-1.5 font-caption text-[10px] italic text-secondary">
            {book.edition ? `${book.edition} · ` : ''}
            {book.title}
          </p>

          <div className="mt-3 flex items-center gap-1.5 rounded-full bg-surface-container-low px-2.5 py-1.5">
            <Icon name={activeTool.icon} size={13} className="text-primary" />
            <span className="truncate font-caption text-[9px] text-secondary">{activeTool.hint}</span>
          </div>

          <div className="mt-5 space-y-4">
            {paragraphs.map((text, index) => {
              const annotation = annotationFor(text);
              const isUnderline = annotation?.title.startsWith('Subrayado');
              return (
                <div key={`${page}-${index}`}>
                  <p
                    onClick={() => handleParagraph(text)}
                    className={cn(
                      'rounded-md font-body-md text-[15px] leading-[1.8] text-on-surface transition-colors',
                      tool === 'eraser' ? 'cursor-crosshair' : 'cursor-pointer',
                    )}
                  >
                    <span
                      className={cn(annotation && (isUnderline ? 'reader-underline' : 'reader-highlight'))}
                      style={
                        annotation && !isUnderline
                          ? { backgroundColor: annotation.color ?? HIGHLIGHT_COLORS[0] }
                          : undefined
                      }
                    >
                      {text}
                    </span>
                  </p>

                  {index === 1 && (
                    <blockquote className="my-4 rounded-r-xl border-l-[3px] border-primary bg-primary-fixed/30 py-2.5 pl-3.5 pr-3">
                      <p className="font-body-md text-[12px] italic leading-snug text-on-surface-variant">
                        «Lo que no se recupera de la memoria no se posee; solo se reconoce.»
                      </p>
                      <cite className="mt-1 block font-caption text-[9px] not-italic text-secondary">
                        Nota de estudio · {subject.name}
                      </cite>
                    </blockquote>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-outline-variant/30 pt-2.5">
            <span className="truncate font-caption text-[9px] text-secondary">{book.title}</span>
            <span className="font-caption text-[9px] text-secondary">{page}</span>
          </div>
        </article>

        {annotations.length > 0 ? (
          <button
            type="button"
            onClick={() => setAnnotationsOpen(true)}
            className="mt-3 flex w-full items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-container-low px-3.5 py-2 shadow-sm transition-colors hover:bg-surface-container active:scale-[0.995]"
          >
            <span className="flex -space-x-1">
              {annotations.slice(0, 3).map((note) => (
                <span
                  key={note.id}
                  className="h-3 w-3 rounded-full border border-surface-container-low"
                  style={{ backgroundColor: note.color ?? HIGHLIGHT_COLORS[0] }}
                />
              ))}
            </span>
            <span className="font-label-md text-[11px] font-medium text-on-surface">
              {annotations.length} {annotations.length === 1 ? 'anotación' : 'anotaciones'} en esta página
            </span>
            <Icon name="chevron_right" size={16} className="ml-auto text-secondary" />
          </button>
        ) : (
          <p className="mt-3 text-center font-caption text-[10px] text-secondary">
            Toca un párrafo para empezar a anotar
          </p>
        )}
      </main>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/30 bg-surface/95 shadow-float backdrop-blur-xl">
        <div className="mx-auto max-w-[620px] px-margin">
          <div className="flex items-center gap-2 py-2">
            <button
              type="button"
              aria-label="Página anterior"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-container disabled:opacity-30"
            >
              <Icon name="chevron_left" size={20} />
            </button>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center justify-center gap-1.5">
                <span className="font-label-md text-[11px] font-medium text-on-surface">Página {page}</span>
                <span className="font-caption text-[10px] text-secondary">de {book.totalPages}</span>
              </div>
              <input
                type="range"
                min={1}
                max={Math.max(1, book.totalPages)}
                value={page}
                onChange={(event) => goToPage(Number(event.target.value), false)}
                aria-label="Ir a una página"
                className="h-1 w-full cursor-pointer accent-primary"
              />
            </div>
            <button
              type="button"
              aria-label="Página siguiente"
              onClick={() => goToPage(page + 1)}
              disabled={page >= book.totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-container disabled:opacity-30"
            >
              <Icon name="chevron_right" size={20} />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1 border-t border-outline-variant/25 pb-1.5 pt-1.5">
            {TOOLS.map((entry) => {
              const active = entry.id === tool;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setTool(entry.id)}
                  aria-pressed={active}
                  className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 transition-all active:scale-95 ${
                    active ? 'bg-primary-fixed text-primary' : 'text-secondary hover:bg-surface-container'
                  }`}
                >
                  <Icon name={entry.icon} size={19} />
                  <span className="font-caption text-[9px] font-medium">{entry.label}</span>
                </button>
              );
            })}
          </div>

          {tool === 'highlight' && (
            <div className="flex items-center gap-2 border-t border-outline-variant/25 pb-2 pt-1.5">
              <span className="font-caption text-[9px] font-medium uppercase tracking-wider text-secondary">Color</span>
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Usar color ${color}`}
                  aria-pressed={highlightColor === color}
                  onClick={() => setHighlightColor(color)}
                  className={cn(
                    'h-6 w-6 rounded-full border border-black/5 transition-transform active:scale-90',
                    highlightColor === color && 'scale-110 ring-2 ring-primary ring-offset-1 ring-offset-surface',
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
              <span className="ml-auto font-caption text-[9px] text-secondary">
                {annotations.length} en esta página
              </span>
            </div>
          )}
        </div>
      </div>

      {noteTarget !== null && (
        <NoteModal
          key={`note-${page}-${noteTarget.slice(0, 12)}`}
          open
          onClose={() => setNoteTarget(null)}
          defaults={{
            title: `Nota · pág. ${page}`,
            content: noteTarget,
            subjectId: book.subjectId,
            kind: 'annotation',
            bookId: book.id,
            page,
            color: highlightColor,
          }}
        />
      )}

      {editingNote && <NoteModal open note={editingNote} onClose={() => setEditingNote(undefined)} />}

      {annotationsOpen && (
        <PageAnnotationsModal
          annotations={annotations}
          page={page}
          onClose={() => setAnnotationsOpen(false)}
          onEdit={(note) => {
            setAnnotationsOpen(false);
            setEditingNote(note);
          }}
          onDelete={(note) => {
            setAnnotationsOpen(false);
            setPendingDelete(note);
          }}
        />
      )}

      {cardOpen && (
        <CardModal
          open
          onClose={() => setCardOpen(false)}
          initialQuestion={`¿Qué ideas clave aparecen en la página ${page} de ${book.title}?`}
        />
      )}

      <ConfirmModal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          actions.removeNote(pendingDelete.id);
          notify('Anotación eliminada', 'delete');
          setPendingDelete(null);
        }}
        title="Eliminar anotación"
        description="La marca desaparecerá de esta página y la nota se borrará de tu biblioteca. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        icon="delete_forever"
        danger
      />
    </div>
  );
}
