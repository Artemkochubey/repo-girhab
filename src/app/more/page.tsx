'use client';
import Link from 'next/link';
import { useGame } from '@/components/Shell';
import { MORE_ITEMS } from '@/lib/nav';

export default function More() {
  const { s } = useGame();
  const me = s.members.find((m) => m.id === s.me);
  return (
    <>
      <h1 className="title">☰ Ещё</h1>
      <p className="muted">Остальные разделы игры. Главное (сегодня, бой, герой, добыча) находится на вкладках внизу.</p>
      <div className="more-grid">
        {MORE_ITEMS.filter((i) => !i.parent || s.parent).map((i) => (
          <Link key={i.href} href={i.href} className="more-card"><span className="mi">{i.emoji}</span><b>{i.title}</b><small>{i.text}</small></Link>
        ))}
      </div>
      {me && <p className="muted small">Вы вошли как {me.emoji} {me.name}. Сменить героя и войти как родитель можно в шапке сайта.</p>}
    </>
  );
}
