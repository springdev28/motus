'use client';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Settings2, Sun, Moon, Monitor } from 'lucide-react';
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
  const [open, setOpen] = useState(false);
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
              library, profiles, reader, and Studio.
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
          <output aria-live="polite">{notice}</output>
        </DialogContent>
      </Dialog>
    </SettingsContext.Provider>
  );
}
