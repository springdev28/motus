import type { Metadata } from 'next';

import { MotusReader } from '@/components/motus-reader';
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
    return {
      title: 'Work not found — Motus',
      description: 'This Motus work could not be found.',
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
  return <MotusReader slug={slug} />;
}
