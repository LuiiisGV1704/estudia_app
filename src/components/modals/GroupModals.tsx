import { useState } from 'react';

import { useApp } from '../../state/AppProvider';
import { Button } from '../ui/Button';
import { Field, Select, TextInput } from '../ui/Field';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateGroupModal({ open, onClose }: CreateGroupModalProps) {
  const { data, actions, notify } = useApp();
  const [name, setName] = useState('');
  const [subjectId, setSubjectId] = useState('');

  const save = () => {
    if (!name.trim()) {
      notify('Ponle un nombre al grupo', 'error');
      return;
    }
    actions.addGroup(name.trim(), subjectId || undefined);
    notify('Grupo creado. Comparte el código con tu clase.', 'group_add');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Crear grupo de estudio"
      subtitle="Un espacio privado para avanzar juntos"
      icon="group_add"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} icon="check">
            Crear grupo
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nombre del grupo">
          <TextInput
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Medicina 2025"
          />
        </Field>
        <Field label="Asignatura principal (opcional)">
          <Select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
            <option value="">Sin asignatura</option>
            {data.subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-start gap-2 rounded-xl bg-surface-container px-3 py-2.5">
          <Icon name="lock" size={16} className="mt-0.5 text-primary" />
          <p className="font-caption text-[11px] leading-snug text-secondary">
            Solo las personas con el código de 6 dígitos podrán unirse. Podrás archivar o salir del grupo cuando
            quieras.
          </p>
        </div>
      </div>
    </Modal>
  );
}

interface JoinGroupModalProps {
  open: boolean;
  onClose: () => void;
}

export function JoinGroupModal({ open, onClose }: JoinGroupModalProps) {
  const { actions, notify } = useApp();
  const [code, setCode] = useState('');

  const join = () => {
    if (code.length !== 6) {
      notify('El código debe tener 6 dígitos', 'error');
      return;
    }
    const result = actions.joinGroup(code);
    notify(result.message, result.ok ? 'celebration' : 'error');
    if (result.ok) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Unirme con código"
      subtitle="Introduce el código que compartió tu grupo"
      icon="tag"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={join} icon="login">
            Unirme
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Código de 6 dígitos">
          <TextInput
            autoFocus
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="text-center font-headline-lg text-[26px] tracking-[0.35em]"
          />
        </Field>
        <button
          type="button"
          onClick={() => setCode('842615')}
          className="flex w-full items-center justify-between rounded-xl bg-primary-fixed/40 px-3 py-2.5 text-left"
        >
          <span className="font-caption text-[11px] text-secondary">
            Código de demostración: <strong className="font-medium text-primary">842615</strong>
          </span>
          <Icon name="content_paste" size={16} className="text-primary" />
        </button>
        <p className="font-caption text-[11px] leading-relaxed text-secondary">
          Al unirte podrás ver la actividad del grupo, compartir mazos y estudiar junto a tus compañeros.
        </p>
      </div>
    </Modal>
  );
}
