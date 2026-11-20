'use client';
import Link from 'next/link';
import { useState } from 'react';
import { QuestEditor } from '@/components/QuestEditor';
import { useGame } from '@/components/Shell';
import { FamilyQuestAdmin } from '@/components/FamilyQuestAdmin';
import { BackupBlock } from '@/components/BackupBlock';
import { GoalAdmin } from '@/components/GoalAdmin';
import { QuestSets } from '@/components/QuestSets';
import { ReviewBlock } from '@/components/ReviewBlock';
import { ShopAdmin } from '@/components/ShopAdmin';
import { Section } from '@/components/ui';
import { LOOT_COMMON, LOOT_LEGEND, LOOT_RARE } from '@/lib/game/loot';

type M = ReturnType<typeof useGame>['s']['members'][number];

function MemberRow({ m }: { m: M }) {
  const { act, toast } = useGame();
  const [f, setF] = useState({ name: m.name, emoji: m.emoji, color: m.color, goal: String(m.goal), superGoal: String(m.superGoal) });
  const up = (p: Partial<typeof f>) => setF({ ...f, ...p });
  return (
    <div className="mrow">
      <input className="num" value={f.emoji} maxLength={4} onChange={(e) => up({ emoji: e.target.value })} aria-label="Эмодзи" />
      <input value={f.name} maxLength={40} onChange={(e) => up({ name: e.target.value })} aria-label="Имя" />
      <input type="color" value={f.color} onChange={(e) => up({ color: e.target.value })} aria-label="Цвет" className="color" />
      <label className="xpl">Цель <input className="num" inputMode="numeric" value={f.goal} onChange={(e) => up({ goal: e.target.value.replace(/\D/g, '') })} /></label>
      <label className="xpl">Супер <input className="num" inputMode="numeric" value={f.superGoal} onChange={(e) => up({ superGoal: e.target.value.replace(/\D/g, '') })} /></label>
      <button className="btn" onClick={() => act('updateMember', { memberId: m.id, ...f, goal: Number(f.goal), superGoal: Number(f.superGoal) }).then(() => toast('Сохранено')).catch(() => {})}>OK</button>
    </div>
  );
}

export default function Settings() {
  const { s } = useGame();
  if (!s.parent || !s.admin) {
    return (
      <>
        <h1 className="title">⚙️ Настройки</h1>
        <section className="card"><p>Настройки доступны только родителям. Нажмите «🔒 PIN» вверху{s.pinSet ? '' : ' и задайте PIN'}.</p></section>
      </>
    );
  }
  return <AdminSettings />;
}

