import { ShieldAlert, UsersRound } from 'lucide-react';

import type {
  ContentRating,
  MotusProjectFormat,
  MotusWorkMetadata,
} from '@/lib/motus-model';

const statusLabels = {
  ongoing: 'Ongoing',
  completed: 'Completed',
  hiatus: 'Hiatus',
} as const;

const originLabels = {
  original: 'Original work',
  'motus-fanwork': 'Motus fanwork',
  'external-fanwork': 'External fanwork',
} as const;

const ratingLabels: Record<ContentRating, string> = {
  'all-ages': 'General',
  teen: 'Teen',
  mature: 'Mature',
  'adults-only': 'Adults only',
};

type MotusWorkMetadataSummaryProps = {
  contentRating: ContentRating;
  description?: string;
  format: MotusProjectFormat;
  metadata: MotusWorkMetadata;
  mode?: 'compact' | 'full';
  tone?: 'dark' | 'light';
};

export function MotusWorkMetadataSummary({
  contentRating,
  description,
  format,
  metadata,
  mode = 'full',
  tone = 'light',
}: MotusWorkMetadataSummaryProps) {
  const sourceLabel =
    metadata.origin === 'motus-fanwork'
      ? metadata.sourceTitle
        ? `Based on ${metadata.sourceTitle}${metadata.sourceCreator ? ` by ${metadata.sourceCreator}` : ''}`
        : 'Motus source work not selected'
      : metadata.origin === 'external-fanwork'
        ? metadata.sourceTitle
          ? `Fanwork of ${metadata.sourceTitle}${metadata.sourceCreator ? ` · ${metadata.sourceCreator}` : ''}`
          : metadata.fandom
            ? `Fanwork · ${metadata.fandom}`
            : 'External source not named'
        : metadata.origin === null && metadata.fandom
          ? `Fanwork · ${metadata.fandom}`
          : null;
  const factGroups = [
    ['Characters', metadata.characters],
    ['Relationships', metadata.relationships],
    ['Themes', metadata.themes],
    ['Communities', metadata.communityLinks],
  ] as const;

  return (
    <section
      aria-label="Work metadata"
      className="work-metadata-summary"
      data-mode={mode}
      data-tone={tone}
    >
      <div className="work-metadata-badges">
        {metadata.workStatus ? (
          <span>{statusLabels[metadata.workStatus]}</span>
        ) : null}
        {metadata.origin ? <span>{originLabels[metadata.origin]}</span> : null}
        <span>
          {format === 'spread'
            ? 'Two-page spread'
            : format === 'page'
              ? 'Page by page'
              : 'Vertical scroll'}
        </span>
        <span data-rating={contentRating}>{ratingLabels[contentRating]}</span>
      </div>

      {metadata.contributorNames.length ? (
        <p className="work-metadata-creators">
          <UsersRound aria-hidden="true" />
          <span>
            {metadata.contributorNames.length === 1 ? 'Creator' : 'Creators'}
          </span>
          <strong>{metadata.contributorNames.join(', ')}</strong>
        </p>
      ) : null}

      {mode === 'full' && description ? (
        <p className="work-metadata-description">{description}</p>
      ) : null}

      {sourceLabel ? (
        <p className="work-metadata-source">{sourceLabel}</p>
      ) : null}

      {metadata.genres.length ? (
        <div aria-label="Genres" className="work-metadata-chips">
          {metadata.genres
            .slice(0, mode === 'compact' ? 2 : undefined)
            .map((genre) => (
              <span key={genre}>{genre}</span>
            ))}
          {mode === 'compact' && metadata.genres.length > 2 ? (
            <span>+{metadata.genres.length - 2}</span>
          ) : null}
        </div>
      ) : null}

      {metadata.contentWarnings.length ? (
        <div className="work-metadata-warnings" role="note">
          <ShieldAlert aria-hidden="true" />
          <div>
            <strong>Content warnings</strong>
            <span>{metadata.contentWarnings.join(' · ')}</span>
          </div>
        </div>
      ) : null}

      {mode === 'full' ? (
        <dl className="work-metadata-facts">
          {factGroups.map(([label, values]) =>
            values.length ? (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{values.join(' · ')}</dd>
              </div>
            ) : null,
          )}
        </dl>
      ) : null}
    </section>
  );
}
