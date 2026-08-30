import type { Metadata } from 'next';

import { MotusDiscover } from '@/components/motus-discover';

export const metadata: Metadata = {
  title: 'Explore motion comics — Motus',
  description:
    'Search motion comics, creators, communities, tags, fandoms, and characters; filter works by genre, origin, community, format, status, and rating.',
};

export default function DiscoverPage() {
  return <MotusDiscover />;
}
