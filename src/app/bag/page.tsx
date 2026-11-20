'use client';
import { useState } from 'react';
import { useGame } from '@/components/Shell';
import { ARTIFACTS, SOURCE_NAMES } from '@/lib/game/artifacts';
import type { ArtifactDto } from '@/lib/client';
import { Section } from '@/components/ui';

const RAR: Record<string, string> = { common: 'Обычный', rare: '✨ Редкий', legend: '🌟 Легендарный' };

const fmtDay = (d: string, today: string) => (d === today ? 'сегодня' : new Date(d + 'T00:00:00').toLocaleDateString('ru', { day: 'numeric', month: 'long', weekday: 'short' }));

function ArtifactCard({ a }: { a: ArtifactDto }) {
  const { s, act, toast } = useGame();
  const d = s.detail!;
  const info = ARTIFACTS[a.kind];
  const dates = a.kind === 'shield' ? d.artifactDates.shield : a.kind === 'doubler' ? d.artifactDates.doubler : [];
  const [date, setDate] = useState<string>(a.kind === 'doubler' ? s.today : '');
  const chosen = date || dates[dates.length - 1] || '';
  const use = (args: Record<string, unknown> = {}) => act('useArtifact', { key: a.key, ...args }).then(() => toast(`${info.emoji} ${info.name}: готово`)).catch(() => {});
  const statusText = a.status === 'used' ? `использован ${a.usedOn ?? ''}` : a.kind === 'shield' ? `🛡 защищает ${fmtDay(a.activeFor!, s.today)}` : a.kind === 'doubler' ? `✨ удваивает очки: ${fmtDay(a.activeFor!, s.today)}` : '🍀 ждёт следующего сундука';
  return (
    <li className={`art ${a.status}`}>
      <span className="ico">{info.emoji}</span>
      <div><b>{info.name}</b> <small className="muted">· {SOURCE_NAMES[a.source]}, {a.date}</small><div className="small">{info.text}</div></div>
      <div className="acts">
        {a.status !== 'bag' && <small className="gold">{statusText}</small>}
        {a.status === 'bag' && a.kind === 'key' && <button className="btn" onClick={() => use()}>🔑 Использовать (+1 сундук)</button>}
        {a.status === 'bag' && a.kind === 'luck' && <button className="btn" onClick={() => use()}>🍀 Активировать</button>}
        {a.status === 'bag' && (a.kind === 'shield' || a.kind === 'doubler') && (dates.length === 0
          ? <small className="muted">Нет подходящих дней: {a.kind === 'shield' ? 'пропущенных дней за неделю не было' : 'нет свободных дней'}</small>
          : <>
              <select value={chosen} onChange={(e) => setDate(e.target.value)} aria-label="День">
                {[...dates].reverse().map((x) => <option key={x} value={x}>{fmtDay(x, s.today)}</option>)}
              </select>
              <button className="btn" onClick={() => use({ date: chosen })}>{a.kind === 'shield' ? '🛡 Защитить день' : '✨ Удвоить день'}</button>
            </>)}
      </div>
    </li>
  );
}

export default function Bag() {
  const { s, act, toast } = useGame();
  const d = s.detail!;
  const me = s.members.find((m) => m.id === s.me)!;
  const run = (action: string, args: Record<string, unknown>, ok: string) => act(action, { memberId: me.id, ...args }).then(() => toast(ok)).catch(() => {});
  const arts = [...d.artifacts].sort((x, y) => (x.status === 'used' ? 1 : 0) - (y.status === 'used' ? 1 : 0) || (x.date < y.date ? 1 : -1));
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

      <Section title={`🔮 Артефакты (${arts.filter((x) => x.status !== 'used').length})`}>
        {arts.length === 0 && <p className="muted">Артефактов пока нет. Они находятся в сундуках (чем реже сундук, тем выше шанс) и выдаются за победы: над боссом, в сезоне, за MVP дня и сложную цель недели.</p>}
        <ul className="arts">{arts.map((x) => <ArtifactCard key={x.key} a={x} />)}</ul>
        <p className="muted small">Артефакты работают внутри игры: щит спасает серию, удвоитель добавляет очки, ключ даёт сундук, талисман улучшает следующий сундук. Призы для жизни остаются в разделе выше.</p>
      </Section>
    </>
  );
}
