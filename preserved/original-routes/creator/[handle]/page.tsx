import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { MotusCreatorProfile } from '@/components/motus-creator-profile';
import {
  MOTUS_LIBRARY_CREATORS,
  getLibraryCreatorProfile,
} from '@/lib/motus-library';

type CreatorPageProps = {
  params: Promise<{ handle: string }>;
};

export function generateStaticParams() {
  return MOTUS_LIBRARY_CREATORS.map((creator) => ({
    handle: creator.routeHandle,
  }));
}

export async function generateMetadata({
  params,
}: CreatorPageProps): Promise<Metadata> {
  const { handle } = await params;
  const profile = getLibraryCreatorProfile(handle);
  if (!profile || handle !== profile.creator.routeHandle) {
    return {
      title: 'Creator not found — Motus',
      description: 'This Motus creator profile could not be found.',
    };
  }
  return {
    title: `${profile.creator.name} (${profile.creator.displayHandle}) — Motus`,
    description: profile.creator.bio,
    alternates: {
      canonical: `/creator/${profile.creator.routeHandle}`,
    },
    openGraph: {
      title: `${profile.creator.name} — Motus creator`,
      description: profile.creator.bio,
      images: [],
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${profile.creator.name} — Motus creator`,
      description: profile.creator.bio,
      images: [],
    },
  };
}

export default async function CreatorPage({ params }: CreatorPageProps) {
  const { handle } = await params;
  const profile = getLibraryCreatorProfile(handle);
  if (!profile || handle !== profile.creator.routeHandle) notFound();
  return <MotusCreatorProfile handle={handle} />;
}
