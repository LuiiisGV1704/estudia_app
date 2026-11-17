import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { CreateGroupModal, JoinGroupModal } from '../components/modals/GroupModals';
import { ActionRow } from '../components/ui/ActionRow';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Modal } from '../components/ui/Modal';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { timeAgo } from '../lib/date';
import { getSubject } from '../lib/selectors';
import { useApp } from '../state/AppProvider';
import type { StudyGroup } from '../types';

type Filter = 'all' | 'live' | 'archived';

interface GruposState {
  groupId?: string;
}

function GroupDetailModal({
  group,
  onClose,
  onArchive,
  onLeave,
  onShare,
  onJoinRoom,
}: {
  group: StudyGroup;
  onClose: () => void;
  onArchive: () => void;
  onLeave: () => void;
  onShare: () => void;
  onJoinRoom: () => void;
}) {
  const { data } = useApp();
  const subject = group.subjectId ? getSubject(data.subjects, group.subjectId) : undefined;
  const extraMembers = Math.max(0, group.memberCount - group.memberInitials.length);

  return (
    <Modal
      open
      onClose={onClose}
      title={group.name}
      subtitle={`${subject?.name ?? 'Grupo de estudio'} · ${group.memberCount} miembros`}
      icon="groups"
      footer={
        <div className="flex w-full gap-2">
          <Button variant="surface" icon="share" onClick={onShare} className="flex-1">
            Compartir
          </Button>
          <Button
            icon={group.live ? 'podcasts' : 'group_add'}
            onClick={group.live ? onJoinRoom : onShare}
            className="flex-1"
          >
            {group.live ? 'Entrar a la sala' : 'Invitar'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
          <div className="flex -space-x-2">
            {group.memberInitials.map((initials) => (
              <span
                key={initials}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface-container-low bg-primary-fixed font-caption text-[10px] font-semibold text-primary"
              >
                {initials}
              </span>
            ))}
            {extraMembers > 0 && (
              <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface-container-low bg-surface-container-high font-caption text-[10px] font-semibold text-secondary">
                +{extraMembers}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-body-md text-[13px] font-medium text-on-surface">
              {group.memberCount} {group.memberCount === 1 ? 'miembro' : 'miembros'}
            </p>
            <p className="font-caption text-[11px] text-secondary">
              {group.archived ? 'Grupo archivado' : 'Activo desde'} {timeAgo(group.joinedAt)}
            </p>
          </div>
          {group.live && (
            <span className="flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 font-caption text-[10px] font-medium text-on-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-on-primary" />
              En directo
            </span>
          )}
        </div>

        {group.live && !group.archived && (
          <button
            type="button"
            onClick={onJoinRoom}
            className="flex w-full items-center gap-3 rounded-xl bg-primary-fixed/50 p-3 text-left transition-transform active:scale-[0.99]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
              <Icon name="podcasts" size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-label-md text-[13px] font-medium text-on-surface">
                Sala de estudio en directo
              </span>
              <span className="block font-caption text-[11px] text-secondary">
                Tus compañeros están concentrados ahora mismo
              </span>
            </span>
            <Icon name="arrow_forward" size={18} className="text-primary" />
          </button>
        )}

        <section>
          <h3 className="mb-2 px-1 font-label-md text-[11px] font-medium uppercase tracking-wider text-secondary">
            Actividad reciente
          </h3>
          {group.activities.length === 0 ? (
            <p className="rounded-xl bg-surface-container-low px-3 py-4 text-center font-caption text-[12px] text-secondary">
              Todavía no hay actividad en este grupo.
            </p>
          ) : (
            <div className="rounded-xl bg-surface-container-low px-3 py-1">
              {group.activities.map((activity, index) => (
                <div key={activity.id} className="flex gap-2.5 py-2.5">
                  <div className="flex flex-col items-center">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-high text-primary">
                      <Icon name={activity.icon} size={14} />
                    </span>
                    {index < group.activities.length - 1 && <span className="mt-1 w-px flex-1 bg-outline-variant/40" />}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="font-body-md text-[12px] leading-snug text-on-surface">{activity.text}</p>
                    <p className="mt-0.5 font-caption text-[10px] text-secondary">{timeAgo(activity.at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-1 border-t border-outline-variant/30 pt-2">
          <ActionRow
            icon={group.archived ? 'unarchive' : 'archive'}
            title={group.archived ? 'Restaurar grupo' : 'Archivar grupo'}
            description={
              group.archived ? 'Volver a mostrarlo entre tus grupos activos' : 'Ocultarlo sin perder la actividad'
            }
            onClick={onArchive}
          />
          <ActionRow
            icon="logout"
            title="Salir del grupo"
            description="Dejarás de ver su actividad"
            onClick={onLeave}
            danger
          />
        </section>
      </div>
    </Modal>
  );
}

export default function Grupos() {
  const { data, actions, notify } = useApp();
  const location = useLocation();
  const state = (location.state ?? null) as GruposState | null;

  const [filter, setFilter] = useState<Filter>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(state?.groupId ?? null);
  const [pendingLeave, setPendingLeave] = useState<StudyGroup | null>(null);

  const activeGroups = data.groups.filter((group) => !group.archived);
  const liveGroups = activeGroups.filter((group) => group.live);
  const archivedGroups = data.groups.filter((group) => group.archived);
  const memberInitials = [
    'YO',
    ...activeGroups
      .flatMap((group) => group.memberInitials)
      .filter((initials) => initials !== 'YO')
      .slice(0, 3),
  ];

  const groups = data.groups
    .filter((group) => {
      if (filter === 'archived') return group.archived;
      if (filter === 'live') return group.live && !group.archived;
      return !group.archived;
    })
    .sort((a, b) => Number(b.live) - Number(a.live) || b.joinedAt.localeCompare(a.joinedAt));

  const selectedGroup = selectedId ? data.groups.find((group) => group.id === selectedId) : undefined;

  const shareGroup = async (group: StudyGroup) => {
    const link = `https://estudia.app/grupos/${group.id}`;
    try {
      await navigator.clipboard.writeText(link);
      notify('Enlace del grupo copiado', 'link');
    } catch {
      notify('Enlace del grupo: ' + link, 'link');
    }
  };

  const toggleArchive = (group: StudyGroup) => {
    actions.toggleGroupArchive(group.id);
    notify(group.archived ? 'Grupo restaurado' : 'Grupo archivado', group.archived ? 'unarchive' : 'archive');
  };

  const requestLeave = (group: StudyGroup) => {
    setSelectedId(null);
    setPendingLeave(group);
  };

  const confirmLeave = () => {
    if (!pendingLeave) return;
    actions.removeGroup(pendingLeave.id);
    notify(`Saliste de ${pendingLeave.name}`, 'logout');
    setPendingLeave(null);
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <section className="relative overflow-hidden rounded-2xl bg-primary-fixed/40 p-4 shadow-sm">
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10" />
        <div className="pointer-events-none absolute -bottom-10 right-12 h-20 w-20 rounded-full bg-primary/5" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface/80 px-2.5 py-1 font-caption text-[10px] font-medium text-primary shadow-sm">
            <Icon name="diversity_3" size={13} />
            Aprender juntos
          </span>
          <h2 className="mt-2 font-headline-lg text-[24px] font-semibold leading-tight text-on-surface">
            La constancia compartida
            <br />
            se vuelve hábito
          </h2>
          <p className="mt-1 font-caption text-[12px] text-secondary">
            {activeGroups.length} {activeGroups.length === 1 ? 'grupo activo' : 'grupos activos'}
            {liveGroups.length > 0 ? ` · ${liveGroups.length} en directo ahora` : ' · nadie en directo todavía'}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {memberInitials.map((initials) => (
                  <span
                    key={initials}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary-fixed bg-surface-container-lowest font-caption text-[9px] font-semibold text-primary"
                  >
                    {initials}
                  </span>
                ))}
              </div>
              <span className="font-caption text-[10px] text-secondary">
                {activeGroups.reduce((total, group) => total + group.memberCount, 0)} estudiantes
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="surface" icon="tag" onClick={() => setJoinOpen(true)}>
                Unirme
              </Button>
              <Button size="sm" icon="group_add" onClick={() => setCreateOpen(true)}>
                Crear
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SegmentedControl
        ariaLabel="Filtrar grupos"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: `Mis grupos (${activeGroups.length})` },
          { value: 'live', label: `En directo (${liveGroups.length})` },
          { value: 'archived', label: `Archivados (${archivedGroups.length})` },
        ]}
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={filter === 'live' ? 'podcasts' : filter === 'archived' ? 'inventory_2' : 'groups'}
          title={
            filter === 'live'
              ? 'Nadie está en directo ahora'
              : filter === 'archived'
                ? 'No hay grupos archivados'
                : 'Tu primer grupo te espera'
          }
          description={
            filter === 'live'
              ? 'Cuando alguien inicie una sala de estudio, la verás aquí.'
              : filter === 'archived'
                ? 'Archiva un grupo para retirarlo de tu lista sin perder su actividad.'
                : 'Crea un espacio privado para compartir mazos, dudas y sesiones de concentración.'
          }
          action={
            filter === 'archived' ? undefined : (
              <div className="flex gap-2">
                <Button variant="surface" icon="tag" onClick={() => setJoinOpen(true)}>
                  Unirme con código
                </Button>
                <Button icon="group_add" onClick={() => setCreateOpen(true)}>
                  Crear grupo
                </Button>
              </div>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {groups.map((group) => {
            const subject = group.subjectId ? getSubject(data.subjects, group.subjectId) : undefined;
            const latest = group.activities[0];
            const extra = Math.max(0, group.memberCount - group.memberInitials.length);
            return (
              <article
                key={group.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(group.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') setSelectedId(group.id);
                }}
                className={`cursor-pointer rounded-xl bg-surface-container-low p-3.5 shadow-sm transition-all hover:shadow-md active:scale-[0.995] ${
                  group.archived ? 'opacity-75' : ''
                } ${group.live && !group.archived ? 'ring-1 ring-primary/25' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: subject ? `${subject.color}20` : 'rgb(var(--c-primary-fixed))',
                      color: subject?.color ?? 'rgb(var(--c-primary))',
                    }}
                  >
                    <Icon name={subject?.icon ?? 'groups'} size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate font-body-md text-[14px] font-medium text-on-surface">{group.name}</h3>
                      {group.live && !group.archived && (
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-1.5 py-0.5 font-caption text-[9px] font-medium text-on-primary">
                          <span className="h-1 w-1 animate-pulse rounded-full bg-on-primary" />
                          Directo
                        </span>
                      )}
                      {group.archived && (
                        <span className="shrink-0 rounded-full bg-surface-container-high px-1.5 py-0.5 font-caption text-[9px] font-medium text-secondary">
                          Archivado
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 font-caption text-[11px] text-secondary">
                      {subject?.name ?? 'Sin asignatura'} · {group.memberCount} miembros
                    </p>
                  </div>
                  <Icon name="more_horiz" size={19} className="mt-0.5 shrink-0 text-secondary" />
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex -space-x-1.5">
                    {group.memberInitials.slice(0, 3).map((initials) => (
                      <span
                        key={initials}
                        className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface-container-low bg-surface-container-high font-caption text-[8px] font-semibold text-on-surface-variant"
                      >
                        {initials}
                      </span>
                    ))}
                    {extra > 0 && (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface-container-low bg-primary-fixed font-caption text-[8px] font-semibold text-primary">
                        +{extra}
                      </span>
                    )}
                  </div>
                  {latest ? (
                    <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
                      <Icon name={latest.icon} size={13} className="shrink-0 text-primary" />
                      <span className="truncate font-caption text-[10px] text-secondary">{latest.text}</span>
                      <span className="shrink-0 font-caption text-[9px] text-secondary/70">· {timeAgo(latest.at)}</span>
                    </div>
                  ) : (
                    <span className="font-caption text-[10px] text-secondary">Sin actividad todavía</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <section className="flex items-center gap-3 rounded-xl bg-surface-container p-3.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-primary">
          <Icon name="tips_and_updates" size={18} />
        </span>
        <p className="font-caption text-[11px] leading-snug text-secondary">
          Estudiar en grupo funciona mejor con objetivos claros. Comparte un mazo antes de empezar y cierra la sesión
          con una pregunta en voz alta.
        </p>
      </section>

      {createOpen && <CreateGroupModal open onClose={() => setCreateOpen(false)} />}
      {joinOpen && <JoinGroupModal open onClose={() => setJoinOpen(false)} />}
      {selectedGroup && (
        <GroupDetailModal
          group={selectedGroup}
          onClose={() => setSelectedId(null)}
          onArchive={() => toggleArchive(selectedGroup)}
          onLeave={() => requestLeave(selectedGroup)}
          onShare={() => shareGroup(selectedGroup)}
          onJoinRoom={() => {
            setSelectedId(null);
            notify(`Entraste a la sala de ${selectedGroup.name}`, 'podcasts');
          }}
        />
      )}
      <ConfirmModal
        open={Boolean(pendingLeave)}
        onClose={() => setPendingLeave(null)}
        onConfirm={confirmLeave}
        title="Salir del grupo"
        description={
          <>
            ¿Quieres salir de <strong className="text-on-surface">{pendingLeave?.name}</strong>? Podrás volver a unirte
            con un código de invitación.
          </>
        }
        confirmLabel="Salir"
        icon="logout"
        danger
      />
    </div>
  );
}
