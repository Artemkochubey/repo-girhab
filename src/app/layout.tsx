import type { Metadata, Viewport } from 'next';
import { Shell } from '@/components/Shell';
import { APP_NAME } from '@/lib/brand';
import './globals.css';
import './magic.css';

export const metadata: Metadata = {
  title: APP_NAME,
  applicationName: APP_NAME,
  icons: { icon: '/icon-192.png', apple: '/apple-icon.png' },
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: 'black-translucent' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0c0828' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body><Shell>{children}</Shell></body>
    </html>
  );
}
