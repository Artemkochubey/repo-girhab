'use client';
import Link from 'next/link';
import { useGame } from '@/components/Shell';
import { MORE_ITEMS } from '@/lib/nav';
import { resetHints } from '@/components/Hints';
import { useEffect, useState } from 'react';
import { playSound, setSoundEnabled, soundEnabled } from '@/lib/sound';

export default function More() {
  const { s, toast } = useGame();
  const me = s.members.find((m) => m.id === s.me);
  const [sound, setSound] = useState(false);
  useEffect(() => { setSound(soundEnabled()); }, []);
  const toggleSound = () => { const on = !sound; setSoundEnabled(on); setSound(on); if (on) playSound('levelup', true); };
  return (
    <>
      <h1 className="title">☰ Ещё</h1>
      <p className="muted">Остальные разделы игры. Главное (сегодня, бой, герой, добыча) находится на вкладках внизу.</p>
      <div className="more-grid">
        {MORE_ITEMS.filter((i) => !i.parent || s.parent).map((i) => (
          <Link key={i.href} href={i.href} className="more-card"><span className="mi">{i.emoji}</span><b>{i.title}</b><small>{i.text}</small></Link>
        ))}
      </div>
      <button className={`btn ${sound ? '' : 'ghost'}`} onClick={toggleSound} aria-pressed={sound}>{sound ? '🔊 Звуки включены на этом устройстве' : '🔇 Включить звуки на этом устройстве'}</button>
      <button className="btn ghost" onClick={() => { resetHints(); toast('💡 Подсказки снова включены на всех вкладках'); }}>💡 Показать подсказки для новичков снова</button>
      {me && <p className="muted small">Вы вошли как {me.emoji} {me.name}. Сменить героя и войти как родитель можно в шапке сайта.</p>}
    </>
  );
}
