import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { BlockModal, HabitModal } from '../components/modals/StudyModals';
import { EmptyState } from '../components/ui/EmptyState';
import { Fab } from '../components/ui/Fab';
import { Icon } from '../components/ui/Icon';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import {
  addDays,
  dateKey,
  formatDuration,
  formatShortDate,
  lastNDays,
  monthLabel,
  parseKey,
  timeToMinutes,
  today,
  weekdayShort,
} from '../lib/date';
import { getSubject } from '../lib/selectors';
import { useApp } from '../state/AppProvider';
import type { StudyBlock } from '../types';

type Tab = 'plan' | 'calendar' | 'habits';

const endTime = (start: string | undefined, minutes: number): string => {
  if (!start) return '';
  const [hours, mins] = start.split(':').map(Number);
  const total = hours * 60 + mins + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const kindIcon: Record<StudyBlock['kind'], string> = {
  study: 'book',
  review: 'layers',
  exam: 'flag',
};

const habitStreak = (history: string[]): number => {
  let count = 0;
  let cursor = today();
  while (history.includes(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
};

export default function Agenda() {
  const { data, actions } = useApp();
  const location = useLocation();
  const stateDate = (location.state as { date?: string } | null)?.date;
  const stateTab = (location.state as { tab?: Tab } | null)?.tab;
  const [tab, setTab] = useState<Tab>(stateTab ?? 'plan');
  const [selectedDate, setSelectedDate] = useState(stateDate ?? today());
  const [weekOffset, setWeekOffset] = useState(() => {
    if (!stateDate) return 0;
    const base = parseKey(today());
    const mondayOffset = (base.getDay() + 6) % 7;
    const baseMonday = new Date(base.getFullYear(), base.getMonth(), base.getDate() - mondayOffset);
    return Math.round((parseKey(stateDate).getTime() - baseMonday.getTime()) / 604_800_000);
  });
  const [calendarMonth, setCalendarMonth] = useState(() => parseKey(stateDate ?? today()));
  const [unassignedOpen, setUnassignedOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [habitOpen, setHabitOpen] = useState(false);

  const baseDate = parseKey(today());
  const mondayOffset = (baseDate.getDay() + 6) % 7;
  const weekStart = addDays(today(), -mondayOffset + weekOffset * 7);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  const dayBlocks = data.blocks
    .filter((block) => block.date === selectedDate)
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  const timedBlocks = dayBlocks.filter((block) => block.start);
  const unassigned = dayBlocks.filter((block) => !block.start);
  const dayTasks = data.tasks.filter((task) => task.date === selectedDate);
  const totalMinutes = dayBlocks.reduce((sum, block) => sum + block.durationMinutes, 0);
  const doneCount = dayBlocks.filter((block) => block.done).length;
  const dayPercent = dayBlocks.length === 0 ? 0 : Math.round((doneCount / dayBlocks.length) * 100);

  const calendarStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const startOffset = (calendarStart.getDay() + 6) % 7;
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const calendarCells = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) =>
      dateKey(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), index + 1)),
    ),
  ];
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const moveMonth = (amount: number) =>
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));

  const BlockRow = ({ block, compact = false }: { block: StudyBlock; compact?: boolean }) => {
    const subject = getSubject(data.subjects, block.subjectId);
    return (
      <div
        className="relative flex items-center justify-between overflow-hidden rounded-xl bg-surface-container-low p-3 shadow-sm transition-all active:scale-[0.99]"
        style={compact ? undefined : { paddingLeft: '1.75rem' }}
      >
        <span
          className="absolute bottom-0 left-0 top-0 w-1.5 rounded-l-xl"
          style={{ backgroundColor: subject.color }}
        />
        <div className="flex min-w-0 flex-1 flex-col pr-2">
          <div className="mb-0.5 flex items-center gap-1.5">
            <Icon name={kindIcon[block.kind]} size={15} className="shrink-0" style={{ color: subject.color }} fill />
            <span
              className={`truncate font-label-md text-[14px] font-medium ${
                block.done ? 'text-secondary line-through' : 'text-on-surface'
              }`}
            >
              {block.title}
            </span>
          </div>
          <span className="truncate font-caption text-[12px] text-secondary">
            {formatDuration(block.durationMinutes)}
            {block.notes ? ` · ${block.notes}` : ''}
            {block.kind === 'exam' ? ` · Preparación ${block.progress ?? 0}%` : ''}
          </span>
        </div>
        <button
          type="button"
          aria-label={block.done ? 'Marcar como pendiente' : 'Marcar como completado'}
          aria-pressed={block.done}
          onClick={() => actions.toggleBlock(block.id)}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all active:scale-90 ${
            block.done
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container-lowest text-secondary/50 hover:bg-surface-container'
          }`}
        >
          {block.done ? (
            <Icon name="check" size={16} className="font-bold" />
          ) : (
            <span className="block h-4 w-4 rounded-full bg-surface-container-high" />
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl
        value={tab}
        onChange={setTab}
        ariaLabel="Vista de agenda"
        options={[
          { value: 'plan', label: 'Plan' },
          { value: 'calendar', label: 'Calendario' },
          { value: 'habits', label: 'Hábitos' },
        ]}
      />

      {tab === 'plan' && (
        <>
          <div className="mb-1 flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                aria-label="Semana anterior"
                onClick={() => setWeekOffset((current) => current - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-secondary hover:bg-surface-container"
              >
                <Icon name="chevron_left" size={18} />
              </button>
              <span className="font-caption text-[11px] font-medium text-secondary">
                {weekOffset === 0 ? 'Esta semana' : `Semana del ${formatShortDate(weekStart)}`}
              </span>
              <button
                type="button"
                aria-label="Semana siguiente"
                onClick={() => setWeekOffset((current) => current + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-secondary hover:bg-surface-container"
              >
                <Icon name="chevron_right" size={18} />
              </button>
            </div>
            <div className="flex items-center justify-between gap-1 rounded-xl bg-surface-container-lowest p-2 shadow-soft">
              {weekDays.map((day) => {
                const active = day === selectedDate;
                const isCurrent = day === today();
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDate(day)}
                    className={`flex flex-col items-center justify-center rounded-lg px-2 py-1.5 transition-all ${
                      active
                        ? 'scale-105 rounded-xl bg-primary text-on-primary shadow-sm'
                        : 'text-secondary hover:bg-surface-container-low'
                    }`}
                  >
                    <span
                      className={`font-caption text-[11px] leading-tight ${
                        active ? 'font-medium text-on-primary/90' : 'text-secondary'
                      }`}
                    >
                      {weekdayShort(day)}
                    </span>
                    <span
                      className={`mt-1 font-headline-md ${
                        active ? 'text-[15px] font-semibold' : 'text-[14px]'
                      } ${isCurrent && !active ? 'text-primary' : active ? '' : 'text-on-surface'}`}
                    >
                      {parseKey(day).getDate()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-3.5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed text-primary">
                <Icon name="target" size={18} />
              </div>
              <div>
                <p className="font-label-md text-label-md text-on-surface">Objetivo del día</p>
                <p className="font-caption text-caption text-secondary">
                  {dayBlocks.length} bloques · {formatDuration(totalMinutes)} estimadas
                </p>
              </div>
            </div>
            <span className="font-label-md text-label-md font-medium text-primary">{dayPercent}% listo</span>
          </div>

          <div className="flex flex-col">
            {timedBlocks.length === 0 && unassigned.length === 0 ? (
              <EmptyState
                icon="event_available"
                title="Sin bloques todavía"
                description="Planifica una sesión de estudio o repaso para este día."
                action={
                  <button
                    type="button"
                    onClick={() => setBlockOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-label-md text-[12px] font-medium text-on-primary shadow-sm active:scale-95"
                  >
                    <Icon name="add" size={16} />
                    Añadir bloque
                  </button>
                }
              />
            ) : (
              <div className="flex flex-col space-y-3">
                {timedBlocks.map((block, index) => (
                  <div key={block.id}>
                    <div className="flex items-start">
                      <div className="flex w-12 shrink-0 flex-col items-start pt-1">
                        <span className="font-caption text-[12px] font-medium text-secondary">{block.start}</span>
                        <span className="font-caption text-[10px] text-secondary/70">
                          {endTime(block.start, block.durationMinutes)}
                        </span>
                      </div>
                      <div className="ml-1 min-w-0 flex-1">
                        <BlockRow block={block} />
                      </div>
                    </div>
                    {index < timedBlocks.length - 1 && (
                      <div className="flex items-center pl-14 pt-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-surface-container-highest" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {unassigned.length > 0 && (
              <div className="mt-5 flex flex-col">
                <button
                  type="button"
                  onClick={() => setUnassignedOpen((current) => !current)}
                  className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3 shadow-sm transition-colors hover:bg-surface-container"
                  aria-expanded={unassignedOpen}
                >
                  <div className="flex items-center gap-2">
                    <Icon name="inbox" size={18} className="text-secondary" />
                    <span className="font-label-md text-label-md text-secondary">
                      Sin hora asignada ({unassigned.length})
                    </span>
                  </div>
                  <Icon
                    name="expand_more"
                    size={20}
                    className={`text-secondary transition-transform ${unassignedOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {unassignedOpen && (
                  <div className="mt-2 flex flex-col gap-2 pl-2">
                    {unassigned.map((block) => (
                      <BlockRow key={block.id} block={block} compact />
                    ))}
                  </div>
                )}
              </div>
            )}

            {dayTasks.length > 0 && (
              <div className="mt-5 flex flex-col gap-2">
                <h3 className="px-1 font-label-md text-[12px] uppercase tracking-wider text-secondary">
                  Tareas del día
                </h3>
                {dayTasks.map((task) => {
                  const subject = getSubject(data.subjects, task.subjectId);
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3 shadow-sm"
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: subject.color }} />
                      <p
                        className={`min-w-0 flex-1 truncate font-body-md text-[13px] ${
                          task.done ? 'text-secondary line-through' : 'text-on-surface'
                        }`}
                      >
                        {task.title}
                      </p>
                      <span className="font-caption text-[11px] text-secondary">{task.time ?? 'Sin hora'}</span>
                      <button
                        type="button"
                        aria-label="Alternar tarea"
                        onClick={() => actions.toggleTask(task.id)}
                        className={`flex h-6 w-6 items-center justify-center rounded-full ${
                          task.done ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-transparent'
                        }`}
                      >
                        <Icon name="check" size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'calendar' && (
        <div className="flex flex-col gap-4">
          <section className="rounded-2xl bg-surface-container-lowest p-3.5 shadow-soft">
            <div className="mb-3 flex items-center justify-between px-1">
              <button
                type="button"
                aria-label="Mes anterior"
                onClick={() => moveMonth(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-secondary hover:bg-surface-container"
              >
                <Icon name="chevron_left" size={20} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalendarMonth(parseKey(today()));
                  setSelectedDate(today());
                }}
                className="font-headline-md text-[15px] font-medium text-on-surface"
              >
                {monthLabel(calendarMonth)}
              </button>
              <button
                type="button"
                aria-label="Mes siguiente"
                onClick={() => moveMonth(1)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-secondary hover:bg-surface-container"
              >
                <Icon name="chevron_right" size={20} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((label) => (
                <span key={label} className="py-1 font-caption text-[10px] font-medium text-secondary">
                  {label}
                </span>
              ))}
              {calendarCells.map((day, index) => {
                if (!day) return <span key={`empty-${index}`} />;
                const dayBlocksCount = data.blocks.filter((block) => block.date === day).length;
                const active = day === selectedDate;
                const isCurrent = day === today();
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDate(day)}
                    className={`relative flex h-10 flex-col items-center justify-center rounded-lg text-[13px] transition-all ${
                      active
                        ? 'bg-primary font-semibold text-on-primary shadow-sm'
                        : isCurrent
                          ? 'bg-primary-fixed/40 font-medium text-primary'
                          : 'text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    {parseKey(day).getDate()}
                    {dayBlocksCount > 0 && (
                      <span className="mt-0.5 flex gap-0.5">
                        {Array.from({ length: Math.min(3, dayBlocksCount) }, (_, dotIndex) => (
                          <span
                            key={dotIndex}
                            className={`h-1 w-1 rounded-full ${active ? 'bg-on-primary/70' : 'bg-primary/60'}`}
                          />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-headline-md text-[15px] font-medium text-on-surface">
                {formatShortDate(selectedDate)}
              </h2>
              <button
                type="button"
                onClick={() => setBlockOpen(true)}
                className="flex items-center gap-0.5 font-label-md text-[11px] text-primary"
              >
                <Icon name="add" size={15} />
                Añadir
              </button>
            </div>
            {dayBlocks.length === 0 ? (
              <EmptyState
                icon="calendar_month"
                title="Nada planificado"
                description="Este día está libre. Añade un bloque cuando quieras."
              />
            ) : (
              dayBlocks.map((block) => <BlockRow key={block.id} block={block} compact />)
            )}
          </section>
        </div>
      )}

      {tab === 'habits' && (
        <div className="flex flex-col gap-3">
          {data.habits.length === 0 ? (
            <EmptyState
              icon="checklist"
              title="Crea tu primer hábito"
              description="Leer, repasar o descansar. Lo pequeño, repetido, se vuelve enorme."
              action={
                <button
                  type="button"
                  onClick={() => setHabitOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-label-md text-[12px] font-medium text-on-primary shadow-sm active:scale-95"
                >
                  <Icon name="add" size={16} />
                  Nuevo hábito
                </button>
              }
            />
          ) : (
            <>
              {data.habits.map((habit) => {
                const streak = habitStreak(habit.history);
                return (
                  <section key={habit.id} className="rounded-xl bg-surface-container-low p-3.5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-full ${
                            habit.history.includes(today())
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container text-secondary'
                          }`}
                        >
                          <Icon name={habit.icon} size={18} />
                        </span>
                        <div>
                          <p className="font-body-md text-[14px] font-medium text-on-surface">{habit.name}</p>
                          <p className="font-caption text-[11px] text-secondary">
                            {streak > 0 ? `${streak} días seguidos` : 'Empieza hoy'}
                          </p>
                        </div>
                      </div>
                      <span className="font-caption text-[11px] text-secondary">
                        {habit.history.filter((day) => lastNDays(30).includes(day)).length} / 30
                      </span>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                      {lastNDays(7).map((day) => {
                        const done = habit.history.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            aria-label={`${habit.name} ${day}`}
                            aria-pressed={done}
                            onClick={() => actions.toggleHabit(habit.id, day)}
                            className={`flex h-10 flex-col items-center justify-center rounded-lg text-[10px] transition-all active:scale-95 ${
                              done
                                ? 'bg-primary-fixed text-primary'
                                : 'bg-surface-container-lowest text-secondary hover:bg-surface-container'
                            } ${day === today() ? 'ring-1 ring-primary/40' : ''}`}
                          >
                            <span className="font-medium">{weekdayShort(day).slice(0, 1)}</span>
                            <span className="mt-0.5">
                              {done ? <Icon name="check" size={13} /> : parseKey(day).getDate()}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
              <button
                type="button"
                onClick={() => setHabitOpen(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-outline-variant py-3 font-label-md text-[12px] text-secondary transition-colors hover:bg-surface-container"
              >
                <Icon name="add" size={17} />
                Añadir otro hábito
              </button>
            </>
          )}
        </div>
      )}

      <Fab onClick={() => setBlockOpen(true)} label="Agregar bloque de estudio" />
      {blockOpen && <BlockModal open defaultDate={selectedDate} onClose={() => setBlockOpen(false)} />}
      {habitOpen && <HabitModal open onClose={() => setHabitOpen(false)} />}
    </div>
  );
}
