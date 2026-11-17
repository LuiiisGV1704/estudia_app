import { useState } from 'react';

import { StackPage } from '../components/layout/StackPage';
import { ActionRow } from '../components/ui/ActionRow';
import { Icon } from '../components/ui/Icon';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import {
  addDays,
  dateKey,
  daysUntil,
  formatDuration,
  formatShortDate,
  lastNDays,
  monthShort,
  parseKey,
  today,
  weekdayShort,
} from '../lib/date';
import { getSubject, nextExam } from '../lib/selectors';
import { useApp } from '../state/AppProvider';
import type { StudyLog } from '../types';

type Range = 'week' | 'month' | 'year';

interface ChartPoint {
  key: string;
  label: string;
  minutes: number;
  current?: boolean;
}

const RANGE_LABEL: Record<Range, string> = {
  week: 'Últimos 7 días',
  month: 'Últimos 30 días',
  year: 'Último año',
};

const RANGE_DAYS: Record<Range, number> = { week: 7, month: 30, year: 365 };
const numberFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
const integerFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });

const totalOf = (logs: StudyLog[], key: 'minutes' | 'pages' | 'reviews' | 'correct'): number =>
  logs.reduce((sum, log) => sum + log[key], 0);

const currentStreak = (logs: StudyLog[]): number => {
  const active = new Set(logs.filter((log) => log.minutes > 0).map((log) => log.date));
  let cursor = active.has(today()) ? today() : addDays(today(), -1);
  let streak = 0;
  while (active.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
};

const longestStreak = (logs: StudyLog[]): number => {
  const active = [...new Set(logs.filter((log) => log.minutes > 0).map((log) => log.date))].sort();
  let best = 0;
  let running = 0;
  active.forEach((date, index) => {
    running = index > 0 && addDays(active[index - 1], 1) === date ? running + 1 : 1;
    best = Math.max(best, running);
  });
  return best;
};

const buildChart = (range: Range, logs: StudyLog[]): ChartPoint[] => {
  const logByDate = new Map(logs.map((log) => [log.date, log]));
  if (range === 'year') {
    const now = parseKey(today());
    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
      const minutes = logs
        .filter((log) => {
          const logDate = parseKey(log.date);
          return logDate.getFullYear() === date.getFullYear() && logDate.getMonth() === date.getMonth();
        })
        .reduce((sum, log) => sum + log.minutes, 0);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: monthShort(dateKey(date)),
        minutes,
        current: date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth(),
      };
    });
  }

  const days = lastNDays(RANGE_DAYS[range]);
  return days.map((day, index) => ({
    key: day,
    label:
      range === 'week'
        ? weekdayShort(day).slice(0, 2)
        : index % 5 === 0 || index === days.length - 1
          ? String(parseKey(day).getDate())
          : '',
    minutes: logByDate.get(day)?.minutes ?? 0,
    current: day === today(),
  }));
};

