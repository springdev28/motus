import type { Metadata } from 'next';

import { MotusDiscover } from '@/components/motus-discover';

export const metadata: Metadata = {
  title: 'Explore motion comics — Motus',
  description:
    'Search motion comics, creators, communities, tags, fandoms, and characters in the Motus library.',
};

export default function DiscoverPage() {
  return <MotusDiscover />;
}
