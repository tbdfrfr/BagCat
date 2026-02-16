import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';
import clsx from 'clsx';
import { useOptions } from '/src/utils/optionsContext';
import fluidThemes from '../../fluid-themes.json';

const DEFAULT_SOLID_COLOR = '#000000';

const normalizeHex = (value, fallback = DEFAULT_SOLID_COLOR) => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : fallback;
};

const themes = Array.isArray(fluidThemes) ? fluidThemes : [];

export default function BackgroundSettings({ isOpen, onClose }) {
  const { options, updateOption } = useOptions();
  const fluidEnabled = options.fluidBackgroundEnabled !== false;

  const selectedThemeName = useMemo(() => {
    const fallbackName = themes[0]?.name || '';
    const requested = options.fluidThemeName;
    return themes.some((theme) => theme.name === requested) ? requested : fallbackName;
  }, [options.fluidThemeName]);

  const solidColor = normalizeHex(options.solidBackgroundColor);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-xl border border-white/15 bg-[#141d2b]/95 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/15">
          <h2 className="text-lg font-semibold">Background Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-white/10"
            aria-label="Close background settings"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(80vh-4rem)]">
          <div className="rounded-lg border border-white/15 bg-white/5 p-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={fluidEnabled}
                onChange={(event) =>
                  updateOption({
                    fluidBackgroundEnabled: event.target.checked,
                  })
                }
                className="h-4 w-4 accent-[#75b3e8]"
              />
              <span className="text-sm">Enable fluid background</span>
            </label>

            {!fluidEnabled && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs opacity-70 mb-2">Solid background color</p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={solidColor}
                    onChange={(event) =>
                      updateOption({
                        solidBackgroundColor: normalizeHex(event.target.value),
                      })
                    }
                    className="h-9 w-12 rounded border border-white/20 bg-transparent cursor-pointer"
                    aria-label="Solid background color"
                  />
                  <span className="text-sm font-mono opacity-80">{solidColor}</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">Fluid Themes</p>
            <div className="space-y-2">
              {themes.map((theme) => {
                const isSelected = selectedThemeName === theme.name;
                return (
                  <button
                    key={theme.name}
                    type="button"
                    onClick={() => updateOption({ fluidThemeName: theme.name })}
                    className={clsx(
                      'w-full flex items-center justify-between rounded-lg px-3 py-2 border transition-colors text-left',
                      isSelected
                        ? 'bg-[#75b3e81f] border-[#75b3e8]/70'
                        : 'bg-white/5 border-white/15 hover:bg-white/10',
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm truncate">{theme.name}</span>
                      {isSelected && <Check size={14} className="shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {[theme.color1, theme.color2, theme.color3].map((color, index) => (
                        <span
                          key={`${theme.name}-${index}`}
                          className="h-5 w-5 rounded-sm border border-black/20"
                          style={{ backgroundColor: color }}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
