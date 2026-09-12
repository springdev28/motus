/* oxlint-disable next/no-html-link-for-pages -- Account links use stable public routes. */
'use client';
import { useEffect, useState, type SubmitEvent } from 'react';
import { usePlatform } from './motus-platform-provider';
import { BackendNotice, MotusPlatformShell } from './motus-platform-header';
import { MotusSettingsButton } from './motus-settings';
import { normalizeHandle, validateHandle } from '@/lib/motus-platform';
export function MotusAccount() {
  const { client, user, profile, loading, reloadProfile } = usePlatform();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    // oxlint-disable-next-line react/react-compiler -- Populate editable profile fields when the authenticated profile finishes loading.
    setHandle(profile?.handle || '');
    setName(profile?.display_name || '');
    setBio(profile?.bio || '');
  }, [profile]);
  async function run(action: () => Promise<string>) {
    setBusy(true);
    setNotice('');
    try {
      setNotice(await action());
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function authenticate(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!client || busy) return;
    void run(async () => {
      const result =
        mode === 'signup'
          ? await client.auth.signUp({
              email: email.trim(),
              password,
            })
          : await client.auth.signInWithPassword({
              email: email.trim(),
              password,
            });
      if (result.error) throw result.error;
      if (!result.data.session)
        throw new Error(
          'Signup is temporarily unavailable. Please try again later.',
        );
      setPassword('');
      return mode === 'signup'
        ? 'Account created. Choose your public profile below.'
        : 'Signed in.';
    });
  }
  function saveProfile(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!client || !user) return;
    void run(async () => {
      const normalized = normalizeHandle(handle);
      const invalid = validateHandle(normalized);
      if (invalid) throw new Error(invalid);
      const result = await client.from('profiles').upsert({
        id: user.id,
        handle: normalized,
        display_name: name.trim(),
        bio: bio.trim(),
      });
      if (result.error)
        throw new Error(
          result.error.code === '23505'
            ? 'That handle is already in use. Please choose another.'
            : result.error.message,
        );
      await reloadProfile();
      return 'Profile saved.';
    });
  }
  return (
    <MotusPlatformShell active="account">
      <main className="platform-main platform-account">
        <div className="platform-heading">
          <p className="basic-eyebrow">YOUR SPACE ON MOTUS</p>
          <h1>{user ? 'Your account' : 'Welcome to Motus'}</h1>
          <p>
            Keep your profile, communities, and reading preferences in one
            place.
          </p>
        </div>
        <BackendNotice />
        {notice && <output className="platform-notice">{notice}</output>}
        {!loading && !user ? (
          <section className="platform-panel">
            <div className="platform-tabs" aria-label="Account options">
              {(
                [
                  ['signin', 'Sign in'],
                  ['signup', 'Create account'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  aria-pressed={mode === value}
                  disabled={busy}
                  onClick={() => {
                    setMode(value);
                    setNotice('');
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <form onSubmit={authenticate} className="platform-form">
              <label>
                Email
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  autoComplete={
                    mode === 'signin' ? 'current-password' : 'new-password'
                  }
                  required
                  minLength={mode === 'signup' ? 12 : 1}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {mode === 'signup' && (
                  <small>
                    Use at least 12 characters. Keep your password safe;
                    password recovery is not available yet.
                  </small>
                )}
              </label>
              <button className="basic-primary" disabled={!client || busy}>
                {busy
                  ? 'Please wait…'
                  : mode === 'signup'
                    ? 'Create account'
                    : 'Sign in'}
              </button>
            </form>
          </section>
        ) : (
          user && (
            <>
              <section className="platform-panel">
                <div className="platform-row">
                  <p>
                    Signed in as <strong>{user.email}</strong>
                  </p>
                  <button
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        const result = await client!.auth.signOut();
                        if (result.error) throw result.error;
                        setPassword('');
                        return 'Signed out.';
                      })
                    }
                  >
                    Sign out
                  </button>
                </div>
                <h2>{profile ? 'Public profile' : 'Set up your profile'}</h2>
                <p>
                  Your handle, name, and bio are public. Your email stays
                  private.
                </p>
                <form className="platform-form" onSubmit={saveProfile}>
                  <label>
                    Handle
                    <input
                      required
                      minLength={3}
                      maxLength={30}
                      pattern="[a-z][a-z0-9_]{2,29}"
                      value={handle}
                      onChange={(e) =>
                        setHandle(normalizeHandle(e.target.value))
                      }
                    />
                    <small>Lowercase letters, numbers, and underscores.</small>
                  </label>
                  <label>
                    Display name
                    <input
                      required
                      maxLength={80}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </label>
                  <label>
                    About you
                    <textarea
                      rows={4}
                      maxLength={2000}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </label>
                  <button className="basic-primary" disabled={busy}>
                    Save profile
                  </button>
                </form>
                {profile && (
                  <a href={`/creators/${profile.handle}`}>
                    View your public profile →
                  </a>
                )}
              </section>
            </>
          )
        )}
        <section className="platform-panel">
          <h2>Reading & appearance</h2>
          <p>
            Choose page layout, reading direction, motion, and theme.{' '}
            {user
              ? 'Reading preferences sync to your account.'
              : 'Preferences save on this device. Sign in to sync reading preferences.'}
          </p>
          <MotusSettingsButton />
        </section>
        <div className="platform-actions">
          <a href="/library">My library</a>
          <a href="/communities">Find communities</a>
          <a href="/create">Open my drafts</a>
        </div>
      </main>
    </MotusPlatformShell>
  );
}
