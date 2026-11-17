import { useState } from 'react';

import { PALETTES } from '../../lib/color';
import { useTheme } from '../../state/ThemeProvider';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { SegmentedControl } from '../ui/SegmentedControl';

interface ThemeModalProps {
  open: boolean;
  onClose: () => void;
}

export function ThemeModal({ open, onClose }: ThemeModalProps) {
  const { theme, setMode, setPalette, setCustomColor, dark } = useTheme();
  const [custom, setCustom] = useState(theme.customColor);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tema y paleta"
      subtitle="Personaliza el color de toda tu aplicación"
      icon="palette"
      footer={
        <Button onClick={onClose} icon="check" className="w-full">
          Listo
        </Button>
      }
    >
      <div className="space-y-5">
        <section>
          <p className="mb-2 font-label-md text-[12px] font-medium text-on-surface-variant">Apariencia</p>
          <SegmentedControl
            ariaLabel="Apariencia"
            value={theme.mode}
            onChange={(value) => setMode(value)}
            options={[
              { value: 'light', label: 'Claro' },
              { value: 'dark', label: 'Oscuro' },
              { value: 'system', label: 'Sistema' },
            ]}
          />
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <p className="font-label-md text-[12px] font-medium text-on-surface-variant">Paleta de color</p>
            <span className="font-caption text-[11px] text-secondary">{dark ? 'Modo oscuro' : 'Modo claro'}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PALETTES.map((palette) => {
              const selected = theme.palette === palette.id;
              return (
                <button
                  key={palette.id}
                  type="button"
                  onClick={() => setPalette(palette.id)}
                  className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all active:scale-[0.98] ${
                    selected
                      ? 'border-primary bg-primary-fixed/40'
                      : 'border-outline-variant/40 bg-surface-container-low hover:bg-surface-container'
                  }`}
                >
                  <span
                    className="h-8 w-8 shrink-0 rounded-full shadow-sm"
                    style={{ backgroundColor: palette.color }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-label-md text-[12px] font-medium text-on-surface">
                      {palette.name}
                    </span>
                    <span className="block font-caption text-[10px] text-secondary">
                      {selected ? 'Activa' : 'Tocar para aplicar'}
                    </span>
                  </span>
                  {selected && <Icon name="check_circle" size={18} className="text-primary" fill />}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-label-md text-[12px] font-medium text-on-surface">Color personalizado</p>
              <p className="font-caption text-[11px] text-secondary">
                Genera una paleta completa desde tu color favorito
              </p>
            </div>
            <label
              className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-surface-container-lowest shadow-sm"
              style={{ backgroundColor: custom }}
            >
              <input
                type="color"
                value={custom}
                aria-label="Elegir color personalizado"
                onChange={(event) => {
                  setCustom(event.target.value);
                  setCustomColor(event.target.value);
                }}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <Icon name="colorize" size={17} className="text-white drop-shadow" />
            </label>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="font-caption text-[11px] text-secondary">Vista previa</span>
            <span className="h-4 w-4 rounded-full bg-primary" />
            <span className="h-4 w-4 rounded-full bg-primary-fixed" />
            <span className="h-4 w-4 rounded-full bg-primary-container" />
            <span className="h-4 w-4 rounded-full bg-surface-container" />
            <span className="ml-auto rounded-full bg-primary px-3 py-1 font-label-md text-[10px] text-on-primary">
              Estudia
            </span>
          </div>
        </section>

        <div className="flex items-center gap-2 rounded-xl bg-surface-container px-3 py-2.5">
          <Icon name="lightbulb" size={17} className="text-primary" />
          <p className="font-caption text-[11px] leading-snug text-secondary">
            El tema se aplica a todas las pantallas y se guarda en este dispositivo.
          </p>
        </div>
      </div>
    </Modal>
  );
}
