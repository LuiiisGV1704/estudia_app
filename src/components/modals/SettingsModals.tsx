import { useState } from 'react';

import { useApp } from '../../state/AppProvider';
import { Button } from '../ui/Button';
import { Field, Select, TextInput } from '../ui/Field';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { Switch } from '../ui/Switch';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { data, actions, notify } = useApp();
  const [name, setName] = useState(data.profile.name);
  const [email, setEmail] = useState(data.profile.email);
  const [plan, setPlan] = useState(data.profile.plan);

  const save = () => {
    if (!name.trim() || !email.trim()) {
      notify('Completa tu nombre y correo', 'error');
      return;
    }
    actions.updateProfile({ name: name.trim(), email: email.trim(), plan });
    notify('Perfil actualizado', 'person_check');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar perfil"
      subtitle="Tu identidad dentro de Estudia"
      icon="person"
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
        <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed font-headline-md text-primary">
            {name
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join('')}
          </div>
          <div className="min-w-0">
            <p className="truncate font-body-md text-[14px] font-medium text-on-surface">{name || 'Tu nombre'}</p>
            <p className="truncate font-caption text-[11px] text-secondary">{email}</p>
          </div>
        </div>
        <Field label="Nombre completo">
          <TextInput value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Correo electrónico">
          <TextInput type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Field label="Plan">
          <Select value={plan} onChange={(event) => setPlan(event.target.value)}>
            <option value="Plan Estudiante Pro">Plan Estudiante Pro</option>
            <option value="Plan Gratuito">Plan Gratuito</option>
            <option value="Plan Docente">Plan Docente</option>
          </Select>
        </Field>
      </div>
    </Modal>
  );
}

interface PomodoroModalProps {
  open: boolean;
  onClose: () => void;
}

