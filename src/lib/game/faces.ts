/** Лицо героя: пол и набор черт. Рисуется в `src/components/Face.tsx`, хранится как JSON в member.face. */
export type Gender = 'm' | 'f';
export const GENDERS: { id: Gender; name: string; emoji: string }[] = [{ id: 'm', name: 'Мальчик / мужчина', emoji: '👦' }, { id: 'f', name: 'Девочка / женщина', emoji: '👧' }];

export interface FaceConfig {
  skin: number;        // индекс в SKIN_TONES
  hair: string;        // id причёски
  hairColor: number;   // индекс в HAIR_COLORS
  eyes: string;        // id глаз
  eyeColor: number;    // индекс в EYE_COLORS
  mouth: string;       // id рта
  extras: string[];    // особенности: веснушки, очки, борода...
  gender?: Gender;     // подставляется при чтении из базы (для рисования ресниц и т.п.)
}

export const SKIN_TONES = ['#fbe0c6', '#f1c9a5', '#e0a97d', '#c88b5b', '#9b6540', '#6b4228'];
export const HAIR_COLORS = [
  { name: 'Чёрный', hex: '#2a2118' }, { name: 'Тёмно-русый', hex: '#5a3a22' }, { name: 'Каштановый', hex: '#8a5a2b' }, { name: 'Светлый', hex: '#e0b95a' },
  { name: 'Рыжий', hex: '#c4572a' }, { name: 'Седой', hex: '#b8b8c4' }, { name: 'Синий', hex: '#3a6bff' }, { name: 'Розовый', hex: '#ff6fb0' },
  { name: 'Фиолетовый', hex: '#8f5cff' }, { name: 'Зелёный', hex: '#3fcf9a' },
];
export const EYE_COLORS = [{ name: 'Карие', hex: '#5a3a22' }, { name: 'Синие', hex: '#3a7bff' }, { name: 'Зелёные', hex: '#3fa86a' }, { name: 'Серые', hex: '#8a96a8' }, { name: 'Янтарные', hex: '#c98a2b' }];

export const HAIR_STYLES: { id: string; name: string; for: Gender[] }[] = [
  { id: 'short', name: 'Короткая', for: ['m', 'f'] }, { id: 'spiky', name: 'Ёжик', for: ['m'] }, { id: 'side', name: 'Чёлка набок', for: ['m', 'f'] },
  { id: 'curly', name: 'Кудри', for: ['m', 'f'] }, { id: 'buzz', name: 'Под машинку', for: ['m'] }, { id: 'bald', name: 'Лысая', for: ['m'] },
  { id: 'long', name: 'Длинная', for: ['m', 'f'] }, { id: 'ponytail', name: 'Хвост', for: ['f'] }, { id: 'bob', name: 'Каре', for: ['f'] },
  { id: 'braids', name: 'Косы', for: ['f'] }, { id: 'buns', name: 'Пучки', for: ['f'] }, { id: 'pigtails', name: 'Хвостики', for: ['f'] }, { id: 'pixie', name: 'Пикси', for: ['f'] },
];
export const EYE_STYLES = [{ id: 'round', name: 'Круглые' }, { id: 'happy', name: 'Весёлые' }, { id: 'sleepy', name: 'Сонные' }, { id: 'wide', name: 'Большие' }, { id: 'wink', name: 'Подмигивает' }];
export const MOUTH_STYLES = [{ id: 'smile', name: 'Улыбка' }, { id: 'grin', name: 'Ухмылка' }, { id: 'open', name: 'Смеётся' }, { id: 'smirk', name: 'Хитрая' }, { id: 'calm', name: 'Спокойный' }, { id: 'tongue', name: 'Язык' }];
export const EXTRAS: { id: string; name: string; for: Gender[] }[] = [
  { id: 'freckles', name: 'Веснушки', for: ['m', 'f'] }, { id: 'blush', name: 'Румянец', for: ['m', 'f'] }, { id: 'glasses', name: 'Очки', for: ['m', 'f'] },
  { id: 'beard', name: 'Борода', for: ['m'] }, { id: 'mustache', name: 'Усы', for: ['m'] }, { id: 'scar', name: 'Шрам', for: ['m', 'f'] }, { id: 'earring', name: 'Серёжка', for: ['m', 'f'] },
];

export const hairFor = (g: Gender) => HAIR_STYLES.filter((h) => h.for.includes(g));
export const extrasFor = (g: Gender) => EXTRAS.filter((e) => e.for.includes(g));

export const defaultFace = (g: Gender): FaceConfig => ({ skin: 1, hair: g === 'f' ? 'long' : 'short', hairColor: 1, eyes: 'round', eyeColor: 0, mouth: 'smile', extras: [] });

const pick = <T,>(a: T[], r: number): T => a[Math.min(a.length - 1, Math.floor(r * a.length))]!;
/** Случайное лицо: на вход четыре числа [0,1) (чтобы функция оставалась чистой и тестируемой). */
export function randomFace(g: Gender, r: () => number): FaceConfig {
  const extras = extrasFor(g).filter(() => r() < 0.18).map((e) => e.id);
  return {
    skin: Math.floor(r() * SKIN_TONES.length), hair: pick(hairFor(g), r()).id, hairColor: Math.floor(r() * HAIR_COLORS.length),
    eyes: pick(EYE_STYLES, r()).id, eyeColor: Math.floor(r() * EYE_COLORS.length), mouth: pick(MOUTH_STYLES, r()).id, extras,
  };
}

/** Проверка лица, пришедшего от клиента: только известные значения, для выбранного пола. Возвращает чистую копию или текст ошибки. */
export function validateFace(raw: unknown, g: Gender): FaceConfig | string {
  if (!raw || typeof raw !== 'object') return 'Нет данных о лице';
  const f = raw as Record<string, unknown>;
  const idx = (v: unknown, n: number) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) < n ? (v as number) : null);
  const skin = idx(f.skin, SKIN_TONES.length), hairColor = idx(f.hairColor, HAIR_COLORS.length), eyeColor = idx(f.eyeColor, EYE_COLORS.length);
  if (skin === null) return 'Неверный цвет кожи';
  if (hairColor === null) return 'Неверный цвет волос';
  if (eyeColor === null) return 'Неверный цвет глаз';
  if (!hairFor(g).some((h) => h.id === f.hair)) return 'Такой причёски нет для выбранного пола';
  if (!EYE_STYLES.some((e) => e.id === f.eyes)) return 'Таких глаз нет';
  if (!MOUTH_STYLES.some((m) => m.id === f.mouth)) return 'Такого рта нет';
  const ex = Array.isArray(f.extras) ? f.extras : [];
  const allowed = new Set(extrasFor(g).map((e) => e.id));
  if (ex.some((e) => typeof e !== 'string' || !allowed.has(e))) return 'Такой особенности нет для выбранного пола';
  return { skin, hair: f.hair as string, hairColor, eyes: f.eyes as string, eyeColor, mouth: f.mouth as string, extras: [...new Set(ex as string[])] };
}

/** Лицо из JSON в базе; битые данные дают null, и показывается смайлик. */
export function parseFace(json: string | null | undefined, g: Gender | null | undefined): FaceConfig | null {
  if (!json) return null;
  try { const r = validateFace(JSON.parse(json), g === 'f' ? 'f' : 'm'); return typeof r === 'string' ? null : { ...r, gender: g === 'f' ? 'f' : 'm' }; } catch { return null; }
}
