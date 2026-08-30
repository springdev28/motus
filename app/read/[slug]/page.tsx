import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { MotusReader } from '@/components/motus-reader';
import { isDevicePublicationSlug } from '@/lib/motus-device-publication';
import { getLibraryWork } from '@/lib/motus-library';

type ReaderPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ReaderPageProps): Promise<Metadata> {
  const { slug } = await params;
  const work = getLibraryWork(slug);
  if (!work) {
    if (isDevicePublicationSlug(slug)) {
      return {
        title: 'Published in this browser — Motus',
        description: 'Open an immutable Motus reader revision saved locally.',
        robots: {
          follow: false,
          index: false,
        },
      };
    }
    return {
      title: 'Work not found — Motus',
      description: 'This Motus work could not be found.',
      robots: {
        follow: false,
        index: false,
      },
    };
  }

  return {
    title: `${work.title} — Motus`,
    description: work.description,
    openGraph: {
      title: `${work.title} — Motus`,
      description: work.description,
      images: [],
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: `${work.title} — Motus`,
      description: work.description,
      images: [],
    },
  };
}

export default async function ReaderPage({ params }: ReaderPageProps) {
  const { slug } = await params;
  if (!getLibraryWork(slug) && !isDevicePublicationSlug(slug)) notFound();
  return <MotusReader slug={slug} />;
}