export function PomodoroModal({ open, onClose }: PomodoroModalProps) {
  const { data, actions, notify } = useApp();
  const [focus, setFocus] = useState(data.settings.pomodoroFocus);
  const [rest, setRest] = useState(data.settings.pomodoroBreak);
  const [cycles, setCycles] = useState(data.settings.cycles);

  const save = () => {
    actions.updateSettings({
      pomodoroFocus: Math.min(120, Math.max(5, focus)),
      pomodoroBreak: Math.min(30, Math.max(1, rest)),
      cycles: Math.min(8, Math.max(1, cycles)),
    });
    notify('Preferencias Pomodoro guardadas', 'timer');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Temporizador Pomodoro"
      subtitle="Ajusta tus intervalos de concentración"
      icon="timer"
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
        <div className="grid grid-cols-2 gap-3">
          <Field label="Enfoque (min)">
            <TextInput
              type="number"
              min={5}
              max={120}
              value={focus}
              onChange={(event) => setFocus(Number(event.target.value))}
            />
          </Field>
          <Field label="Descanso (min)">
            <TextInput
              type="number"
              min={1}
              max={30}
              value={rest}
              onChange={(event) => setRest(Number(event.target.value))}
            />
          </Field>
        </div>
        <Field label="Intervalos por ciclo" hint="Los puntos bajo el temporizador reflejan este ciclo.">
          <Select value={cycles} onChange={(event) => setCycles(Number(event.target.value))}>
            {[2, 3, 4, 5, 6, 7, 8].map((value) => (
              <option key={value} value={value}>
                {value} intervalos
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-center gap-2 rounded-xl bg-surface-container px-3 py-2.5">
          <Icon name="info" size={16} className="text-primary" />
          <p className="font-caption text-[11px] text-secondary">
            Los cambios se aplican al siguiente intervalo que inicies.
          </p>
        </div>
      </div>
    </Modal>
  );
}

interface AlgorithmModalProps {
  open: boolean;
  onClose: () => void;
}

export function AlgorithmModal({ open, onClose }: AlgorithmModalProps) {
  const { data, actions, notify } = useApp();
  const [algorithm, setAlgorithm] = useState(data.settings.algorithm);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Algoritmo de tarjetas"
      subtitle="Cómo se programan tus repasos"
      icon="layers"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              actions.updateSettings({ algorithm });
              notify('Algoritmo actualizado', 'auto_awesome');
              onClose();
            }}
            icon="check"
          >
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-2.5">
        {[
          {
            value: 'FSRS v4.5' as const,
            title: 'FSRS v4.5',
            text: 'Programación adaptativa basada en tu memoria. Recomendado.',
          },
          {
            value: 'SM-2' as const,
            title: 'SM-2',
            text: 'El clásico de SuperMemo. Intervalos simples y predecibles.',
          },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setAlgorithm(option.value)}
            className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all ${
              algorithm === option.value
                ? 'border-primary bg-primary-fixed/40'
                : 'border-outline-variant/40 bg-surface-container-low'
            }`}
          >
            <span
              className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${
                algorithm === option.value ? 'border-primary bg-primary text-on-primary' : 'border-outline'
              }`}
            >
              {algorithm === option.value && <Icon name="check" size={13} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-body-md text-[14px] font-medium text-on-surface">{option.title}</span>
              <span className="mt-0.5 block font-caption text-[11px] leading-snug text-secondary">{option.text}</span>
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

interface NotificationsModalProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationsModal({ open, onClose }: NotificationsModalProps) {
  const { data, actions, notify } = useApp();
  const [enabled, setEnabled] = useState(data.settings.notifications);
  const [morning, setMorning] = useState(data.settings.reminderMorning);
  const [evening, setEvening] = useState(data.settings.reminderEvening);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Notificaciones"
      subtitle="Recordatorios amables, nunca insistentes"
      icon="notifications"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              actions.updateSettings({
                notifications: enabled,
                reminderMorning: morning,
                reminderEvening: evening,
              });
              notify(enabled ? 'Recordatorios guardados' : 'Recordatorios desactivados', 'notifications');
              onClose();
            }}
            icon="check"
          >
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-3">
          <div>
            <p className="font-body-md text-[14px] font-medium text-on-surface">Recordatorios diarios</p>
            <p className="font-caption text-[11px] text-secondary">Dos momentos para volver al ritmo</p>
          </div>
          <Switch checked={enabled} onChange={setEnabled} label="Activar recordatorios" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Recordatorio de la mañana">
            <TextInput
              type="time"
              value={morning}
              disabled={!enabled}
              onChange={(event) => setMorning(event.target.value)}
            />
          </Field>
          <Field label="Recordatorio de la tarde">
            <TextInput
              type="time"
              value={evening}
              disabled={!enabled}
              onChange={(event) => setEvening(event.target.value)}
            />
          </Field>
        </div>
        <div className="flex items-start gap-2 rounded-xl bg-surface-container px-3 py-2.5">
          <Icon name="bedtime" size={16} className="mt-0.5 text-primary" />
          <p className="font-caption text-[11px] leading-snug text-secondary">
            Los recordatorios respetan el modo No molestar de tu dispositivo.
          </p>
        </div>
      </div>
    </Modal>
  );
}

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  const shortcuts = [
    { keys: 'Espacio', text: 'Pausar o reanudar la sesión de enfoque' },
    { keys: 'R', text: 'Reiniciar el temporizador' },
    { keys: 'Esc', text: 'Cerrar cualquier ventana o visor' },
    { keys: 'Enter', text: 'Guardar el formulario abierto' },
  ];
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ayuda y atajos"
      subtitle="Todo lo que necesitas para estudiar sin fricción"
      icon="help"
      footer={
        <Button onClick={onClose} className="w-full">
          Entendido
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl bg-surface-container-low">
          {shortcuts.map((item, index) => (
            <div key={item.keys}>
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <span className="font-body-md text-[13px] text-on-surface">{item.text}</span>
                <kbd className="rounded-md bg-surface-container-high px-2 py-0.5 font-mono text-[11px] text-on-surface-variant">
                  {item.keys}
                </kbd>
              </div>
              {index < shortcuts.length - 1 && <div className="ml-3 h-px bg-outline-variant/30" />}
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-primary-fixed/40 p-3.5">
          <p className="font-label-md text-[12px] font-medium text-on-surface">Consejo de estudio</p>
          <p className="mt-1 font-caption text-[11px] leading-relaxed text-on-surface-variant">
            Repasa en el límite del olvido. Diez minutos conscientes valen más que una hora de relectura pasiva.
          </p>
        </div>
      </div>
    </Modal>
  );
}

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

export function AboutModal({ open, onClose }: AboutModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Acerca de Estudia"
      subtitle="Versión 2.4.0 (Build 112)"
      icon="info"
      footer={
        <Button onClick={onClose} className="w-full">
          Cerrar
        </Button>
      }
    >
      <div className="space-y-4 text-center">
        <div className="flex flex-col items-center gap-2 py-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-primary-float">
            <Icon name="auto_stories" size={32} fill />
          </div>
          <p className="font-headline-md text-headline-md font-semibold text-on-surface">Estudia</p>
          <p className="max-w-[280px] font-caption text-[12px] leading-relaxed text-secondary">
            Un espacio personal para leer, repasar y concentrarte. Diseñado para la calma y la memoria a largo plazo.
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low p-3 text-left">
          <div className="flex items-center justify-between py-1">
            <span className="font-caption text-[12px] text-secondary">Aplicación</span>
            <span className="font-label-md text-[12px] text-on-surface">com.nubekoi.estudia</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="font-caption text-[12px] text-secondary">Plataforma</span>
            <span className="font-label-md text-[12px] text-on-surface">Web · Android · iOS</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="font-caption text-[12px] text-secondary">Motor de repaso</span>
            <span className="font-label-md text-[12px] text-on-surface">FSRS / SM-2</span>
          </div>
        </div>
        <p className="font-caption text-[11px] text-secondary/60">Hecho con cariño para quienes estudian.</p>
      </div>
    </Modal>
  );
}
