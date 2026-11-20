/** Навигация: пять главных вкладок, остальное в «Ещё». Порядок и состав задаются здесь. */
export interface Tab { id: string; href: string; emoji: string; label: string; match: string[] }

export const TABS: Tab[] = [
  { id: 'today', href: '/', emoji: '🏠', label: 'Сегодня', match: ['/'] },
  { id: 'battle', href: '/battle', emoji: '⚔️', label: 'Бой', match: ['/battle'] },
  { id: 'hero', href: '/hero', emoji: '🛡', label: 'Герой', match: ['/hero'] },
  { id: 'loot', href: '/bag', emoji: '🎒', label: 'Добыча', match: ['/bag', '/shop'] },
  { id: 'more', href: '/more', emoji: '☰', label: 'Ещё', match: ['/more', '/tasks', '/body', '/mind', '/season', '/rating', '/book', '/deeds', '/arsenal', '/rules', '/about', '/settings', '/report'] },
];

/** Какая вкладка подсвечена на этом адресе (подстраницы «Ещё» и «Добычи» подсвечивают свою группу). */
export const activeTab = (path: string): string | null => TABS.find((t) => t.match.includes(path.replace(/\/$/, '') || '/'))?.id ?? null;

export interface MoreItem { href: string; emoji: string; title: string; text: string; parent?: boolean }
export const MORE_ITEMS: MoreItem[] = [
  { href: '/tasks', emoji: '📌', title: 'Мои задачи на день', text: 'Личный список дел на сегодня, его задают родители' },
  { href: '/body', emoji: '💪', title: 'Тело и здоровье', text: 'Тренировки, прогулки, силуэт мышц, история и год по дням' },
  { href: '/mind', emoji: '🧠', title: 'Ум', text: 'Учёба, привычки, книги и мозг, который светится' },
  { href: '/deeds', emoji: '💛', title: 'Доброта', text: 'Добрые дела, звания и журнал' },
  { href: '/rating', emoji: '📊', title: 'Рейтинг дня', text: 'Кто на каком месте и за счёт чего набраны очки' },
  { href: '/season', emoji: '🏆', title: 'Сезон', text: 'Рейтинг семьи за месяц и призы' },
  { href: '/arsenal', emoji: '🗡', title: 'Арсенал', text: 'Всё снаряжение игры: мечи, посохи, доспехи' },
  { href: '/about', emoji: '✨', title: 'Что нового', text: 'Новинки игры по версиям' },
  { href: '/book', emoji: '📖', title: 'Книга достижений', text: 'Итоги семьи и героев для печати' },
  { href: '/rules', emoji: '📖', title: 'Правила', text: 'Как всё работает: очки, уровни, сундуки, бои' },
  { href: '/settings', emoji: '⚙️', title: 'Настройки', text: 'Нормы, квесты, магазин, копии данных (нужен PIN)' },
  { href: '/report', emoji: '📊', title: 'Отчёт', text: 'Итоги недели для родителя', parent: true },
];

/** Подвкладки внутри «Добычи». */
export const LOOT_TABS = [
  { href: '/bag', emoji: '🎒', label: 'Сумка и сундуки' },
  { href: '/shop', emoji: '🛍', label: 'Магазин' },
] as const;
