import type { Metadata, Viewport } from 'next';
import './globals.css';

const siteOrigin =
  process.env.SITE_URL ?? 'https://motus-studio.baharyuksel0403.chatgpt.site';

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: 'Motus — Motion comics, made visual',
  description:
    'Build layered motion comics with a visual canvas and editable animation blocks.',
  icons: {
    apple: [{ url: '/apple-touch-icon-v2.png', sizes: '180x180' }],
    icon: [
      { url: '/favicon-v2.svg', type: 'image/svg+xml' },
      { url: '/favicon-v2-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-v2-16.png', sizes: '16x16', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/motus-mask-icon-v2.svg',
        color: '#7b2cff',
      },
    ],
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'Motus — Motion comics, made visual',
    description:
      'Build layered motion comics with a visual canvas and editable animation blocks.',
    images: [
      {
        url: '/og-v2.png',
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
    images: ['/og-v2.png'],
  },
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#7b2cff',
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