export default function Estadisticas() {
  const { data } = useApp();
  const [range, setRange] = useState<Range>('week');

  const rangeDays = RANGE_DAYS[range];
  const selectedStart = addDays(today(), -(rangeDays - 1));
  const previousStart = addDays(selectedStart, -rangeDays);
  const previousEnd = addDays(selectedStart, -1);
  const rangeLogs = data.logs.filter((log) => log.date >= selectedStart && log.date <= today());
  const previousLogs = data.logs.filter((log) => log.date >= previousStart && log.date <= previousEnd);

  const minutes = totalOf(rangeLogs, 'minutes');
  const previousMinutes = totalOf(previousLogs, 'minutes');
  const reviews = totalOf(rangeLogs, 'reviews');
  const correct = totalOf(rangeLogs, 'correct');
  const pages = totalOf(rangeLogs, 'pages');
  const activeDays = rangeLogs.filter((log) => log.minutes > 0).length;
  const retention = reviews === 0 ? 0 : Math.round((correct / reviews) * 100);
  const averageMinutes = activeDays === 0 ? 0 : Math.round(minutes / activeDays);
  const streak = currentStreak(data.logs);
  const bestStreak = longestStreak(data.logs);
  const trend =
    previousMinutes === 0
      ? minutes === 0
        ? 0
        : null
      : Math.round(((minutes - previousMinutes) / previousMinutes) * 100);

  const chart = buildChart(range, rangeLogs);
  const maxChart = Math.max(1, ...chart.map((point) => point.minutes));
  const bestDay = rangeLogs.reduce<StudyLog | undefined>(
    (best, log) => (!best || log.minutes > best.minutes ? log : best),
    undefined,
  );

  const minutesBySubject: Record<string, number> = {};
  rangeLogs.forEach((log) => {
    Object.entries(log.minutesBySubject).forEach(([subjectId, value]) => {
      minutesBySubject[subjectId] = (minutesBySubject[subjectId] ?? 0) + value;
    });
  });
  const subjectTotal = Object.values(minutesBySubject).reduce((sum, value) => sum + value, 0);
  const subjectRows = Object.entries(minutesBySubject)
    .map(([subjectId, value]) => ({
      subject: getSubject(data.subjects, subjectId),
      minutes: value,
      percent: subjectTotal === 0 ? 0 : Math.round((value / subjectTotal) * 100),
    }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 5);

  const heatDays = lastNDays(84);
  const heatLogByDate = new Map(data.logs.map((log) => [log.date, log]));
  const heatClass = (day: string): string => {
    const logMinutes = heatLogByDate.get(day)?.minutes ?? 0;
    if (logMinutes === 0) return 'bg-surface-container-high';
    if (logMinutes < 40) return 'bg-primary/20';
    if (logMinutes < 80) return 'bg-primary/35';
    if (logMinutes < 120) return 'bg-primary/55';
    if (logMinutes < 160) return 'bg-primary/75';
    return 'bg-primary';
  };

  const exam = nextExam(data.blocks);
  const examSubject = exam ? getSubject(data.subjects, exam.subjectId) : undefined;
  const examDays = exam ? daysUntil(exam.date) : 0;
  const examLabel = examDays <= 0 ? 'Hoy' : examDays === 1 ? 'Mañana' : `En ${examDays} días`;

  const summary = [
    {
      icon: 'style',
      label: 'Repasos',
      value: integerFormat.format(reviews),
      detail: 'tarjetas',
    },
    {
      icon: 'track_changes',
      label: 'Retención',
      value: `${retention}%`,
      detail: 'aciertos',
    },
    {
      icon: 'menu_book',
      label: 'Páginas',
      value: integerFormat.format(pages),
      detail: 'leídas',
    },
    {
      icon: 'local_fire_department',
      label: 'Racha',
      value: `${streak}`,
      detail: streak === 1 ? 'día' : 'días',
    },
  ];

  return (
    <StackPage title="Estadísticas" subtitle="Tu progreso, sin juicios">
      <div className="flex flex-col gap-4">
        <SegmentedControl
          ariaLabel="Periodo de las estadísticas"
          value={range}
          onChange={setRange}
          options={[
            { value: 'week', label: 'Semana' },
            { value: 'month', label: 'Mes' },
            { value: 'year', label: 'Año' },
          ]}
        />

        <section className="relative overflow-hidden rounded-2xl bg-primary-fixed/40 p-4 shadow-sm">
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10" />
          <div className="pointer-events-none absolute -bottom-12 right-16 h-24 w-24 rounded-full bg-primary/5" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface/75 px-2.5 py-1 font-caption text-[9px] font-medium text-primary">
                <Icon name="schedule" size={12} />
                Tiempo de estudio
              </span>
              <div className="mt-2 flex items-end gap-1.5">
                <span className="font-headline-lg text-[40px] font-semibold leading-none tracking-tight text-primary">
                  {numberFormat.format(minutes / 60)}
                </span>
                <span className="pb-1 font-label-md text-[12px] text-secondary">horas</span>
              </div>
              <p className="mt-1 font-caption text-[10px] text-secondary">
                {RANGE_LABEL[range]} · {formatDuration(minutes)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 font-caption text-[10px] font-medium ${
                  trend === null || trend >= 0
                    ? 'bg-primary text-on-primary'
                    : 'bg-error-container text-on-error-container'
                }`}
              >
                <Icon name={trend === null ? 'auto_awesome' : trend >= 0 ? 'trending_up' : 'trending_down'} size={12} />
                {trend === null ? 'Nuevo' : `${trend > 0 ? '+' : ''}${trend}%`}
              </span>
              <span className="text-right font-caption text-[8px] leading-tight text-secondary/80">
                vs. periodo
                <br />
                anterior
              </span>
            </div>
          </div>

          <div className="relative mt-4 grid grid-cols-3 gap-2">
            {[
              {
                icon: 'local_fire_department',
                value: `${streak} ${streak === 1 ? 'día' : 'días'}`,
                label: 'Racha actual',
              },
              { icon: 'event_available', value: `${activeDays}`, label: 'Días activos' },
              {
                icon: 'avg_pace',
                value: `${averageMinutes} min`,
                label: 'Promedio diario',
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-surface/65 px-2 py-2 text-center">
                <Icon name={stat.icon} size={14} className="mx-auto mb-0.5 text-primary" />
                <p className="truncate font-label-md text-[11px] font-semibold text-on-surface">{stat.value}</p>
                <p className="font-caption text-[8px] text-secondary">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-surface-container-low p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-headline-md text-[15px] font-medium text-on-surface">Actividad de estudio</h2>
              <p className="mt-0.5 font-caption text-[10px] text-secondary">
                Minutos por {range === 'year' ? 'mes' : 'día'}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-surface-container px-2 py-0.5 font-caption text-[9px] text-secondary">
              Máx. {maxChart} min
            </span>
          </div>

          <div className="mt-4 flex h-36 items-end gap-1">
            {chart.map((point) => (
              <div key={point.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className={`w-full rounded-t-[3px] transition-all ${
                      point.minutes === 0
                        ? 'bg-surface-container-high'
                        : point.current
                          ? 'bg-primary'
                          : 'bg-primary/55 hover:bg-primary/75'
                    }`}
                    style={{
                      height: point.minutes === 0 ? '3px' : `${Math.max(6, (point.minutes / maxChart) * 100)}%`,
                    }}
                    title={`${point.key} · ${point.minutes} min`}
                    aria-label={`${point.key}: ${point.minutes} minutos`}
                  />
                </div>
                <span
                  className={`h-3 overflow-hidden text-center font-caption text-[8px] leading-3 ${
                    point.current ? 'font-semibold text-primary' : 'text-secondary'
                  }`}
                >
                  {point.label}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-center font-caption text-[9px] text-secondary">
            {minutes === 0
              ? 'Aún no hay minutos registrados en este periodo'
              : `${formatDuration(minutes)} repartidos en ${activeDays} ${activeDays === 1 ? 'día activo' : 'días activos'}`}
          </p>
        </section>

        <section className="grid grid-cols-2 gap-2">
          {summary.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-2.5 rounded-xl bg-surface-container-low p-3 shadow-sm"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
                <Icon name={stat.icon} size={18} />
              </span>
              <div className="min-w-0">
                <p className="truncate font-headline-md text-[17px] font-semibold leading-tight text-on-surface">
                  {stat.value}
                </p>
                <p className="font-caption text-[9px] text-secondary">
                  {stat.label} · {stat.detail}
                </p>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-2xl bg-surface-container-low p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-headline-md text-[15px] font-medium text-on-surface">Mapa de constancia</h2>
              <p className="mt-0.5 font-caption text-[10px] text-secondary">Últimas 12 semanas de estudio</p>
            </div>
            <Icon name="calendar_view_week" size={19} className="text-primary" />
          </div>
          <div className="mt-4 flex justify-center">
            <div className="grid grid-flow-col grid-rows-7 gap-1">
              {heatDays.map((day) => {
                const logMinutes = heatLogByDate.get(day)?.minutes ?? 0;
                return (
                  <span
                    key={day}
                    className={`h-3.5 w-3.5 rounded-[3px] ${heatClass(day)}`}
                    title={`${formatShortDate(day)} · ${logMinutes} min`}
                    aria-label={`${formatShortDate(day)}: ${logMinutes} minutos`}
                  />
                );
              })}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="font-caption text-[9px] text-secondary">{activeDays} días activos en el periodo</span>
            <div className="flex items-center gap-1">
              <span className="font-caption text-[8px] text-secondary">Menos</span>
              {['bg-surface-container-high', 'bg-primary/20', 'bg-primary/35', 'bg-primary/55', 'bg-primary'].map(
                (color) => (
                  <span key={color} className={`h-2.5 w-2.5 rounded-[2px] ${color}`} />
                ),
              )}
              <span className="font-caption text-[8px] text-secondary">Más</span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-surface-container-low p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-headline-md text-[15px] font-medium text-on-surface">Tiempo por asignatura</h2>
              <p className="mt-0.5 font-caption text-[10px] text-secondary">Dónde has puesto tu atención</p>
            </div>
            <span className="font-caption text-[9px] text-secondary">{RANGE_LABEL[range]}</span>
          </div>
          {subjectRows.length === 0 ? (
            <p className="mt-4 rounded-xl bg-surface-container-lowest px-3 py-4 text-center font-caption text-[11px] text-secondary">
              Sin datos de asignaturas para este periodo.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {subjectRows.map((row) => (
                <div key={row.subject.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: `${row.subject.color}20`,
                        color: row.subject.color,
                      }}
                    >
                      <Icon name={row.subject.icon} size={14} />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-body-md text-[12px] font-medium text-on-surface">
                      {row.subject.name}
                    </span>
                    <span className="shrink-0 font-caption text-[10px] text-secondary">
                      {formatDuration(row.minutes)}
                    </span>
                    <span className="w-7 shrink-0 text-right font-label-md text-[10px] font-semibold text-on-surface">
                      {row.percent}%
                    </span>
                  </div>
                  <ProgressBar
                    value={row.percent}
                    height="h-1.5"
                    color={row.subject.color}
                    trackClassName="bg-surface-container-high"
                    className="mt-1.5"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 px-1 font-label-md text-[10px] font-semibold uppercase tracking-wider text-secondary">
            Lo que dicen tus datos
          </h2>
          <div className="overflow-hidden rounded-2xl bg-surface-container-low py-1 shadow-sm">
            <ActionRow
              icon="event_available"
              title={bestDay ? formatShortDate(bestDay.date) : 'Sin datos todavía'}
              description="Tu día más productivo del periodo"
              value={bestDay ? `${bestDay.minutes} min` : '—'}
            />
            <div className="mx-3 h-px bg-outline-variant/30" />
            <ActionRow
              icon="local_fire_department"
              title="Racha más larga"
              description={`Racha actual: ${streak} ${streak === 1 ? 'día' : 'días'}`}
              value={`${bestStreak} ${bestStreak === 1 ? 'día' : 'días'}`}
            />
            <div className="mx-3 h-px bg-outline-variant/30" />
            <ActionRow
              icon="flag"
              title={exam ? `${exam.title}` : 'Sin exámenes próximos'}
              description={examSubject ? examSubject.name : 'Añade un examen en la agenda'}
              value={exam ? examLabel : '—'}
            />
          </div>
        </section>

        <div className="flex items-start gap-3 rounded-xl bg-primary-fixed/30 p-3.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest text-primary">
            <Icon name="insights" size={18} />
          </span>
          <p className="font-caption text-[11px] leading-snug text-secondary">
            {minutes === 0
              ? 'Empieza con una sesión de diez minutos. Las estadísticas importan menos que volver mañana.'
              : `Has estudiado una media de ${averageMinutes} minutos por día activo. La constancia pesa más que las sesiones heroicas.`}
          </p>
        </div>
      </div>
    </StackPage>
  );
}