// Отдельный компонент: формы инициализируются, когда данные родителя уже загружены.
function AdminSettings() {
  const { s, act, toast } = useGame();
  const a = s.admin!;
  const [minutes, setMinutes] = useState(String(s.config.minutes));
  const [superMinutes, setSuperMinutes] = useState(String(s.config.superMinutes));
  const [tz, setTz] = useState(s.config.timezone);
  const [loot, setLoot] = useState({ loot: a.loot.join('\n'), lootRare: a.lootRare.join('\n'), lootLegend: a.lootLegend.join('\n') });
  const [pin, setPin] = useState('');
  const [nm, setNm] = useState({ name: '', emoji: '🙂', isParent: false, goal: '60', superGoal: '100' });
  const [qm, setQm] = useState<number | null>(null);

  const lines = (t: string) => t.split('\n').map((x) => x.trim()).filter(Boolean);
  const saveCfg = () => act('setConfig', {
    minutes: Number(minutes), superMinutes: Number(superMinutes), timezone: tz,
    loot: lines(loot.loot), lootRare: lines(loot.lootRare), lootLegend: lines(loot.lootLegend),
  }).then(() => toast('Сохранено')).catch(() => {});
  const nameOf = (id: number) => s.members.find((m) => m.id === id);

  return (
    <>
      <div className="row between"><h1 className="title">⚙️ Настройки</h1><Link className="btn ghost" href="/tv" target="_blank">📺 Открыть ТВ</Link></div>

      <Section title={`⏳ Ждут подтверждения (${a.pending.length})`}>
        {a.pending.length === 0 && <p className="muted">Нет отметок, ожидающих подтверждения.</p>}
        <ul className="list">
          {a.pending.map((p) => {
            const m = nameOf(p.memberId);
            return (
              <li key={`${p.memberId}-${p.date}-${p.index}`} className="wrapRow">
                <span className="grow">{m?.emoji} {m?.name} · {p.t} <small className="muted">({p.date}, +{p.xp} XP)</small></span>
                <button className="btn" onClick={() => act('confirmQuest', { memberId: p.memberId, date: p.date, index: p.index })}>Подтвердить</button>
                <button className="btn ghost" onClick={() => act('confirmQuest', { memberId: p.memberId, date: p.date, index: p.index, approve: false })}>Отклонить</button>
              </li>
            );
          })}
        </ul>
      </Section>

      {a.prizesRequested.length > 0 && (
        <Section title={`🎁 Просят выдать приз (${a.prizesRequested.length})`}>
          <ul className="list">
            {a.prizesRequested.map((p) => {
              const m = nameOf(p.memberId);
              return (
                <li key={`${p.memberId}-${p.n}`} className="wrapRow">
                  <span className="grow">{m?.emoji} {m?.name}: <b>{p.reward}</b> <small className="muted">(сундук №{p.n}, {p.date})</small></span>
                  <button className="btn" onClick={() => act('deliverChestPrize', { memberId: p.memberId, n: p.n }).then(() => toast('Отмечено: выдано')).catch(() => {})}>✔ Выдано</button>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <ReviewBlock />

      <Section title="👪 Участники и нормы баллов">
        {s.members.map((m) => <MemberRow key={m.id} m={m} />)}
        <h3>Добавить участника</h3>
        <form className="mrow" onSubmit={(e) => { e.preventDefault(); act('createMember', { ...nm, goal: Number(nm.goal), superGoal: Number(nm.superGoal) }).then(() => setNm({ ...nm, name: '' })).catch(() => {}); }}>
          <input className="num" value={nm.emoji} maxLength={4} onChange={(e) => setNm({ ...nm, emoji: e.target.value })} aria-label="Эмодзи" />
          <input value={nm.name} maxLength={40} placeholder="Имя" onChange={(e) => setNm({ ...nm, name: e.target.value })} />
          <label className="xpl"><input type="checkbox" checked={nm.isParent} onChange={(e) => setNm({ ...nm, isParent: e.target.checked })} /> родитель</label>
          <label className="xpl">Цель <input className="num" value={nm.goal} onChange={(e) => setNm({ ...nm, goal: e.target.value.replace(/\D/g, '') })} /></label>
          <label className="xpl">Супер <input className="num" value={nm.superGoal} onChange={(e) => setNm({ ...nm, superGoal: e.target.value.replace(/\D/g, '') })} /></label>
          <button className="btn" disabled={!nm.name.trim()}>＋</button>
        </form>
        <p className="muted small">Норма влияет на награду дня и на HP босса. Новый участник бьёт босса со следующей недели.</p>
      </Section>

      <Section title="🎮 Награда дня и сундуки">
        <div className="row wrapRow">
          <label className="xpl">За цель, мин <input className="num" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ''))} /></label>
          <label className="xpl">За супер-цель, мин <input className="num" value={superMinutes} onChange={(e) => setSuperMinutes(e.target.value.replace(/\D/g, ''))} /></label>
          <label className="xpl">Часовой пояс <input value={tz} onChange={(e) => setTz(e.target.value)} /></label>
        </div>
        {([['loot', 'Обычные награды (по одной на строку)'], ['lootRare', 'Редкие (25%)'], ['lootLegend', 'Легендарные (5%)']] as const).map(([k, l]) => (
          <div key={k} className="col">
            <label className="col">{l} <small className="muted">· сейчас {lines(loot[k]).length}</small><textarea rows={5} value={loot[k]} onChange={(e) => setLoot({ ...loot, [k]: e.target.value })} /></label>
            <button type="button" className="btn ghost sm" onClick={async () => {
              const tier = k === 'loot' ? 'common' : k === 'lootRare' ? 'rare' : 'legend';
              const have = new Set(lines(loot[k]).map((x) => x.toLowerCase()));
              const add = (k === 'loot' ? LOOT_COMMON : k === 'lootRare' ? LOOT_RARE : LOOT_LEGEND).filter((x) => !have.has(x.toLowerCase()));
              if (!add.length) { toast('Все варианты из каталога уже есть'); return; }
              try { await act('addLootFromCatalog', { tier }); setLoot({ ...loot, [k]: [...lines(loot[k]), ...add].join('\n') }); toast(`Добавлено вариантов: ${add.length}`); } catch { /* toast уже показан */ }
            }}>＋ Добавить варианты из каталога ({(k === 'loot' ? LOOT_COMMON : k === 'lootRare' ? LOOT_RARE : LOOT_LEGEND).filter((x) => !new Set(lines(loot[k]).map((y) => y.toLowerCase())).has(x.toLowerCase())).length} новых)</button>
          </div>
        ))}
        <label className="xpl">🌙 Вечернее напоминание о норме
          <select value={s.config.reminderHour} onChange={(e) => act('setConfig', { reminderHour: Number(e.target.value) }).then(() => toast('Сохранено')).catch(() => {})}>
            <option value={-1}>выключено</option>
            {[16, 17, 18, 19, 20, 21, 22].map((h) => <option key={h} value={h}>с {h}:00</option>)}
          </select>
        </label>
        <p className="muted small">С этого часа на «Сегодня» и на ТВ появляется подсказка, если норма дня ещё не набрана.</p>
        <button className="btn" onClick={saveCfg}>Сохранить</button>
      </Section>

      <FamilyQuestAdmin />

      <QuestSets />

      <GoalAdmin />

      <ShopAdmin />

      <Section title="⚔️ Редактор квестов">
        <div className="row wrapRow">
          {s.members.map((m) => <button key={m.id} className={`btn ${qm === m.id ? '' : 'ghost'}`} onClick={() => setQm(m.id)}>{m.emoji} {m.name}</button>)}
        </div>
        {qm !== null && <QuestEditor key={qm} memberId={qm} />}
      </Section>

      <BackupBlock />

      <Section title="🔑 PIN родителей">
        <form className="row" onSubmit={(e) => { e.preventDefault(); act('changePin', { pin }).then(() => { setPin(''); toast('PIN изменён'); }).catch(() => {}); }}>
          <input type="password" inputMode="numeric" maxLength={8} value={pin} placeholder="Новый PIN, 4–8 цифр" onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
          <button className="btn" disabled={pin.length < 4}>Сменить</button>
        </form>
      </Section>
    </>
  );
}
