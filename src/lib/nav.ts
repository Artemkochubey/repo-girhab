/** Навигация: пять главных вкладок, остальное в «Ещё». Порядок и состав задаются здесь. */
export interface Tab { id: string; href: string; emoji: string; label: string; match: string[] }

export const TABS: Tab[] = [
  { id: 'today', href: '/', emoji: '🏠', label: 'Сегодня', match: ['/'] },
  { id: 'battle', href: '/battle', emoji: '⚔️', label: 'Бой', match: ['/battle'] },
  { id: 'hero', href: '/hero', emoji: '🛡', label: 'Герой', match: ['/hero'] },
  { id: 'loot', href: '/bag', emoji: '🎒', label: 'Добыча', match: ['/bag', '/shop'] },
  { id: 'more', href: '/more', emoji: '☰', label: 'Ещё', match: ['/more', '/body', '/mind', '/season', '/arsenal', '/rules', '/settings', '/report'] },
];

/** Какая вкладка подсвечена на этом адресе (подстраницы «Ещё» и «Добычи» подсвечивают свою группу). */
export const activeTab = (path: string): string | null => TABS.find((t) => t.match.includes(path.replace(/\/$/, '') || '/'))?.id ?? null;

export interface MoreItem { href: string; emoji: string; title: string; text: string; parent?: boolean }
export const MORE_ITEMS: MoreItem[] = [
  { href: '/body', emoji: '💪', title: 'Тело', text: 'Тренировки, силуэт мышц, история и год по дням' },
  { href: '/mind', emoji: '🧠', title: 'Ум', text: 'Учёба, привычки, книги и мозг, который светится' },
  { href: '/season', emoji: '🏆', title: 'Сезон', text: 'Рейтинг семьи за месяц и призы' },
  { href: '/arsenal', emoji: '🗡', title: 'Арсенал', text: 'Всё снаряжение игры: мечи, посохи, доспехи' },
  { href: '/rules', emoji: '📖', title: 'Правила', text: 'Как всё работает: очки, уровни, сундуки, бои' },
  { href: '/settings', emoji: '⚙️', title: 'Настройки', text: 'Нормы, квесты, магазин, копии данных (нужен PIN)' },
  { href: '/report', emoji: '📊', title: 'Отчёт', text: 'Итоги недели для родителя', parent: true },
];

/** Подвкладки внутри «Добычи». */
export const LOOT_TABS = [
  { href: '/bag', emoji: '🎒', label: 'Сумка и сундуки' },
  { href: '/shop', emoji: '🛍', label: 'Магазин' },
] as const;
