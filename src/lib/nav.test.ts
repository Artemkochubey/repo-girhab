import { describe, it, expect } from 'vitest';
import { MORE_ITEMS, TABS, activeTab } from './nav';

describe('навигация', () => {
  it('пять главных вкладок с уникальными адресами', () => {
    expect(TABS.map((t) => t.id)).toEqual(['today', 'battle', 'hero', 'loot', 'more']);
    expect(new Set(TABS.map((t) => t.href)).size).toBe(5);
  });
  it('каждая страница приложения принадлежит ровно одной вкладке', () => {
    const pages = ['/', '/battle', '/hero', '/bag', '/shop', '/tasks', '/body', '/mind', '/season', '/rating', '/book', '/deeds', '/arsenal', '/about', '/rules', '/settings', '/report', '/more'];
    for (const p of pages) expect(TABS.filter((t) => t.match.includes(p))).toHaveLength(1);
  });
  it('подсветка: подстраницы «Добычи» и «Ещё» подсвечивают свою группу, лишний слэш не мешает', () => {
    expect(activeTab('/')).toBe('today');
    expect(activeTab('/shop')).toBe('loot');
    expect(activeTab('/bag')).toBe('loot');
    expect(activeTab('/body')).toBe('more');
    expect(activeTab('/rules/')).toBe('more');
    expect(activeTab('/tv')).toBeNull();
  });
  it('все пункты «Ещё» ведут на страницы своей группы', () => {
    const more = TABS.find((t) => t.id === 'more')!;
    for (const m of MORE_ITEMS) expect(more.match).toContain(m.href);
  });
});
