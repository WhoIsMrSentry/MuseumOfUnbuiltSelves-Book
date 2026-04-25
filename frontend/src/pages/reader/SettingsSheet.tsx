import { X } from 'lucide-react';
import { SETTING_GROUPS, useSettingsStore, type SettingsState } from '@/store/settings';

export default function SettingsSheet({ onClose, entered }: { onClose: () => void; entered: boolean }) {
  const update = useSettingsStore((s) => s.update);
  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
        entered ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-[var(--card)] px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-3 transition-transform duration-200 ease-out sm:px-6 ${
          entered ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold">Ayarlar</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-white/[0.08] active:scale-95"
          >
            <X size={16} />
          </button>
        </div>
        {(Object.keys(SETTING_GROUPS) as (keyof SettingsState)[]).map((k) => (
          <SettingsRow key={k} settingKey={k} onChange={(v) => update({ [k]: v } as Partial<SettingsState>)} />
        ))}
      </div>
    </div>
  );
}

function SettingsRow<K extends keyof SettingsState>({ settingKey, onChange }: {
  settingKey: K; onChange: (v: SettingsState[K]) => void;
}) {
  const value = useSettingsStore((s) => s[settingKey]);
  const group = SETTING_GROUPS[settingKey];
  return (
    <div className="mt-5">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-[var(--muted)]">{group.label}</p>
      <div className="grid grid-flow-col auto-cols-fr gap-1.5 rounded-full bg-white/[0.04] p-1">
        {group.options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value as SettingsState[K])}
              className={`rounded-full px-3 py-2 text-sm font-medium transition-colors active:scale-95 ${
                active
                  ? 'bg-[var(--text)] text-[var(--bg)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
