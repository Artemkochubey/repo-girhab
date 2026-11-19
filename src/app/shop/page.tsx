'use client';
import { useState } from 'react';
import { useGame } from '@/components/Shell';
import { Section } from '@/components/ui';
import type { ShopItemDto } from '@/lib/client';

const STATUS = { pending: '⏳ Ждёт выдачи', done: '✔ Выдано', cancelled: '✖ Отменено (цена возвращена)' } as const;
const price = (c: string, n: number) => (c === 'chests' ? `${n} 🎁` : `${n} очков`);

export default function Shop() {
  const { s, act, toast } = useGame();
  const d = s.detail!;
  const [confirm, setConfirm] = useState<number | null>(null);
  const items = s.shop.items;
  const mine = s.shop.purchases.filter((p) => s.parent || p.memberId === s.me);
  const nameOf = (id: number) => s.members.find((m) => m.id === id);

  const buy = async (it: ShopItemDto) => {
    try { await act('buyItem', { itemId: it.id }); toast(`Куплено: ${it.emoji} ${it.name}. Родитель выдаст награду.`); } catch { /* toast уже показан */ }
    setConfirm(null);
  };
  const cost = (it: ShopItemDto) => (it.currency === 'points' ? Math.max(1, Math.round(it.price * (1 - (d.shopDiscount ?? 0)))) : it.price);
  const lack = (it: ShopItemDto) => it.currency === 'chests' ? Math.max(0, it.price - d.chests.available) : Math.max(0, cost(it) - d.wallet.balance);

  return (
    <>
      <h1 className="title">🛍 Магазин наград</h1>
      <section className="card wallet">
        <div><small className="muted">Очки</small><b>{d.wallet.balance}</b></div>
        <div><small className="muted">Сундуки</small><b>{d.chests.available} 🎁</b></div>
        <p className="muted small grow">Очки копятся за всё, что ты делаешь. Покупка тратит очки, но уровень не падает.</p>
      </section>

      <Section title="Награды">
        {items.length === 0 && <p className="muted">В магазине пока пусто. {s.parent ? 'Добавьте награды в «Настройках» → «Магазин».' : 'Попроси родителей добавить награды.'}</p>}
        <div className="shop">
          {items.map((it) => {
            const need = lack(it);
            return (
              <div key={it.id} className="item">
                <div className="item-ico">{it.emoji}</div>
                <div className="grow"><b>{it.name}</b>{it.description && <small className="desc">{it.description}</small>}</div>
                {confirm === it.id ? (
                  <div className="row">
                    <button className="btn" onClick={() => buy(it)}>Да, купить</button>
                    <button className="btn ghost" onClick={() => setConfirm(null)}>Нет</button>
                  </div>
                ) : (
                  <button className="btn" disabled={need > 0} onClick={() => setConfirm(it.id)}>
                    {need > 0 ? `${price(it.currency, cost(it))} · не хватает ${need}${it.currency === 'chests' ? ' 🎁' : ''}` : `Купить · ${price(it.currency, cost(it))}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Мои покупки">
        {mine.length === 0 && <p className="muted">Покупок пока нет.</p>}
        <ul className="list">
          {mine.map((p) => (
            <li key={p.id} className="wrapRow">
              <span className="grow">{p.emoji} {p.name}{s.parent ? ` · ${nameOf(p.memberId)?.emoji ?? ''} ${nameOf(p.memberId)?.name ?? ''}` : ''} <small className="muted">({p.date}, {price(p.currency, p.price)})</small></span>
              <small className={`st ${p.status}`}>{STATUS[p.status]}</small>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
