import type { Metadata, Viewport } from 'next';
import { Shell } from '@/components/Shell';
import { APP_NAME } from '@/lib/brand';
import './globals.css';
import './magic.css';
import './tvmode.css';
import { TVMode } from '@/components/TVMode';

export const metadata: Metadata = {
  title: APP_NAME,
  applicationName: APP_NAME,
  icons: { icon: '/icon-192.png', apple: '/apple-icon.png' },
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: 'black-translucent' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0c0828' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-tv="on" suppressHydrationWarning>
      <head>
        {/* ТВ-режим включён по умолчанию; выбор «мышиного» режима (?tv=0 или клавиша M) применяется до первой отрисовки, без мигания */}
        <script dangerouslySetInnerHTML={{ __html: "try{var q=new URLSearchParams(location.search).get('tv');var s=localStorage.getItem('mr_tv_mode');if(q==='0'||q==='off'||q==='mouse'||(q!=='1'&&q!=='on'&&s==='0'))document.documentElement.dataset.tv='off'}catch(e){}" }} />
      </head>
      <body><Shell>{children}</Shell><TVMode /></body>
    </html>
  );
}
