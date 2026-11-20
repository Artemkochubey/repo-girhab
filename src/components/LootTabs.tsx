'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LOOT_TABS } from '@/lib/nav';

/** Переключатель внутри «Добычи»: сумка и сундуки или магазин. */
export function LootTabs() {
  const path = usePathname();
  return (
    <nav className="subtabs" aria-label="Добыча">
      {LOOT_TABS.map((t) => <Link key={t.href} href={t.href} className={path === t.href ? 'on' : ''}>{t.emoji} {t.label}</Link>)}
    </nav>
  );
}
