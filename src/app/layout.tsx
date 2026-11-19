import type { Metadata, Viewport } from 'next';
import { Shell } from '@/components/Shell';
import { APP_NAME } from '@/lib/brand';
import './globals.css';

export const metadata: Metadata = { title: APP_NAME };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0f0b1a' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body><Shell>{children}</Shell></body>
    </html>
  );
}
