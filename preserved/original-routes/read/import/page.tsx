import type { Metadata } from 'next';
import { MotusImportEdition } from '@/components/motus-import-edition';
export const metadata: Metadata = {
  title: 'Open a shared edition — Motus',
  description:
    'Experience a creator’s shared Motus reader edition, with artwork and interactive motion.',
};
export default function ImportEditionPage() {
  return <MotusImportEdition />;
}
