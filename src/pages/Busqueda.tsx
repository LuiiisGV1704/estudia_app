import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { StackPage } from '../components/layout/StackPage';
import { Chip } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { Highlight } from '../components/ui/Highlight';
import { Icon } from '../components/ui/Icon';
import { formatShortDate } from '../lib/date';
import { getBookProgress, getDeckCards, getSubject } from '../lib/selectors';
import { useApp } from '../state/AppProvider';

type SearchCategory = 'books' | 'notes' | 'cards' | 'agenda' | 'groups';
type Filter = 'all' | SearchCategory;

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color?: string;
  meta?: string;
  onOpen: () => void;
}

interface ResultGroup {
  id: SearchCategory;
  label: string;
  icon: string;
  results: SearchResult[];
}

const blockIcons: Record<string, string> = {
  study: 'book',
  review: 'layers',
  exam: 'flag',
};

export default function Busqueda() {
  const { data } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [recent, setRecent] = useState<string[]>([]);

  const term = query.trim().toLowerCase();
  const hasQuery = term.length > 0;
  const matches = (...values: (string | undefined)[]) => values.some((value) => value?.toLowerCase().includes(term));

  const remember = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    setRecent((current) => [clean, ...current.filter((item) => item !== clean)].slice(0, 5));
  };

  const books = hasQuery
    ? data.books
        .filter((book) => {
          const subject = getSubject(data.subjects, book.subjectId);
          return matches(book.title, book.author, book.chapter, subject.name);
        })
        .slice(0, 6)
        .map<SearchResult>((book) => {
          const subject = getSubject(data.subjects, book.subjectId);
          return {
            id: book.id,
            title: book.title,
            subtitle: `${book.author} · ${getBookProgress(book)}% leído`,
            icon: book.icon,
            color: subject.color,
            meta: 'Libro',
            onOpen: () => navigate(`/lector/${book.id}`),
          };
        })
    : [];

  const notes = hasQuery
    ? data.notes
        .filter((note) => {
          const subject = getSubject(data.subjects, note.subjectId);
          return matches(note.title, note.content, subject.name);
        })
        .slice(0, 8)
        .map<SearchResult>((note) => {
          const subject = getSubject(data.subjects, note.subjectId);
          return {
            id: note.id,
            title: note.title,
            subtitle: note.content.replace(/\s+/g, ' ').slice(0, 110),
            icon: note.kind === 'annotation' ? 'ink_highlighter' : 'description',
            color: subject.color,
            meta: note.kind === 'annotation' ? 'Anotación' : 'Nota',
            onOpen: () =>
              navigate('/biblioteca', {
                state: { tab: 'notes', editNoteId: note.id },
              }),
          };
        })
    : [];

  const decks = hasQuery
    ? data.decks
        .filter((deck) => {
          const subject = getSubject(data.subjects, deck.subjectId);
          return matches(deck.name, subject.name);
        })
        .slice(0, 5)
        .map<SearchResult>((deck) => {
          const subject = getSubject(data.subjects, deck.subjectId);
          return {
            id: deck.id,
            title: deck.name,
            subtitle: `${getDeckCards(data.cards, deck.id).length} tarjetas · ${subject.name}`,
            icon: 'style',
            color: subject.color,
            meta: 'Mazo',
            onOpen: () => navigate(`/repaso/${deck.id}`),
          };
        })
    : [];

  const cards = hasQuery
    ? data.cards
        .filter((card) => {
          const deck = data.decks.find((entry) => entry.id === card.deckId);
          return matches(card.question, card.answer, card.hint, card.keyPoint, deck?.name);
        })
        .slice(0, 6)
        .map<SearchResult>((card) => {
          const deck = data.decks.find((entry) => entry.id === card.deckId);
          const subject = getSubject(data.subjects, deck?.subjectId);
          return {
            id: card.id,
            title: card.question,
            subtitle: card.answer.slice(0, 110),
            icon: 'quiz',
            color: subject.color,
            meta: deck?.name ?? 'Tarjeta',
            onOpen: () => navigate(`/repaso/${card.deckId}`),
          };
        })
    : [];

  const tasks = hasQuery
    ? data.tasks
        .filter((task) => {
          const subject = getSubject(data.subjects, task.subjectId);
          return matches(task.title, subject.name);
        })
        .slice(0, 5)
        .map<SearchResult>((task) => {
          const subject = getSubject(data.subjects, task.subjectId);
          return {
            id: task.id,
            title: task.title,
            subtitle: `${subject.name} · ${formatShortDate(task.date)}${task.time ? ` · ${task.time}` : ''}`,
            icon: task.done ? 'task_alt' : 'check_box_outline_blank',
            color: subject.color,
            meta: 'Tarea',
            onOpen: () => navigate('/agenda', { state: { date: task.date } }),
          };
        })
    : [];

  const blocks = hasQuery
    ? data.blocks
        .filter((block) => {
          const subject = getSubject(data.subjects, block.subjectId);
          return matches(block.title, block.notes, subject.name);
        })
        .slice(0, 5)
        .map<SearchResult>((block) => {
          const subject = getSubject(data.subjects, block.subjectId);
          return {
            id: block.id,
            title: block.title,
            subtitle: `${subject.name} · ${formatShortDate(block.date)}${block.start ? ` · ${block.start}` : ''}`,
            icon: blockIcons[block.kind] ?? 'event',
            color: subject.color,
            meta: block.done ? 'Completado' : 'Bloque',
            onOpen: () => navigate('/agenda', { state: { date: block.date } }),
          };
        })
    : [];

  const groups = hasQuery
    ? data.groups
        .filter((group) => {
          const subject = group.subjectId ? getSubject(data.subjects, group.subjectId) : undefined;
          return matches(group.name, subject?.name, ...group.activities.map((activity) => activity.text));
        })
        .slice(0, 5)
        .map<SearchResult>((group) => {
          const subject = group.subjectId ? getSubject(data.subjects, group.subjectId) : undefined;
          return {
            id: group.id,
            title: group.name,
            subtitle: `${subject?.name ?? 'Grupo de estudio'} · ${group.memberCount} miembros`,
            icon: 'groups',
            color: subject?.color,
            meta: group.archived ? 'Archivado' : group.live ? 'En directo' : 'Grupo',
            onOpen: () => navigate('/grupos', { state: { groupId: group.id } }),
          };
        })
    : [];

  const resultGroups: ResultGroup[] = [
    { id: 'books', label: 'Libros', icon: 'auto_stories', results: books },
    { id: 'notes', label: 'Notas', icon: 'sticky_note_2', results: notes },
    { id: 'cards', label: 'Tarjetas y mazos', icon: 'style', results: [...decks, ...cards] },
    { id: 'agenda', label: 'Agenda', icon: 'calendar_today', results: [...tasks, ...blocks] },
    { id: 'groups', label: 'Grupos', icon: 'group', results: groups },
  ];

  const populatedGroups = resultGroups.filter((group) => group.results.length > 0);
  const totalResults = populatedGroups.reduce((total, group) => total + group.results.length, 0);
  const visibleGroups = filter === 'all' ? populatedGroups : populatedGroups.filter((group) => group.id === filter);
  const filters: { value: Filter; label: string; count: number }[] = [
    { value: 'all', label: 'Todo', count: totalResults },
    ...resultGroups.map((group) => ({
      value: group.id as Filter,
      label: group.label.split(' ')[0],
      count: group.results.length,
    })),
  ];
  const suggestions = [
    ...new Set([...data.subjects.slice(0, 4).map((subject) => subject.name), 'potencial de acción', 'antibióticos']),
  ].slice(0, 6);

  const openResult = (result: SearchResult) => {
    remember(query);
    result.onOpen();
  };

  const clearSearch = () => {
    setQuery('');
    setFilter('all');
  };

  return (
    <StackPage title="Búsqueda global" subtitle="Todo tu estudio en un lugar" close backTo="/">
      <div className="flex flex-col gap-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            remember(query);
          }}
          className="flex items-center gap-2 rounded-2xl bg-surface-container-low px-3.5 py-2.5 shadow-sm transition-colors focus-within:bg-surface-container"
        >
          <Icon name="search" size={20} className="shrink-0 text-secondary" />
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (!event.target.value.trim()) setFilter('all');
            }}
            placeholder="Busca libros, notas, tarjetas, tareas…"
            aria-label="Buscar en toda la aplicación"
            className="min-w-0 flex-1 border-0 bg-transparent p-0 font-body-md text-[15px] text-on-surface outline-none placeholder:text-secondary/70"
          />
          {query && (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={clearSearch}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-secondary hover:bg-surface-container-high"
            >
              <Icon name="close" size={17} />
            </button>
          )}
        </form>

        {!hasQuery ? (
          <>
            <section className="relative overflow-hidden rounded-2xl bg-primary-fixed/40 p-4 shadow-sm">
              <div className="pointer-events-none absolute -right-7 -top-8 h-28 w-28 rounded-full bg-primary/10" />
              <div className="relative flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface/75 text-primary shadow-sm">
                  <Icon name="travel_explore" size={22} />
                </span>
                <div>
                  <h2 className="font-headline-md text-[16px] font-semibold text-on-surface">
                    Todo lo que estudias, a un toque
                  </h2>
                  <p className="mt-1 font-caption text-[11px] leading-snug text-secondary">
                    Encuentra un capítulo, una pregunta de repaso o aquella tarea que no recuerdas dónde apuntaste.
                  </p>
                </div>
              </div>
            </section>

            {recent.length > 0 && (
              <section>
                <div className="mb-2 flex items-center justify-between px-1">
                  <h2 className="font-label-md text-[10px] font-semibold uppercase tracking-wider text-secondary">
                    Búsquedas recientes
                  </h2>
                  <button
                    type="button"
                    onClick={() => setRecent([])}
                    className="font-caption text-[10px] text-secondary hover:text-on-surface"
                  >
                    Borrar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.map((item) => (
                    <Chip key={item} icon="history" onClick={() => setQuery(item)}>
                      {item}
                    </Chip>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-2 px-1 font-label-md text-[10px] font-semibold uppercase tracking-wider text-secondary">
                Prueba a buscar
              </h2>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <Chip
                    key={suggestion}
                    icon="north_west"
                    onClick={() => {
                      setQuery(suggestion);
                      remember(suggestion);
                    }}
                  >
                    {suggestion}
                  </Chip>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-2 gap-2">
              {[
                { icon: 'auto_stories', label: 'Libros', value: data.books.length },
                { icon: 'sticky_note_2', label: 'Notas', value: data.notes.length },
                { icon: 'style', label: 'Mazos', value: data.decks.length },
                { icon: 'groups', label: 'Grupos', value: data.groups.length },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2.5 rounded-xl bg-surface-container-low p-3 shadow-sm"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed text-primary">
                    <Icon name={item.icon} size={16} />
                  </span>
                  <div>
                    <p className="font-headline-md text-[15px] font-semibold text-on-surface">{item.value}</p>
                    <p className="font-caption text-[9px] text-secondary">{item.label}</p>
                  </div>
                </div>
              ))}
            </section>

            <div className="flex items-start gap-3 rounded-xl bg-surface-container p-3.5">
              <Icon name="tips_and_updates" size={17} className="mt-0.5 text-primary" />
              <p className="font-caption text-[11px] leading-snug text-secondary">
                Consejo: busca por asignatura para ver juntos tus libros, notas y mazos de esa materia.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
              {filters.map((item) => (
                <Chip key={item.value} selected={filter === item.value} onClick={() => setFilter(item.value)}>
                  {item.label}
                  <span
                    className={`ml-0.5 font-caption text-[9px] ${
                      filter === item.value ? 'text-primary/70' : 'text-secondary/70'
                    }`}
                  >
                    {item.label === 'Todo' ? item.count : `(${item.count})`}
                  </span>
                </Chip>
              ))}
            </div>

            <div className="flex items-center justify-between px-1">
              <p className="font-caption text-[11px] text-secondary">
                {totalResults === 0
                  ? 'Sin coincidencias'
                  : `${totalResults} ${totalResults === 1 ? 'resultado' : 'resultados'} para “${query.trim()}”`}
              </p>
              <button
                type="button"
                onClick={clearSearch}
                className="font-caption text-[10px] text-primary hover:underline"
              >
                Limpiar
              </button>
            </div>

            {totalResults === 0 ? (
              <EmptyState
                icon="search_off"
                title="No encontramos nada"
                description="Prueba con una palabra más corta, el nombre de una asignatura o revisa la ortografía."
                action={
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-label-md text-[12px] font-medium text-on-primary shadow-sm active:scale-95"
                  >
                    <Icon name="restart_alt" size={16} />
                    Nueva búsqueda
                  </button>
                }
              />
            ) : visibleGroups.length === 0 ? (
              <EmptyState
                icon="filter_alt_off"
                title="Sin resultados en esta categoría"
                description="Hay coincidencias en otras secciones. Cambia el filtro para verlas."
                action={
                  <button
                    type="button"
                    onClick={() => setFilter('all')}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-label-md text-[12px] font-medium text-on-primary shadow-sm active:scale-95"
                  >
                    <Icon name="apps" size={16} />
                    Ver todo
                  </button>
                }
              />
            ) : (
              <div className="flex flex-col gap-4">
                {visibleGroups.map((group) => (
                  <section key={group.id}>
                    <div className="mb-2 flex items-center gap-2 px-1">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-fixed text-primary">
                        <Icon name={group.icon} size={13} />
                      </span>
                      <h2 className="font-label-md text-[10px] font-semibold uppercase tracking-wider text-secondary">
                        {group.label}
                      </h2>
                      <span className="ml-auto rounded-full bg-surface-container px-1.5 py-0.5 font-caption text-[9px] text-secondary">
                        {group.results.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.results.map((result) => (
                        <button
                          key={`${group.id}-${result.id}`}
                          type="button"
                          onClick={() => openResult(result)}
                          className="flex w-full items-start gap-3 rounded-xl bg-surface-container-low p-3 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.995]"
                        >
                          <span
                            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                            style={{
                              backgroundColor: result.color ? `${result.color}20` : undefined,
                              color: result.color,
                            }}
                          >
                            <Icon name={result.icon} size={18} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-body-md text-[13px] font-medium leading-snug text-on-surface">
                              <Highlight text={result.title} query={query} />
                            </span>
                            <span className="mt-0.5 line-clamp-2 block font-caption text-[10px] leading-snug text-secondary">
                              <Highlight text={result.subtitle} query={query} />
                            </span>
                          </span>
                          {result.meta && (
                            <span className="mt-0.5 max-w-[80px] shrink-0 truncate rounded-full bg-surface-container px-2 py-0.5 font-caption text-[8px] text-secondary">
                              {result.meta}
                            </span>
                          )}
                          <Icon name="chevron_right" size={16} className="mt-1.5 shrink-0 text-secondary" />
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </StackPage>
  );
}
