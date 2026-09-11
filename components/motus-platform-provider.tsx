'use client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import {
  createClient,
  type SupabaseClient,
  type User,
} from '@supabase/supabase-js';
import {
  DEFAULT_READING_PREFERENCES,
  READING_PREFERENCES_KEY,
  parseReadingPreferences,
  type PlatformProfile,
  type ReadingPreferences,
} from '@/lib/motus-platform';

type PlatformContextValue = {
  client: SupabaseClient | null;
  user: User | null;
  profile: PlatformProfile | null;
  loading: boolean;
  emailReady: boolean;
  error: string;
  preferences: ReadingPreferences;
  savePreferences: (p: ReadingPreferences) => Promise<void>;
  reloadProfile: () => Promise<void>;
};
const Context = createContext<PlatformContextValue | null>(null);
export function usePlatform() {
  const value = useContext(Context);
  if (!value) throw new Error('Motus platform provider is missing.');
  return value;
}
export function MotusPlatformProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PlatformProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailReady, setEmailReady] = useState(false);
  const [error, setError] = useState('');
  const [preferences, setPreferences] = useState(DEFAULT_READING_PREFERENCES);
  const preferenceRevision = useRef(0);
  const userId = user?.id;
  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    try {
      // oxlint-disable-next-line react/react-compiler -- Restore preferences from browser storage after hydration.
      setPreferences(
        parseReadingPreferences(
          JSON.parse(localStorage.getItem(READING_PREFERENCES_KEY) || 'null'),
        ),
      );
    } catch {
      /* Use reading defaults when local storage is unavailable. */
    }
    async function connect() {
      try {
        const response = await fetch('/api/platform/config');
        if (!response.ok)
          throw new Error(
            'Account services could not be reached. Please try again.',
          );
        const config = (await response.json()) as {
          configured: boolean;
          emailReady: boolean;
          url: string;
          publishableKey: string;
        };
        if (!active || !config.configured) return;
        const sdk = createClient(config.url, config.publishableKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        });
        setClient(sdk);
        setEmailReady(config.emailReady === true);
        const { data } = sdk.auth.onAuthStateChange((_event, session) => {
          if (_event === 'PASSWORD_RECOVERY') {
            try {
              sessionStorage.setItem('motus:password-recovery', 'true');
            } catch {
              /* Recovery can also be detected by the account screen. */
            }
          }
          if (active) setUser(session?.user ?? null);
        });
        unsubscribe = () => data.subscription.unsubscribe();
        const session = await sdk.auth.getSession();
        if (session.error) throw session.error;
        if (active) setUser(session.data.session?.user ?? null);
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    }
    void connect();
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);
  const reloadProfile = useCallback(async () => {
    if (!client || !userId) {
      setProfile(null);
      return;
    }
    const result = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (result.error) throw result.error;
    setProfile(result.data as PlatformProfile | null);
  }, [client, userId]);
  useEffect(() => {
    let active = true;
    if (!client || !userId) {
      // oxlint-disable-next-line react/react-compiler -- Clear the previous account profile when the external session ends.
      setProfile(null);
      return;
    }
    const revision = preferenceRevision.current;
    void Promise.all([
      client.from('profiles').select('*').eq('id', userId).maybeSingle(),
      client
        .from('reading_preferences')
        .select('settings')
        .eq('user_id', userId)
        .maybeSingle(),
    ])
      .then(([profileResult, settingsResult]) => {
        if (!active) return;
        if (profileResult.error) setError(profileResult.error.message);
        else {
          setProfile(profileResult.data as PlatformProfile | null);
          setError('');
        }
        if (settingsResult.error)
          setError(
            'Reading preferences could not be synced. Please try again.',
          );
        if (settingsResult.data && revision === preferenceRevision.current) {
          const value = parseReadingPreferences(settingsResult.data.settings);
          setPreferences(value);
          try {
            localStorage.setItem(
              READING_PREFERENCES_KEY,
              JSON.stringify(value),
            );
          } catch {
            /* Account preference is still available. */
          }
        }
      })
      .catch((e) => {
        if (active) setError((e as Error).message);
      });
    return () => {
      active = false;
    };
  }, [client, userId]);
  async function savePreferences(value: ReadingPreferences) {
    preferenceRevision.current += 1;
    const next = parseReadingPreferences(value);
    setPreferences(next);
    let localFailed = false;
    try {
      localStorage.setItem(READING_PREFERENCES_KEY, JSON.stringify(next));
    } catch {
      localFailed = true;
    }
    if (client && user) {
      const result = await client
        .from('reading_preferences')
        .upsert({ user_id: user.id, settings: next });
      if (result.error) throw result.error;
    } else if (localFailed)
      throw new Error(
        'Applied for this visit, but this browser could not save your preferences.',
      );
  }
  return (
    <Context.Provider
      value={{
        client,
        user,
        profile: profile?.id === userId ? profile : null,
        loading,
        emailReady,
        error,
        preferences,
        savePreferences,
        reloadProfile,
      }}
    >
      {children}
    </Context.Provider>
  );
}
