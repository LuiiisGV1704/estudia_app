import { useState } from 'react';

import { StackPage } from '../components/layout/StackPage';
import { SubjectsManagerModal } from '../components/modals/LibraryModals';
import {
  AboutModal,
  AlgorithmModal,
  HelpModal,
  NotificationsModal,
  PomodoroModal,
  ProfileModal,
} from '../components/modals/SettingsModals';
import { ThemeModal } from '../components/modals/ThemeModal';
import { ActionRow } from '../components/ui/ActionRow';
import { IconButton } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Icon } from '../components/ui/Icon';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Switch } from '../components/ui/Switch';
import { PALETTES } from '../lib/color';
import { timeAgo, today } from '../lib/date';
import { initialsOf } from '../lib/selectors';
import { useApp } from '../state/AppProvider';
import { useSession } from '../state/SessionProvider';
import { useTheme } from '../state/ThemeProvider';

type SettingsModal =
  'profile' | 'theme' | 'pomodoro' | 'algorithm' | 'subjects' | 'notifications' | 'help' | 'about' | null;

const Divider = () => <div className="mx-3 h-px bg-outline-variant/30" />;

export default function Ajustes() {
  const { data, actions, notify } = useApp();
  const { stop } = useSession();
  const { theme, setMode, setPalette } = useTheme();
  const [modal, setModal] = useState<SettingsModal>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const activePalette = PALETTES.find((palette) => palette.id === theme.palette)?.name ?? 'Personalizada';
  const focus = data.settings.pomodoroFocus;
  const rest = data.settings.pomodoroBreak;
  const backupLabel = data.settings.lastBackup ? timeAgo(data.settings.lastBackup) : 'Todavía no hay copia';

  const close = () => setModal(null);

  const exportBackup = () => {
    if (typeof URL.createObjectURL !== 'function') {
      notify('La exportación no está disponible en este entorno', 'info');
      return;
    }
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `estudia-${today()}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      actions.updateSettings({ lastBackup: new Date().toISOString() });
      notify('Copia de seguridad descargada', 'download_done');
    } catch {
      notify('No se pudo crear la copia de seguridad', 'error');
    }
  };

  const restoreData = () => {
    stop();
    actions.resetData();
    notify('Datos de ejemplo restaurados', 'restart_alt');
  };

  return (
    <StackPage
      title="Ajustes"
      subtitle="Tu espacio, a tu manera"
      right={<IconButton icon="palette" label="Abrir personalización del tema" onClick={() => setModal('theme')} />}
    >
      <div className="flex flex-col gap-4">
        <section className="relative overflow-hidden rounded-2xl bg-primary-fixed/40 p-4 shadow-sm">
          <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-primary/10" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary font-headline-md text-[18px] font-semibold text-on-primary shadow-sm">
              {initialsOf(data.profile.name) || 'ES'}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-headline-md text-[16px] font-semibold text-on-surface">
                {data.profile.name}
              </h2>
              <p className="truncate font-caption text-[11px] text-secondary">{data.profile.email}</p>
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-surface/70 px-2 py-0.5 font-caption text-[9px] font-medium text-primary">
                <Icon name="workspace_premium" size={11} fill />
                {data.profile.plan}
              </span>
            </div>
            <IconButton icon="edit" label="Editar perfil" iconSize={18} onClick={() => setModal('profile')} />
          </div>
        </section>

        <section>
          <h2 className="mb-2 px-1 font-label-md text-[10px] font-semibold uppercase tracking-wider text-secondary">
            Apariencia
          </h2>
          <div className="rounded-2xl bg-surface-container-low p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed text-primary">
                  <Icon name="palette" size={18} />
                </span>
                <div>
                  <p className="font-body-md text-[14px] font-medium text-on-surface">Tema</p>
                  <p className="font-caption text-[10px] text-secondary">
                    {activePalette} ·{' '}
                    {theme.mode === 'system'
                      ? 'según el sistema'
                      : theme.mode === 'dark'
                        ? 'modo oscuro'
                        : 'modo claro'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModal('theme')}
                className="flex items-center gap-0.5 font-label-md text-[10px] font-medium text-primary"
              >
                Más opciones
                <Icon name="chevron_right" size={14} />
              </button>
            </div>
            <SegmentedControl
              ariaLabel="Apariencia de la aplicación"
              value={theme.mode}
              onChange={(mode) => setMode(mode)}
              options={[
                { value: 'light', label: 'Claro' },
                { value: 'dark', label: 'Oscuro' },
                { value: 'system', label: 'Sistema' },
              ]}
              compact
            />
            <div className="mt-3 grid grid-cols-4 gap-2">
              {PALETTES.map((palette) => {
                const selected = theme.palette === palette.id;
                return (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => setPalette(palette.id)}
                    aria-pressed={selected}
                    className={`flex flex-col items-center gap-1 rounded-xl border py-2 transition-all active:scale-95 ${
                      selected
                        ? 'border-primary bg-primary-fixed/30'
                        : 'border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container'
                    }`}
                  >
                    <span className="h-6 w-6 rounded-full shadow-sm" style={{ backgroundColor: palette.color }} />
                    <span className="font-caption text-[9px] font-medium text-secondary">{palette.name}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setModal('theme')}
                aria-pressed={theme.palette === 'custom'}
                className={`flex flex-col items-center gap-1 rounded-xl border py-2 transition-all active:scale-95 ${
                  theme.palette === 'custom'
                    ? 'border-primary bg-primary-fixed/30'
                    : 'border-dashed border-outline-variant/50 bg-surface-container-lowest hover:bg-surface-container'
                }`}
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-black/10"
                  style={{ backgroundColor: theme.customColor }}
                >
                  <Icon name="colorize" size={12} className="text-white drop-shadow" />
                </span>
                <span className="font-caption text-[9px] font-medium text-secondary">Personal</span>
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-2 px-1 font-label-md text-[10px] font-semibold uppercase tracking-wider text-secondary">
            Estudio
          </h2>
          <div className="overflow-hidden rounded-2xl bg-surface-container-low py-1 shadow-sm">
            <ActionRow
              icon="timer"
              title="Temporizador Pomodoro"
              description={`${focus} min de enfoque · ${rest} min de descanso`}
              value={`${data.settings.cycles} ciclos`}
              onClick={() => setModal('pomodoro')}
            />
            <Divider />
            <ActionRow
              icon="auto_awesome"
              title="Algoritmo de repaso"
              description="Programación de tus tarjetas"
              value={data.settings.algorithm}
              onClick={() => setModal('algorithm')}
            />
            <Divider />
            <ActionRow
              icon="school"
              title="Asignaturas y colores"
              description="Organiza tu contenido"
              value={`${data.subjects.length}`}
              onClick={() => setModal('subjects')}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-2 px-1 font-label-md text-[10px] font-semibold uppercase tracking-wider text-secondary">
            Recordatorios
          </h2>
          <div className="overflow-hidden rounded-2xl bg-surface-container-low py-1 shadow-sm">
            <ActionRow
              icon="notifications"
              title="Recordatorios diarios"
              description={`Mañana ${data.settings.reminderMorning} · tarde ${data.settings.reminderEvening}`}
              trailing={
                <Switch
                  checked={data.settings.notifications}
                  onChange={(checked) => {
                    actions.updateSettings({ notifications: checked });
                    notify(
                      checked ? 'Recordatorios activados' : 'Recordatorios desactivados',
                      checked ? 'notifications_active' : 'notifications_off',
                    );
                  }}
                  label="Activar recordatorios diarios"
                />
              }
            />
            <Divider />
            <ActionRow
              icon="schedule"
              title="Horarios de los avisos"
              description="Elige los dos momentos del día"
              onClick={() => setModal('notifications')}
            />
            <Divider />
            <ActionRow
              icon="volume_up"
              title="Sonidos de la app"
              description="Señales al terminar un intervalo"
              trailing={
                <Switch
                  checked={data.settings.sounds}
                  onChange={(checked) => {
                    actions.updateSettings({ sounds: checked });
                    notify(
                      checked ? 'Sonidos activados' : 'Sonidos desactivados',
                      checked ? 'volume_up' : 'volume_off',
                    );
                  }}
                  label="Activar sonidos de la aplicación"
                />
              }
            />
          </div>
        </section>

        <section>
          <h2 className="mb-2 px-1 font-label-md text-[10px] font-semibold uppercase tracking-wider text-secondary">
            Datos y respaldo
          </h2>
          <div className="overflow-hidden rounded-2xl bg-surface-container-low py-1 shadow-sm">
            <ActionRow
              icon="cloud_download"
              title="Crear copia de seguridad"
              description={backupLabel}
              onClick={exportBackup}
            />
            <Divider />
            <ActionRow
              icon="restart_alt"
              title="Restaurar datos de ejemplo"
              description="Borra los cambios guardados en este dispositivo"
              onClick={() => setResetOpen(true)}
              danger
            />
          </div>
          <p className="mt-2 px-2 font-caption text-[9px] leading-snug text-secondary/80">
            Tus datos se guardan localmente. La copia de seguridad descarga un archivo JSON con toda tu biblioteca,
            agenda, tarjetas y estadísticas.
          </p>
        </section>

        <section>
          <h2 className="mb-2 px-1 font-label-md text-[10px] font-semibold uppercase tracking-wider text-secondary">
            Más
          </h2>
          <div className="overflow-hidden rounded-2xl bg-surface-container-low py-1 shadow-sm">
            <ActionRow
              icon="help"
              title="Ayuda y atajos"
              description="Todo lo necesario para estudiar sin fricción"
              onClick={() => setModal('help')}
            />
            <Divider />
            <ActionRow
              icon="info"
              title="Acerca de Estudia"
              description="Versión 2.4.0 (Build 112)"
              onClick={() => setModal('about')}
            />
          </div>
        </section>

        <p className="pt-1 text-center font-caption text-[9px] text-secondary/70">
          Estudia · com.nubekoi.estudia · Hecho para la calma y la memoria
        </p>
      </div>

      {modal === 'profile' && <ProfileModal open onClose={close} />}
      {modal === 'theme' && <ThemeModal open onClose={close} />}
      {modal === 'pomodoro' && <PomodoroModal open onClose={close} />}
      {modal === 'algorithm' && <AlgorithmModal open onClose={close} />}
      {modal === 'subjects' && <SubjectsManagerModal open onClose={close} />}
      {modal === 'notifications' && <NotificationsModal open onClose={close} />}
      {modal === 'help' && <HelpModal open onClose={close} />}
      {modal === 'about' && <AboutModal open onClose={close} />}

      <ConfirmModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={restoreData}
        title="Restaurar datos de ejemplo"
        description={
          <>
            Se reemplazarán tus libros, notas, tareas, mazos, grupos y estadísticas por los datos de demostración.{' '}
            <strong className="text-on-surface">Esta acción no se puede deshacer.</strong>
          </>
        }
        confirmLabel="Restaurar"
        icon="restart_alt"
        danger
      />
    </StackPage>
  );
}
