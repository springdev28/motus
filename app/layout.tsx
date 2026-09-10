import type { Metadata, Viewport } from 'next';
import './globals.css';
import './motus-platform.css';
import './motus-basic.css';
import './motus-social.css';
import { MotusPlatformProvider } from '@/components/motus-platform-provider';
import { MotusSettingsProvider } from '@/components/motus-settings';
import { APPEARANCE_BOOTSTRAP } from '@/lib/motus-appearance';

const siteOrigin =
  process.env.SITE_URL ?? 'https://olive-toad-138897.hostingersite.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: 'Motus | The comic archive',
  description:
    'Upload comics, add simple animation, and read in your preferred display.',
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
    title: 'Motus | The comic archive',
    description:
      'Upload comics, add simple animation, and read in your preferred display.',
    images: [
      {
        url: '/og-v2.png',
        width: 1728,
        height: 910,
        alt: 'Motus | The comic archive.',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Motus | The comic archive',
    description:
      'Upload comics, add simple animation, and read in your preferred display.',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOTSTRAP }} />
      </head>
      <body>
        <MotusPlatformProvider>
          <MotusSettingsProvider>{children}</MotusSettingsProvider>
        </MotusPlatformProvider>
      </body>
    </html>
  );
}
