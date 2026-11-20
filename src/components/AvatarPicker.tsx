'use client';
import { useState } from 'react';
import { AVATAR_COLORS, AVATAR_GROUPS } from '@/lib/game/avatars';
import { EYE_COLORS, EYE_STYLES, GENDERS, HAIR_COLORS, MOUTH_STYLES, SKIN_TONES, defaultFace, extrasFor, hairFor, randomFace, type FaceConfig, type Gender } from '@/lib/game/faces';
import { FaceBadge } from './Face';
import { useGame } from './Shell';

const withGender = (f: FaceConfig, g: Gender): FaceConfig => ({ ...f, gender: g });
const fixFor = (f: FaceConfig, g: Gender): FaceConfig => {
  // при смене пола убираем причёску и особенности, которых нет у другого пола
  const hairOk = hairFor(g).some((h) => h.id === f.hair);
  const allowed = new Set(extrasFor(g).map((e) => e.id));
  return withGender({ ...f, hair: hairOk ? f.hair : defaultFace(g).hair, extras: f.extras.filter((e) => allowed.has(e)) }, g);
};

/** Выбор облика героя: нарисованное лицо (пол, причёска, глаза...) или смайлик, плюс цвет рамки. */
export function AvatarPicker({ memberId, onClose }: { memberId: number; onClose: () => void }) {
  const { s, act, toast } = useGame();
  const m = s.members.find((x) => x.id === memberId)!;
  const [tab, setTab] = useState<'face' | 'emoji'>('face');
  const [gender, setGender] = useState<Gender>(m.gender ?? 'm');
  const [face, setFace] = useState<FaceConfig>(withGender(m.face ?? defaultFace(m.gender ?? 'm'), m.gender ?? 'm'));
  const saved = !!m.face && JSON.stringify({ ...m.face, gender: undefined }) === JSON.stringify({ ...face, gender: undefined }) && m.gender === gender;
  const set = (patch: { emoji?: string; color?: string }) => act('setAvatar', { memberId, ...patch }).catch(() => toast('Не получилось сменить аватар'));
  const upd = (p: Partial<FaceConfig>) => setFace((f) => ({ ...f, ...p }));
  const pickGender = (g: Gender) => { setGender(g); setFace((f) => fixFor(f, g)); };
  const toggle = (id: string) => upd({ extras: face.extras.includes(id) ? face.extras.filter((e) => e !== id) : [...face.extras, id] });
  const save = () => act('setAvatar', { memberId, gender, face: { skin: face.skin, hair: face.hair, hairColor: face.hairColor, eyes: face.eyes, eyeColor: face.eyeColor, mouth: face.mouth, extras: face.extras } })
    .then(() => toast('🎉 Лицо героя сохранено')).catch(() => toast('Не получилось сохранить лицо'));
  const shuffle = () => setFace(withGender(randomFace(gender, Math.random), gender));
  const show = (f: Partial<FaceConfig>, size = 56) => <FaceBadge face={withGender({ ...face, ...f }, gender)} size={size} color={m.color} />;

  return (
    <div className="modal" onClick={onClose}>
      <div className="card picker" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Выбор облика героя">
        <div className="row between"><h3>Облик героя</h3><button className="btn ghost" onClick={onClose}>Закрыть</button></div>
        <div className="seg" role="tablist">
          <button role="tab" aria-selected={tab === 'face'} className={tab === 'face' ? 'on' : ''} onClick={() => setTab('face')}>🙂 Лицо</button>
          <button role="tab" aria-selected={tab === 'emoji'} className={tab === 'emoji' ? 'on' : ''} onClick={() => setTab('emoji')}>🐉 Смайлик</button>
        </div>
        <div className="row wrapRow" aria-label="Цвет рамки">
          {AVATAR_COLORS.map((c) => (
            <button key={c} className={`swatch ${m.color.toLowerCase() === c ? 'on' : ''}`} style={{ background: c }} onClick={() => set({ color: c })} aria-label={`Цвет рамки ${c}`} />
          ))}
        </div>

        {tab === 'face' && (
          <div className="facepick">
            <div className="face-preview">
              <FaceBadge face={withGender(face, gender)} size={150} color={m.color} />
              <div className="row wrapRow">
                <button className="btn ghost" onClick={shuffle}>🎲 Случайное</button>
                <button className="btn" onClick={save} disabled={saved}>{saved ? '✔ Сохранено' : 'Сохранить лицо'}</button>
              </div>
            </div>

            <h3>Пол</h3>
            <div className="seg">{GENDERS.map((g) => <button key={g.id} className={gender === g.id ? 'on' : ''} onClick={() => pickGender(g.id)}>{g.emoji} {g.name}</button>)}</div>

            <h3>Цвет кожи</h3>
            <div className="row wrapRow">{SKIN_TONES.map((c, i) => <button key={c} className={`swatch ${face.skin === i ? 'on' : ''}`} style={{ background: c }} onClick={() => upd({ skin: i })} aria-label={`Кожа ${i + 1}`} />)}</div>

            <h3>Причёска</h3>
            <div className="face-grid">{hairFor(gender).map((h) => (
              <button key={h.id} className={`face-opt ${face.hair === h.id ? 'on' : ''}`} onClick={() => upd({ hair: h.id })} aria-pressed={face.hair === h.id}>{show({ hair: h.id })}<small>{h.name}</small></button>
            ))}</div>
            <h3>Цвет волос</h3>
            <div className="row wrapRow">{HAIR_COLORS.map((c, i) => <button key={c.hex} className={`swatch ${face.hairColor === i ? 'on' : ''}`} style={{ background: c.hex }} onClick={() => upd({ hairColor: i })} aria-label={c.name} title={c.name} />)}</div>

            <h3>Глаза</h3>
            <div className="face-grid">{EYE_STYLES.map((e) => (
              <button key={e.id} className={`face-opt ${face.eyes === e.id ? 'on' : ''}`} onClick={() => upd({ eyes: e.id })} aria-pressed={face.eyes === e.id}>{show({ eyes: e.id })}<small>{e.name}</small></button>
            ))}</div>
            <div className="row wrapRow">{EYE_COLORS.map((c, i) => <button key={c.hex} className={`swatch ${face.eyeColor === i ? 'on' : ''}`} style={{ background: c.hex }} onClick={() => upd({ eyeColor: i })} aria-label={c.name} title={c.name} />)}</div>

            <h3>Рот</h3>
            <div className="face-grid">{MOUTH_STYLES.map((e) => (
              <button key={e.id} className={`face-opt ${face.mouth === e.id ? 'on' : ''}`} onClick={() => upd({ mouth: e.id })} aria-pressed={face.mouth === e.id}>{show({ mouth: e.id })}<small>{e.name}</small></button>
            ))}</div>

            <h3>Особенности</h3>
            <div className="row wrapRow">{extrasFor(gender).map((e) => (
              <button key={e.id} className={`btn ${face.extras.includes(e.id) ? '' : 'ghost'}`} onClick={() => toggle(e.id)} aria-pressed={face.extras.includes(e.id)}>{e.name}</button>
            ))}</div>
            <p className="muted small">Лицо видно на картинке героя в боях, на горе, в рейтинге и на ТВ. Выбрав лицо, не забудьте нажать «Сохранить лицо».</p>
          </div>
        )}

        {tab === 'emoji' && AVATAR_GROUPS.map((g) => (
          <div key={g.title}>
            <h3>{g.title}</h3>
            <div className="avatars">
              {g.items.map((e) => (
                <button key={e} className={`av ${!m.face && m.emoji === e ? 'on' : ''}`} style={!m.face && m.emoji === e ? { borderColor: m.color } : undefined} onClick={() => set({ emoji: e })}>{e}</button>
              ))}
            </div>
          </div>
        ))}
        {tab === 'emoji' && m.face && <p className="muted small">Сейчас выбрано лицо. Выбор смайлика заменит его.</p>}
      </div>
    </div>
  );
}
