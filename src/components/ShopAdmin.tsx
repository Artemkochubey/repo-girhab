'use client';
import { useState } from 'react';
import type { ShopItemDto } from '@/lib/client';
import { useGame } from './Shell';
import { Section } from './ui';

type Form = { emoji: string; name: string; description: string; price: string; currency: 'points' | 'chests' };
const blank: Form = { emoji: '🎁', name: '', description: '', price: '300', currency: 'points' };

function ItemRow({ item }: { item: ShopItemDto }) {
  const { act, toast } = useGame();
  const [f, setF] = useState<Form>({ emoji: item.emoji, name: item.name, description: item.description, price: String(item.price), currency: item.currency });
  const up = (p: Partial<Form>) => setF({ ...f, ...p });
  return (
    <div className={`mrow ${item.active ? '' : 'off'}`}>
      <input className="num" value={f.emoji} maxLength={4} onChange={(e) => up({ emoji: e.target.value })} aria-label="Эмодзи" />
      <input value={f.name} maxLength={60} onChange={(e) => up({ name: e.target.value })} aria-label="Название" />
      <input className="wide" value={f.description} maxLength={120} placeholder="Описание" onChange={(e) => up({ description: e.target.value })} />
      <input className="num" inputMode="numeric" value={f.price} onChange={(e) => up({ price: e.target.value.replace(/\D/g, '') })} aria-label="Цена" />
      <select value={f.currency} onChange={(e) => up({ currency: e.target.value as Form['currency'] })}><option value="points">очков</option><option value="chests">сундуков</option></select>
      <button className="btn" onClick={() => act('saveShopItem', { id: item.id, ...f, price: Number(f.price) }).then(() => toast('Сохранено')).catch(() => {})}>OK</button>
      <button className="btn ghost" onClick={() => act('archiveShopItem', { id: item.id, active: !item.active })}>{item.active ? 'Скрыть' : 'Показать'}</button>
    </div>
  );
}

export function ShopAdmin() {
  const { s, act, toast } = useGame();
  const [nf, setNf] = useState<Form>(blank);
  const pending = s.shop.purchases.filter((p) => p.status === 'pending');
  const nameOf = (id: number) => s.members.find((m) => m.id === id);
  return (
    <>
      <Section title={`🎁 Покупки, ждущие выдачи (${pending.length})`}>
        {pending.length === 0 && <p className="muted">Нет покупок, ожидающих выдачи.</p>}
        <ul className="list">
          {pending.map((p) => (
            <li key={p.id} className="wrapRow">
              <span className="grow">{nameOf(p.memberId)?.emoji} {nameOf(p.memberId)?.name}: {p.emoji} {p.name} <small className="muted">({p.date}, {p.price} {p.currency === 'chests' ? 'сундуков' : 'очков'})</small></span>
              <button className="btn" onClick={() => act('fulfillPurchase', { id: p.id })}>Выдано</button>
              <button className="btn ghost" onClick={() => act('cancelPurchase', { id: p.id })}>Отменить (вернуть цену)</button>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="🛍 Магазин наград">
        {s.shop.allItems.length === 0 && (
          <button className="btn ghost" onClick={() => act('seedShopExamples').then(() => toast('Примеры добавлены')).catch(() => {})}>Добавить примеры наград</button>
        )}
        {s.shop.allItems.map((it) => <ItemRow key={`${it.id}-${it.name}-${it.price}-${it.active}`} item={it} />)}
        <h3>Новая награда</h3>
        <form className="mrow" onSubmit={(e) => { e.preventDefault(); act('saveShopItem', { ...nf, price: Number(nf.price) }).then(() => setNf(blank)).catch(() => {}); }}>
          <input className="num" value={nf.emoji} maxLength={4} onChange={(e) => setNf({ ...nf, emoji: e.target.value })} aria-label="Эмодзи" />
          <input value={nf.name} maxLength={60} placeholder="Название (кино, игра, поход…)" onChange={(e) => setNf({ ...nf, name: e.target.value })} />
          <input className="wide" value={nf.description} maxLength={120} placeholder="Описание" onChange={(e) => setNf({ ...nf, description: e.target.value })} />
          <input className="num" inputMode="numeric" value={nf.price} onChange={(e) => setNf({ ...nf, price: e.target.value.replace(/\D/g, '') })} aria-label="Цена" />
          <select value={nf.currency} onChange={(e) => setNf({ ...nf, currency: e.target.value as Form['currency'] })}><option value="points">очков</option><option value="chests">сундуков</option></select>
          <button className="btn" disabled={!nf.name.trim() || !nf.price}>＋</button>
        </form>
        <p className="muted small">Очки копятся за всё время (около 70 в день у старшего, 45 у младшего), покупка их списывает, но уровень не падает. Сундуки тоже можно тратить: 1 сундук = одна открытая награда из сундука.</p>
      </Section>
    </>
  );
}
