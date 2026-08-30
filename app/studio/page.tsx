import type { Metadata } from 'next';

import { MotusStudio } from '@/components/motus-studio';

export const metadata: Metadata = {
  title: 'Studio — Motus',
  description:
    'Build layered motion comics with a visual canvas and editable animation blocks.',
};

export default function StudioPage() {
  return <MotusStudio />;
}
