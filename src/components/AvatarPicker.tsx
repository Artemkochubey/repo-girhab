'use client';
import { AVATAR_COLORS, AVATAR_GROUPS } from '@/lib/game/avatars';
import { useGame } from './Shell';

export function AvatarPicker({ memberId, onClose }: { memberId: number; onClose: () => void }) {
  const { s, act, toast } = useGame();
  const m = s.members.find((x) => x.id === memberId)!;
  const set = (patch: { emoji?: string; color?: string }) => act('setAvatar', { memberId, ...patch }).catch(() => toast('Не получилось сменить аватар'));
  return (
    <div className="modal" onClick={onClose}>
      <div className="card picker" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Выбор аватара">
        <div className="row between"><h3>Выбери героя</h3><button className="btn ghost" onClick={onClose}>Готово</button></div>
        <div className="row wrapRow" aria-label="Цвет рамки">
          {AVATAR_COLORS.map((c) => (
            <button key={c} className={`swatch ${m.color.toLowerCase() === c ? 'on' : ''}`} style={{ background: c }} onClick={() => set({ color: c })} aria-label={`Цвет ${c}`} />
          ))}
        </div>
        {AVATAR_GROUPS.map((g) => (
          <div key={g.title}>
            <h3>{g.title}</h3>
            <div className="avatars">
              {g.items.map((e) => (
                <button key={e} className={`av ${m.emoji === e ? 'on' : ''}`} style={m.emoji === e ? { borderColor: m.color } : undefined} onClick={() => set({ emoji: e })}>{e}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
