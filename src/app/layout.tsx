import type { Metadata, Viewport } from 'next';
import Providers from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: '팀대시 | TeamDash',
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/ayaan-fonts/Freesentation/fonts/webfonts/Freesentation.css"
        />
      </head>
      <body className="bg-[var(--td-bg)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
