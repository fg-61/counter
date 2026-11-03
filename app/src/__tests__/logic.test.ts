import { describe, expect, it } from '@jest/globals';
import { ek, setLang } from '../i18n';
import { bump, Counter, goalText, infoText, normalize, rename, setMode, setTarget, view } from '../logic';

setLang('tr');

const now = new Date(2026, 10, 3, 12, 0);
const tally = (p: Partial<Counter> = {}): Counter => ({
  id: 'a',
  name: 'X',
  mode: 'tally',
  value: 0,
  target: null,
  last: null,
  ...p,
});

describe('tally', () => {
  it('counts up without a target', () => {
    const r = bump(tally(), 1, 1)!;
    expect(r.counter.value).toBe(1);
    expect(view(r.counter).n).toBe(1);
    expect(view(r.counter).unit).toBe('sayıldı');
  });

  it('counts down from the target and reports the hit', () => {
    let c = setTarget(tally(), '3');
    expect(view(c).n).toBe(3);
    c = bump(c, 1)!.counter;
    c = bump(c, 1)!.counter;
    const r = bump(c, 1)!;
    expect(r.hit).toBe(true);
    expect(view(r.counter)).toMatchObject({ n: 0, done: true });
    expect(bump(r.counter, 1)).toBeNull();
  });

  it('does not go below zero and clamps value to a new target', () => {
    expect(bump(tally(), -1)).toBeNull();
    expect(setTarget(tally({ value: 9 }), '5').value).toBe(5);
    expect(setTarget(tally(), 'abc').target).toBeNull();
  });

  it('shows goal progress', () => {
    expect(goalText(tally({ value: 1, target: 4 }), view(tally({ value: 1, target: 4 })))).toEqual({
      text: '1 / 4 · %25',
      pct: 25,
    });
  });
});

describe('days', () => {
  const days = (start: string, target: number | null) =>
    ({ ...tally(), mode: 'days', start, target }) as Counter;

  it('counts down remaining days', () => {
    const c = days('2026-11-01', 10);
    expect(view(c, now)).toMatchObject({ n: 8, el: 2, done: false });
    expect(goalText(c, view(c, now)).text).toBe('3. gün · %20');
    expect(infoText(c, view(c, now), now)).toBe('bitiş 11 Kas');
  });

  it('counts elapsed days without a target', () => {
    const c = days('2026-10-27', null);
    expect(view(c, now)).toMatchObject({ n: 7, unit: 'gün oldu' });
  });

  it('handles future start and finished span', () => {
    expect(view(days('2026-11-05', 10), now)).toMatchObject({ n: 10, future: 2 });
    expect(view(days('2026-10-01', 10), now)).toMatchObject({ n: 0, done: true });
  });

  it('switching mode resets target and sets start', () => {
    const c = setMode(tally({ target: 5 }), 'days', now);
    expect(c).toMatchObject({ mode: 'days', target: null, start: '2026-11-03' });
  });
});

describe('normalize', () => {
  it('rejects garbage and repairs fields', () => {
    expect(normalize(null)).toBeNull();
    expect(normalize({ counters: [] })).toBeNull();
    const s = normalize({ active: 'zz', counters: [{ id: 'a', mode: 'days', value: -3 }] }, now)!;
    expect(s.active).toBe('a');
    expect(s.counters[0]).toMatchObject({ name: 'Adsız', value: 0, start: '2026-11-03' });
  });
});

describe('i18n', () => {
  it('picks the right Turkish suffix', () => {
    expect([10, 5, 100, 3, 40, 1000, 6, 21, 33, 60].map((n) => `${n}'${ek(n)}`)).toEqual([
      "10'dan", "5'ten", "100'den", "3'ten", "40'tan", "1000'den", "6'dan", "21'den", "33'ten", "60'tan",
    ]);
  });

  it('renames old default names to the device-language name', () => {
    expect(rename('Çetele 3')).toBe('Sayaç 3');
    expect(rename('Tesbih')).toBe('Tesbih');
    setLang('en');
    expect(rename('Çetele 3')).toBe('Counter 3');
    expect(view({ ...({} as Counter), mode: 'tally', value: 2, target: 5 }).unit).toBe('left');
    setLang('tr');
  });
});
