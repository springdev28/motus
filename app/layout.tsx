import type { Metadata } from 'next';
import './globals.css';

const siteOrigin = process.env.SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: 'Motus Studio — Motion comics, made visual',
  description:
    'Build layered motion comics with a visual canvas and editable animation blocks.',
  openGraph: {
    title: 'Motus Studio — Motion comics, made visual',
    description:
      'Build layered motion comics with a visual canvas and editable animation blocks.',
    images: [{ url: '/og.png', width: 1728, height: 910, alt: 'Motus — Motion comics, made visual.' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Motus Studio — Motion comics, made visual',
    description:
      'Build layered motion comics with a visual canvas and editable animation blocks.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
