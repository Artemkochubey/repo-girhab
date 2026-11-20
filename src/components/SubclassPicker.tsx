'use client';
import { useState } from 'react';
import { CLASS_INFO, CLASS_NAMES, SUBCLASS_NAMES, subBonus, type Cls } from '@/lib/game/classes';
import { useGame } from './Shell';

const ORDER: Cls[] = ['w', 'm', 'b', 'p'];

/** Выбор подкласса при достижении 5 уровня: окно устроено так же, как выбор класса. */
export function SubclassPicker({ memberName, cls, level, recommended, onClose }: { memberName: string; cls: Cls; level: number; recommended: Cls | null; onClose?: () => void }) {
  const { act, toast } = useGame();
  const [sel, setSel] = useState<Cls | null>(null);
  const [busy, setBusy] = useState(false);
  const pct = `+${Math.round(subBonus(level) * 100)}%`;
  const options = ORDER.filter((c) => c !== cls);

  const choose = async () => {
    if (!sel) return;
    setBusy(true);
    try {
      await act('setSub', { sub: sel });
      toast(`🎉 Подкласс выбран: ${SUBCLASS_NAMES[cls][sel]}. Сфера «${CLASS_INFO[sel].sphere}» усилена на ${pct}`);
    } catch { /* act уже показал сообщение об ошибке */ }
    setBusy(false);
  };

  return (
    <div className="modal classmodal" role="dialog" aria-label="Выбор подкласса" onClick={onClose}>
      <div className="card picker cp" onClick={(e) => e.stopPropagation()}>
        <div className="cp-head">
          <h2>🌟 {memberName}, выбери подкласс!</h2>
          {onClose && <button className="x close" onClick={onClose} aria-label="Закрыть">✕</button>}
        </div>
        <div className="cp-body">
          <p className="muted">Ты дошёл до 5 уровня! Подкласс усиливает ещё одну сферу: сейчас {pct} очков за неё, дальше бонус вырастет (+15% с 8 уровня, +20% с 12). Твой класс: {CLASS_NAMES[cls]}.</p>
          <div className="grid">
            {options.map((c) => (
              <button key={c} className={`card pick ${sel === c ? 'sel' : ''}`} onClick={() => setSel(c)} aria-pressed={sel === c}>
                <b>{SUBCLASS_NAMES[cls][c]}{recommended === c ? ' ★' : ''}</b>
                <span className="muted">{CLASS_NAMES[cls]} + {CLASS_INFO[c].sphere}</span>
                <small className="gold">{CLASS_INFO[c].bonus.replace('+20%', pct)}</small>
              </button>
            ))}
          </div>
          {recommended && <p className="muted small">★ — подходит лучше всего: в этой сфере у тебя больше всего очков.</p>}
          {sel && (
            <div className="confirm">
              <b>{SUBCLASS_NAMES[cls][sel]} — {CLASS_NAMES[cls]} + {CLASS_INFO[sel].sphere}</b>
              <span>{CLASS_INFO[sel].pitch}</span>
              <span><b>Подходит для:</b> {CLASS_INFO[sel].examples}</span>
            </div>
          )}
          <p className="muted small">Подкласс можно сменить или снять в любой момент на экране «Герой». Очки при смене пересчитываются за всю историю.</p>
        </div>
        <div className="cp-foot row wrapRow">
          <button className="btn" disabled={!sel || busy} onClick={choose}>{sel ? `Стать: ${SUBCLASS_NAMES[cls][sel]}` : 'Выбери подкласс'}</button>
          {onClose && <button className="btn ghost" onClick={onClose}>Выберу позже</button>}
        </div>
      </div>
    </div>
  );
}
