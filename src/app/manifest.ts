import type { MetadataRoute } from 'next';
import { APP_NAME } from '@/lib/brand';

/** Манифест: сайт можно добавить на главный экран телефона как приложение (полный экран, своя иконка). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: 'Семейный RPG-трекер: тренировки, учёба, привычки, квесты и босс недели',
    lang: 'ru',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f0b1a',
    theme_color: '#0f0b1a',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
