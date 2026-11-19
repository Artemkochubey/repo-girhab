'use client';
import { useGame } from '@/components/Shell';
import { Section } from '@/components/ui';

const RAR: Record<string, string> = { common: 'Обычный', rare: '✨ Редкий', legend: '🌟 Легендарный' };

export default function Bag() {
  const { s, act, toast } = useGame();
  const d = s.detail!;
  const me = s.members.find((m) => m.id === s.me)!;
  const run = (action: string, args: Record<string, unknown>, ok: string) => act(action, { memberId: me.id, ...args }).then(() => toast(ok)).catch(() => {});
  const inBag = d.chestLog.filter((c) => c.status === 'bag');
  const asked = d.chestLog.filter((c) => c.status === 'requested');
  const done = d.chestLog.filter((c) => c.status === 'delivered');

  const Card = ({ c }: { c: (typeof d.chestLog)[number] }) => (
    <li className={`prize r-${c.rarity} ${c.status}`}>
      <div className="grow"><small className="muted">Сундук №{c.n} · {c.date}{c.deliveredOn ? ` · выдано ${c.deliveredOn}` : ''}</small>
        <div><small>{RAR[c.rarity] ?? c.rarity}</small></div><b>{c.reward}</b></div>
      <div className="col">
        {c.status === 'bag' && <button className="btn" onClick={() => run('useChestPrize', { n: c.n }, 'Попросили родителя выдать приз')}>🎁 Использовать</button>}
        {c.status === 'requested' && <small className="gold">⏳ Ждёт родителя</small>}
        {c.status === 'requested' && <button className="btn ghost sm" onClick={() => run('useChestPrize', { n: c.n, undo: true }, 'Приз вернулся в сумку')}>Отменить</button>}
        {s.parent && c.status !== 'delivered' && <button className="btn" onClick={() => run('deliverChestPrize', { n: c.n }, 'Отмечено: выдано')}>✔ Выдано</button>}
        {s.parent && c.status === 'delivered' && <button className="btn ghost sm" onClick={() => run('deliverChestPrize', { n: c.n, undo: true }, 'Вернули в сумку')}>↩ В сумку</button>}
      </div>
    </li>
  );

  return (
    <>
      <div className="row between wrapRow"><h1 className="title">🎒 Сумка: {me.emoji} {me.name}</h1><b>{d.chests.available} 🎁 не открыто</b></div>

      <Section title={`🎁 Призы в сумке (${inBag.length})`}>
        {inBag.length === 0 && <p className="muted">Сумка пуста. Откройте сундук на экране «Герой»: приз попадёт сюда и будет ждать, пока вы его не используете.</p>}
        <ul className="prizes">{inBag.map((c) => <Card key={c.n} c={c} />)}</ul>
        <p className="muted small">Призы можно копить. Когда захочется получить, нажмите «Использовать»: родитель увидит запрос и выдаст приз. «Выдано» отмечает родитель.</p>
        {s.parent && inBag.length + asked.length > 1 && (
          <button className="btn ghost" onClick={() => run('deliverAllChestPrizes', {}, 'Все призы отмечены выданными')}>✔ Отметить всё выданным ({inBag.length + asked.length})</button>
        )}
      </Section>

      {asked.length > 0 && (
        <Section title={`⏳ Ждут выдачи (${asked.length})`}>
          <ul className="prizes">{asked.map((c) => <Card key={c.n} c={c} />)}</ul>
        </Section>
      )}

      <Section title={`✅ Получено (${done.length})`}>
        {done.length === 0 && <p className="muted">Выданных призов пока нет.</p>}
        <ul className="prizes">{done.map((c) => <Card key={c.n} c={c} />)}</ul>
      </Section>

      <Section title="🔮 Артефакты">
        <p className="muted">Скоро. Это идея на будущее: редкие предметы с особыми свойствами, которые можно будет находить в сундуках и копить в сумке рядом с призами. Например, «Щит дня» (один пропуск не сбросит серию) или «Удвоитель» (двойные очки за один день). Пока их нет, в сумке только призы.</p>
      </Section>
    </>
  );
}
