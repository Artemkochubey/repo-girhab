'use client';
import { GearPic } from '@/components/GearPic';
import { ChestScene } from '@/components/ChestScene';
import { Hint } from '@/components/Hints';
import { useState } from 'react';
import { useGame } from '@/components/Shell';
import { ARTIFACTS, SOURCE_NAMES } from '@/lib/game/artifacts';
import type { ArtifactDto } from '@/lib/client';
import { Section } from '@/components/ui';
import { LootTabs } from '@/components/LootTabs';
import { BASE_CHANCE, BOSS_CHEST_LEGEND, PITY } from '@/lib/game/chests';
import { gearById, gearDisplay, gearIconFamily } from '@/lib/game/gear';
import type { ArtifactKind } from '@/lib/game/artifacts';

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
  const [chest, setChest] = useState<{ rarity: string; reward: string; artifact?: string | null; gear?: string | null; talisman?: boolean; why?: string | null } | null>(null);
  const mineNow = d.chestLog.filter((c) => c.holder === me.id);   // у меня сейчас (свои и подаренные мне)
  const inBag = mineNow.filter((c) => c.status === 'bag');
  const asked = mineNow.filter((c) => c.status === 'requested');
  const done = mineNow.filter((c) => c.status === 'delivered');
  const [giftFor, setGiftFor] = useState<string | null>(null);
  const others = s.members.filter((m) => m.id !== me.id);
  const whoName = (id: number) => s.members.find((m) => m.id === id);

  const Card = ({ c }: { c: (typeof d.chestLog)[number] }) => (
    <li className={`prize r-${c.rarity} ${c.status}`}>
      <div className="grow"><small className="muted">Сундук №{c.n} · {c.date}{c.deliveredOn ? ` · выдано ${c.deliveredOn}` : ''}{c.from !== me.id ? ` · 🎁 подарок от ${whoName(c.from)?.emoji ?? ''} ${whoName(c.from)?.name ?? ''}` : ''}</small>
        <div><small>{RAR[c.rarity] ?? c.rarity}</small></div><b>{c.reward}</b></div>
      <div className="col">
        {c.status === 'bag' && <button className="btn" onClick={() => run('useChestPrize', { from: c.from, n: c.n }, 'Попросили родителя выдать приз')}>🎁 Использовать</button>}
        {c.status === 'bag' && others.length > 0 && (giftFor === `${c.from}:${c.n}`
          ? <div className="row wrapRow">{others.map((m) => <button key={m.id} className="btn ghost sm" onClick={() => { setGiftFor(null); run('giftChestPrize', { from: c.from, n: c.n, to: m.id }, `🎁 Подарено: ${m.name}`); }}>{m.emoji} {m.name}</button>)}<button className="btn ghost sm" onClick={() => setGiftFor(null)}>Отмена</button></div>
          : <button className="btn ghost sm" onClick={() => setGiftFor(`${c.from}:${c.n}`)}>🎀 Подарить</button>)}
        {c.status === 'requested' && <small className="gold">⏳ Ждёт родителя</small>}
        {c.status === 'requested' && <button className="btn ghost sm" onClick={() => run('useChestPrize', { from: c.from, n: c.n, undo: true }, 'Приз вернулся в сумку')}>Отменить</button>}
        {s.parent && c.status !== 'delivered' && <button className="btn" onClick={() => run('deliverChestPrize', { from: c.from, n: c.n }, 'Отмечено: выдано')}>✔ Выдано</button>}
        {s.parent && c.status === 'delivered' && <button className="btn ghost sm" onClick={() => run('deliverChestPrize', { from: c.from, n: c.n, undo: true }, 'Вернули в сумку')}>↩ В сумку</button>}
      </div>
    </li>
  );

  return (
    <>
      <h1 className="title">🎒 Добыча: {me.emoji} {me.name}</h1>
      <Hint id="bag" more="/rules">Сундуки дают призы, снаряжение и артефакты. Приз можно копить в сумке, а когда захотите получить, нажмите «Использовать»: родитель отметит «Выдано». Артефакт — одноразовый помощник.</Hint>
      <LootTabs />

      <Section title="🎁 Сундуки" right={<b>{d.chests.available} доступно</b>}>
        <button className="btn" disabled={!d.chests.available} onClick={async () => setChest((await act('openChest')) as never)}>Открыть сундук</button>
        <p className="muted small">Всего заработано {d.chests.earned}, открыто {d.chests.opened}. За уровни, дни со всеми квестами, победы над боссами и звание MVP дня (сейчас побед: {d.mvpWins}){d.chests.fromTasks ? `, задачи дня (${d.chests.fromTasks})` : ''}{d.chests.granted ? `, подарки родителей (${d.chests.granted})` : ''}.</p>
        {chest && <div className={`reward ${chest.rarity}`} onClick={() => setChest(null)}><ChestScene rarity={chest.rarity} /><small>{RAR[chest.rarity]}{chest.talisman ? ' · 🍀 талисман сработал' : ''}{chest.why === 'boss' ? ' · 🐉 сундук за победу над боссом' : chest.why === 'pityRare' ? ' · ⭐ сработала гарантия редкого' : chest.why === 'pityLegend' ? ' · ⭐ сработала гарантия легендарного' : ''}</small><b>{chest.reward}</b>{chest.gear && gearById(chest.gear) && <span className="gold">🗡 Найдено снаряжение: <GearPic item={gearById(chest.gear)!} cls={d.battle.cls} size={28} /> {gearDisplay(gearById(chest.gear)!, d.battle.cls).name}! Оно в разделе «⚔️ Бой».</span>}{chest.artifact && <span className="gold">🔮 Найден артефакт: {ARTIFACTS[chest.artifact as ArtifactKind]?.emoji} {ARTIFACTS[chest.artifact as ArtifactKind]?.name}! Он лежит ниже, в разделе «Артефакты».</span>}</div>}
        <p className="muted small">Шансы сундука: обычный {Math.round((1 - BASE_CHANCE.rare - BASE_CHANCE.legend) * 100)}%, редкий {Math.round(BASE_CHANCE.rare * 100)}%, легендарный {Math.round(BASE_CHANCE.legend * 100)}% (таланты удачи прибавляют). Гарантии: редкий или лучше не реже чем через {PITY.rare} сундуков (ещё {d.pity.untilRare}), легендарный не реже чем через {PITY.legend} (ещё {d.pity.untilLegend}).{d.pity.bossWaiting > 0 ? ` 🐉 Сундуков за победу над боссом: ${d.pity.bossWaiting}. Они открываются первыми, не ниже редкого и с шансом ${Math.round(BOSS_CHEST_LEGEND * 100)}% на легендарный.` : ''}</p>
        <p className="muted small">Призы из сундуков попадают в сумку ниже: их можно копить, использовать и отмечать выданными.</p>
        <details className="chestlog">
          <summary>📜 Что выпало ({d.chestLog.length})</summary>
          {d.chestLog.length === 0 ? <p className="muted small">Пока ни одного открытого сундука.</p> : (
            <ul className="list">{d.chestLog.slice(0, 30).map((c) => <li key={`${c.from}-${c.n}`} className={`cl r-${c.rarity}`}><small className="muted">№{c.n} · {c.date}</small> <span>{RAR[c.rarity] ?? c.rarity}</span> <b>{c.reward}</b> <small className="muted">{c.holder !== me.id ? `🎀 подарено: ${whoName(c.holder)?.name ?? '?'}` : c.from !== me.id ? `🎁 подарок от ${whoName(c.from)?.name ?? '?'}` : c.status === 'delivered' ? '✅ выдано' : c.status === 'requested' ? '⏳ ждёт выдачи' : '🎒 в сумке'}</small></li>)}</ul>
          )}
        </details>
      </Section>

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
