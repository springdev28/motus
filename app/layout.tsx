import type { Metadata } from 'next';
import './globals.css';

const siteOrigin =
  process.env.SITE_URL ?? 'https://motus-studio.baharyuksel0403.chatgpt.site';

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: 'Motus — Motion comics, made visual',
  description:
    'Build layered motion comics with a visual canvas and editable animation blocks.',
  icons: {
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    icon: [{ url: '/motus-logo-256.png', sizes: '256x256', type: 'image/png' }],
  },
  openGraph: {
    title: 'Motus — Motion comics, made visual',
    description:
      'Build layered motion comics with a visual canvas and editable animation blocks.',
    images: [
      {
        url: '/og.png',
        width: 1728,
        height: 910,
        alt: 'Motus — Motion comics, made visual.',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Motus — Motion comics, made visual',
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
