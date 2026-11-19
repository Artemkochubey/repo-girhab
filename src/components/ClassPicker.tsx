'use client';
import { useState } from 'react';
import { CLASS_INFO, CLASS_NAMES, SUBCLASS_NAMES, type Cls } from '@/lib/game/classes';
import { useGame } from './Shell';

const ORDER: Cls[] = ['w', 'm', 'b', 'p'];

/** Выбор класса при первом входе: что даёт каждый класс и чем он хорош. */
export function ClassPicker({ memberName, onClose }: { memberName: string; onClose?: () => void }) {
  const { act } = useGame();
  const [sel, setSel] = useState<Cls | null>(null);
  const [busy, setBusy] = useState(false);
  const info = sel ? CLASS_INFO[sel] : null;

  const choose = async () => {
    if (!sel) return;
    setBusy(true);
    try { await act('setClass', { cls: sel, confirm: true }); } catch { /* toast уже показан */ }
    setBusy(false);
  };

  return (
    <div className="modal classmodal" role="dialog" aria-label="Выбор класса">
      <div className="card picker">
        <h2>⚔️ {memberName}, выбери свой класс!</h2>
        <p className="muted">Класс усиливает одну из сфер: за неё ты получаешь на 20% больше очков. Выбери то, что тебе ближе всего.</p>
        <div className="grid">
          {ORDER.map((c) => (
            <button key={c} className={`card pick ${sel === c ? 'sel' : ''}`} onClick={() => setSel(c)} aria-pressed={sel === c}>
              <b>{CLASS_NAMES[c]}</b>
              <span className="muted">{CLASS_INFO[c].sphere}</span>
              <small className="gold">{CLASS_INFO[c].bonus}</small>
            </button>
          ))}
        </div>

        {sel && info && (
          <div className="confirm">
            <b>{CLASS_NAMES[sel]} — {info.sphere}</b>
            <span>{info.pitch}</span>
            <span><b>Подходит для:</b> {info.examples}</span>
            <span>{info.talents}</span>
            <span className="muted small">С 5 уровня откроется подкласс: второй сфере +10%, потом больше. Например, {Object.values(SUBCLASS_NAMES[sel]).filter(Boolean).join(', ')}.</span>
          </div>
        )}
        <p className="muted small">Это можно будет изменить: бесплатно в течение 24 часов, потом раз в 7 дней. Очки при смене пересчитываются за всю историю.</p>
        <div className="row wrapRow">
          <button className="btn" disabled={!sel || busy} onClick={choose}>{sel ? `Стать: ${CLASS_NAMES[sel]}` : 'Выбери класс'}</button>
          {onClose && <button className="btn ghost" onClick={onClose}>Выберу позже</button>}
        </div>
      </div>
    </div>
  );
}
