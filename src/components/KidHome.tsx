'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { lookOf } from '@/lib/client';
import { kidSay, starsFor } from '@/lib/game/kid';
import { canSpeak, speak, stopSpeaking } from '@/lib/speak';
import { HeroFigure } from './HeroFigure';
import { openQuickLog } from './QuickLog';
import { useGame } from './Shell';

const VOICE_KEY = 'mr_voice_off';
export const voiceOn = (): boolean => { try { return localStorage.getItem(VOICE_KEY) !== '1'; } catch { return true; } };

/** Главный экран режима «Малыш»: герой, звёздочки, три большие кнопки, задания и сундук. */
export function KidHome() {
  const { s, act } = useGame();
  const d = s.detail!;
  const me = s.members.find((m) => m.id === s.me)!;
  const [voice, setVoice] = useState(true);
  useEffect(() => { setVoice(voiceOn()); return () => stopSpeaking(); }, []);
  const st = starsFor(d.day.points, me.goal, me.superGoal);
  const minutes = d.day.points >= me.superGoal ? s.config.superMinutes : d.day.points >= me.goal ? s.config.minutes : 0;
  const say = kidSay(me.name, st, s.config.minutes);
  const toggleVoice = () => { const on = !voice; setVoice(on); try { if (on) localStorage.removeItem(VOICE_KEY); else localStorage.setItem(VOICE_KEY, '1'); } catch { /* без хранилища не запомним */ } if (on) speak(say); else stopSpeaking(); };
  const b = d.battle.live;
  return (
    <div className="kid-home">
      <section className="kid-top">
        <HeroFigure look={lookOf(d.gear)} color={me.color} emoji={me.emoji} face={me.face} cls={d.hero.cls} size={150} />
        <div className="kid-say">
          <p>{say}</p>
          {canSpeak() && <button className="btn" onClick={() => speak(say)} aria-label="Прочитать вслух">🔊 Послушать</button>}
          {canSpeak() && <button className="btn ghost sm" onClick={toggleVoice} aria-pressed={voice}>{voice ? 'Голос включён' : 'Голос выключен'}</button>}
        </div>
      </section>

      <section className="kid-stars card" aria-label="Звёздочки за сегодня">
        <div className="kid-starrow" role="img" aria-label={`Звёзд: ${st.filled} из 5`}>
          {Array.from({ length: 5 }, (_, i) => <span key={i} className={i < st.filled ? 'on' : ''}>{i < st.filled ? '⭐' : '☆'}</span>)}
          {Array.from({ length: 3 }, (_, i) => <span key={`b${i}`} className={`gold ${i < st.bonus ? 'on' : ''}`}>{i < st.bonus ? '🌟' : '✧'}</span>)}
        </div>
        <div className="bar kid-bar" role="progressbar" aria-valuenow={d.day.points} aria-valuemax={me.goal}><div style={{ width: `${st.percent}%`, background: st.reachedGoal ? 'var(--ok)' : 'var(--accent)' }} /></div>
        <p className="kid-reward">{minutes ? `🎮 Награда: ${minutes} минут игр!` : st.toGoal > 0 ? `🎮 Ещё ${st.toGoal} очков до награды` : ''}</p>
      </section>

      <section className="kid-actions" aria-label="Что ты сделал?">
        <button className="kid-big body" onClick={() => openQuickLog('body')}><span>💪</span><b>Тело</b><small>зарядка, прогулка</small></button>
        <button className="kid-big mind" onClick={() => openQuickLog('mind')}><span>🧠</span><b>Ум</b><small>читал, учился</small></button>
        <button className="kid-big kind" onClick={() => openQuickLog('kind')}><span>💛</span><b>Добро</b><small>помог, порадовал</small></button>
      </section>

      {(() => {
        const td = d.tasks.days[0];
        if (!td.items.length) return null;
        return (
          <section className="card kid-quests">
            <h2>📌 Мои задачи: {td.progress.done} из {td.progress.total}</h2>
            <ul>
              {td.items.map((t) => (
                <li key={t.id} className={t.done && t.confirmed ? 'done' : ''}>
                  <button className="kid-check" disabled={t.done && t.confirmed && t.confirm} onClick={() => act('toggleTask', { taskId: t.id, date: td.date }).catch(() => {})} aria-label={t.done ? 'Снять отметку' : 'Отметить выполненной'}>{t.done ? (t.confirmed ? '✔' : '⏳') : '○'}</button>
                  <span className="grow">{t.emoji} {t.title}{t.done && !t.confirmed ? ' (ждёт родителя)' : ''}</span>
                  {canSpeak() && <button className="btn ghost sm" onClick={() => speak(t.title)} aria-label="Прочитать задачу">🔊</button>}
                </li>
              ))}
            </ul>
          </section>
        );
      })()}

      <section className="card kid-quests">
        <h2>🎯 Задания</h2>
        <ul>
          {d.day.quests.map((q, i) => {
            const manual = q.k === 'manual';
            return (
              <li key={i} className={q.completed ? 'done' : ''}>
                <button className="kid-check" disabled={!manual || !!q.completed || !!q.pending} onClick={() => act('markQuest', { index: i }).catch(() => {})} aria-label={q.completed ? 'Выполнено' : manual ? 'Отметить' : 'Выполнится само'}>{q.completed ? '✅' : q.pending ? '⏳' : manual ? '⬜' : '⚙️'}</button>
                <span className="grow">{q.t}</span>
                {canSpeak() && <button className="btn ghost sm" onClick={() => speak(q.d ? `${q.t}. ${q.d}` : q.t)} aria-label="Прочитать задание">🔊</button>}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="kid-links">
        <Link href="/bag" className={`kid-big chest ${d.chests.available ? 'ready' : ''}`}><span>🎁</span><b>{d.chests.available ? 'Открой сундук!' : 'Сундуки'}</b><small>{d.chests.available ? `ждёт: ${d.chests.available}` : 'пока нет'}</small></Link>
        <Link href="/battle" className="kid-big fight"><span>{b.horde.emoji}</span><b>Враги</b><small>волн: {b.fight.cleared} из 3{b.fight.outcome === 'victory' ? ' 🏆' : ''}</small></Link>
        <Link href="/hero" className="kid-big hero"><span>🛡</span><b>Мой герой</b><small>уровень {d.level}</small></Link>
      </section>
    </div>
  );
}
