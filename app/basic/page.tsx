import type { Metadata } from 'next';
import { MotusBasic } from '@/components/motus-basic';
export const metadata: Metadata = {
  title: 'Motus | The comic archive',
  description:
    'Upload comics, add simple animation, and read in your preferred display.',
};
export default function BasicPage() {
  return <MotusBasic />;
}
