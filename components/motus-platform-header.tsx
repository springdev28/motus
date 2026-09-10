/* oxlint-disable next/no-html-link-for-pages -- Stable URLs also work for reader shares. */
'use client';
import type { ReactNode } from 'react';
import { MotusLogo } from './motus-logo';
import { MotusSettingsButton } from './motus-settings';
import { usePlatform } from './motus-platform-provider';
export function MotusPlatformHeader({
  active,
  onNavigate,
}: {
  active?: string;
  onNavigate?: (href: string) => void;
}) {
  const { user, profile } = usePlatform();
  const link = (href: string, label: string, key: string) => (
    <a
      href={href}
      aria-current={active === key ? 'page' : undefined}
      onClick={(e) => {
        if (onNavigate) {
          e.preventDefault();
          onNavigate(href);
        }
      }}
    >
      {label}
    </a>
  );
  return (
    <header className="basic-header platform-header">
      <a
        href="/"
        className="basic-brand"
        aria-label="Motus home"
        onClick={(e) => {
          if (onNavigate) {
            e.preventDefault();
            onNavigate('/');
          }
        }}
      >
        <MotusLogo className="basic-logo-light" variant="on-light" />
        <MotusLogo className="basic-logo-dark" variant="on-dark" />
        <span>
          MOTUS<span className="basic-brand-sub">THE COMIC ARCHIVE</span>
        </span>
      </a>
      <nav aria-label="Main">
        {link('/browse', 'Browse', 'browse')}
        {link('/communities', 'Communities', 'communities')}
        {link('/creators', 'Creators', 'creators')}
        {link('/library', 'My library', 'library')}
        {link(
          '/account',
          user ? profile?.display_name || 'My account' : 'Sign in',
          'account',
        )}
        <MotusSettingsButton />
      </nav>
    </header>
  );
}
export function MotusPlatformShell({
  active,
  children,
}: {
  active?: string;
  children: ReactNode;
}) {
  return (
    <div className="basic-app">
      <MotusPlatformHeader active={active} />
      {children}
      <footer className="basic-footer">
        <span>
          motus <span>· A little motion. A lot of story.</span>
        </span>
        <a href="/account">Account & preferences</a>
      </footer>
    </div>
  );
}
export function BackendNotice() {
  const { client, loading, error } = usePlatform();
  if (loading) return <output className="platform-notice">Connecting…</output>;
  if (client && !error) return null;
  return (
    <p className="platform-notice">
      {error ||
        'Account and community services are being connected. Your local comics and editor are still available.'}
    </p>
  );
}
