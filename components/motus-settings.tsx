'use client';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Settings2, Sun, Moon, Monitor } from 'lucide-react';
import { usePlatform } from './motus-platform-provider';
import type { ReadingPreferences } from '@/lib/motus-platform';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  APPEARANCE_KEY,
  parseAppearance,
  resolveAppearance,
  type Appearance,
} from '@/lib/motus-appearance';

const SettingsContext = createContext<() => void>(() => {});
export function MotusSettingsButton() {
  const open = useContext(SettingsContext);
  return (
    <button
      className="motus-settings-button"
      aria-label="Settings"
      onClick={open}
      type="button"
    >
      <Settings2 aria-hidden="true" />
      <span>Settings</span>
    </button>
  );
}
export function MotusSettingsProvider({ children }: { children: ReactNode }) {
  const { preferences, savePreferences, user } = usePlatform();
  const [open, setOpen] = useState(false);
  const [preferenceBusy, setPreferenceBusy] = useState(false);
  async function updatePreferences(patch: Partial<ReadingPreferences>) {
    setPreferenceBusy(true);
    try {
      await savePreferences({ ...preferences, ...patch });
      setNotice(
        user
          ? 'Reading preferences saved to your account.'
          : 'Reading preferences saved on this device.',
      );
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setPreferenceBusy(false);
    }
  }
  const [appearance, setAppearance] = useState<Appearance>('light');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    let preference: Appearance = 'light';
    function apply() {
      const theme = resolveAppearance(preference, media.matches);
      document.documentElement.dataset.theme = theme;
      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.style.colorScheme = theme;
    }
    function load() {
      try {
        preference = parseAppearance(localStorage.getItem(APPEARANCE_KEY));
      } catch {
        setNotice(
          'Appearance changes work for this page, but this browser cannot save them.',
        );
      }
      setAppearance(preference);
      apply();
    }
    function sync(event: StorageEvent) {
      if (event.key === APPEARANCE_KEY || event.key === null) load();
    }
    function change(event: Event) {
      preference = (event as CustomEvent<Appearance>).detail;
      apply();
    }
    load();
    window.addEventListener('storage', sync);
    window.addEventListener('motus-appearance', change);
    media.addEventListener('change', apply);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('motus-appearance', change);
      media.removeEventListener('change', apply);
    };
  }, []);
  function choose(value: Appearance) {
    setAppearance(value);
    window.dispatchEvent(
      new CustomEvent('motus-appearance', { detail: value }),
    );
    try {
      localStorage.setItem(APPEARANCE_KEY, value);
      setNotice('Appearance saved for all Motus pages on this device.');
    } catch {
      setNotice(
        'Applied for this page. Browser storage is unavailable, so it cannot be saved.',
      );
    }
  }
  return (
    <SettingsContext.Provider value={() => setOpen(true)}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="motus-settings-dialog">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Make Motus comfortable for you. Preferences apply across the
              library, profiles, reader, and editor.
            </DialogDescription>
          </DialogHeader>
          <fieldset className="appearance-options">
            <legend>Appearance</legend>
            {(
              [
                ['light', 'Light', Sun, 'Paper and ink'],
                ['dark', 'Dark', Moon, 'A softer evening view'],
                [
                  'system',
                  'Use device setting',
                  Monitor,
                  'Follow your system appearance',
                ],
              ] as const
            ).map(([value, label, Icon, description]) => (
              <label key={value} data-selected={appearance === value}>
                <input
                  type="radio"
                  name="appearance"
                  value={value}
                  checked={appearance === value}
                  onChange={() => choose(value)}
                />
                <Icon aria-hidden="true" />
                <span>
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <p className="settings-hint">
            Light is the default. Colors change automatically only when you
            choose “Use device setting.” Artwork keeps the creator’s original
            colors.
          </p>
          <fieldset
            className="platform-form platform-settings"
            disabled={preferenceBusy}
          >
            <legend>Reading preferences</legend>
            <label>
              Default display
              <select
                value={preferences.format}
                onChange={(e) =>
                  void updatePreferences({
                    format: e.target.value as ReadingPreferences['format'],
                  })
                }
              >
                <option value="creator">Use the creator’s layout</option>
                <option value="scroll">Vertical scroll</option>
                <option value="page">Single page</option>
                <option value="spread">Two-page spread</option>
              </select>
            </label>
            <label>
              Reading direction
              <select
                value={preferences.direction}
                onChange={(e) =>
                  void updatePreferences({
                    direction: e.target
                      .value as ReadingPreferences['direction'],
                  })
                }
              >
                <option value="creator">Use the creator’s direction</option>
                <option value="ltr">Left to right</option>
                <option value="rtl">Right to left</option>
              </select>
            </label>
            <label className="platform-check">
              <input
                type="checkbox"
                checked={preferences.motion}
                onChange={(e) =>
                  void updatePreferences({ motion: e.target.checked })
                }
              />
              Play comic animations
            </label>
            <label className="platform-check">
              <input
                type="checkbox"
                checked={preferences.rememberPosition}
                onChange={(e) =>
                  void updatePreferences({ rememberPosition: e.target.checked })
                }
              />
              Remember my page on this device
            </label>
          </fieldset>
          <output aria-live="polite">{notice}</output>
        </DialogContent>
      </Dialog>
    </SettingsContext.Provider>
  );
}
