/* oxlint-disable next/no-html-link-for-pages -- Stable links preserve draft recovery. */
'use client';
import { PenLine } from 'lucide-react';
import { MotusLogo } from '@/components/motus-logo';
import { MotusSettingsButton } from '@/components/motus-settings';
export function MotusSiteHeader({
  active,
}: {
  active?: 'home' | 'discover' | 'creators' | 'following';
}) {
  return (
    <header className="motus-site-header">
      <a className="motus-site-brand" aria-label="Motus home" href="/">
        <MotusLogo variant="on-light" />
        <span>
          MOTUS<small>the creative archive</small>
        </span>
      </a>
      <nav aria-label="Primary navigation">
        <a href="/" aria-current={active === 'home' ? 'page' : undefined}>
          Home
        </a>
        <a
          href="/discover"
          aria-current={active === 'discover' ? 'page' : undefined}
        >
          Explore
        </a>
        <a
          href="/discover?entity=creators"
          aria-current={active === 'creators' ? 'page' : undefined}
        >
          Creators
        </a>
        <a
          href="/discover?view=following"
          aria-current={active === 'following' ? 'page' : undefined}
        >
          Following
        </a>
      </nav>
      <div className="motus-header-actions">
        <MotusSettingsButton />
        <a href="/studio" className="motus-create-link">
          <PenLine aria-hidden="true" />
          <span>Create</span>
        </a>
      </div>
    </header>
  );
}
