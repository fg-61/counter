// Sayaç'ın saf mantığı: durum şekli, gösterilecek sayı, tarih yardımcıları.
import { isTr, localeTag, T } from './i18n';

export type Mode = 'tally' | 'days';

export type Counter = {
  id: string;
  name: string;
  mode: Mode;
  value: number;
  target: number | null;
  last: number | null;
  start?: string; // YYYY-MM-DD, yalnızca gün modu
};

export type State = { active: string; counters: Counter[] };

export const MAX = 99999;
const DAY = 864e5;

const pad = (n: number) => String(n).padStart(2, '0');
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayIso = (now = new Date()) => iso(now);
export const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
export const fmtDate = (d: Date) => {
  if (isTr) return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  try {
    return d.toLocaleDateString(localeTag, { day: 'numeric', month: 'short' });
  } catch {
    return iso(d);
  }
};
export const fmtTime = (ms: number) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

export const newCounter = (n: number): Counter => ({
  id: uid(),
  name: T.def(n),
  mode: 'tally',
  value: 0,
  target: null,
  last: null,
});

export const initialState = (): State => {
  const c = newCounter(1);
  return { active: c.id, counters: [c] };
};

/** Boş adı "Adsız" yapar; eski varsayılan adları (Çetele 1, Counter 2…) telefon dilindeki yeni ada çevirir. */
export function rename(name: unknown): string {
  if (typeof name !== 'string' || !name) return T.unnamed;
  const m = /^(?:Çetele|Sayaç|Counter) (\d+)$/.exec(name);
  return m ? T.def(m[1]) : name;
}

/** Diskten gelen veriyi doğrular; bozuksa null döner. */
export function normalize(raw: unknown, now = new Date()): State | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Partial<State>;
  if (!Array.isArray(s.counters) || !s.counters.length) return null;
  const counters = s.counters
    .filter((c): c is Counter => !!c && typeof c === 'object' && typeof c.id === 'string')
    .map((c) => {
      const mode: Mode = c.mode === 'days' ? 'days' : 'tally';
      return {
        id: c.id,
        name: rename(c.name),
        mode,
        value: Number.isFinite(c.value) ? Math.max(0, Math.min(MAX, c.value)) : 0,
        target: typeof c.target === 'number' && c.target > 0 ? Math.min(MAX, c.target) : null,
        last: typeof c.last === 'number' ? c.last : null,
        ...(mode === 'days' ? { start: typeof c.start === 'string' ? c.start : todayIso(now) } : {}),
      };
    });
  if (!counters.length) return null;
  const active = counters.some((c) => c.id === s.active) ? (s.active as string) : counters[0].id;
  return { active, counters };
}

export type View = {
  n: number;
  unit: string;
  el: number; // geçen gün / sayılan
  t: number | null;
  done: boolean;
  future?: number; // gün modunda başlangıca kalan gün
};

export function view(c: Counter, now = new Date()): View {
  const t = c.target || null;
  if (c.mode === 'days') {
    const el = Math.round((parse(todayIso(now)).getTime() - parse(c.start ?? todayIso(now)).getTime()) / DAY);
    if (el < 0) return { n: t || 0, unit: t ? T.dLeft : T.dPassed, el, t, future: -el, done: false };
    if (t) return { n: Math.max(0, t - el), unit: T.dLeft, el, t, done: el >= t };
    return { n: el, unit: T.dPassed, el, t, done: false };
  }
  if (t) return { n: Math.max(0, t - c.value), unit: T.left, el: c.value, t, done: c.value >= t };
  return { n: c.value, unit: T.counted, el: c.value, t, done: false };
}

/** Sayaca n ekler; değer değişmezse null döner. `hit` hedefe ulaşıldığını söyler. */
export function bump(c: Counter, n: number, now = Date.now()): { counter: Counter; hit: boolean } | null {
  if (c.mode !== 'tally') return null;
  const cap = c.target || MAX;
  const value = Math.max(0, Math.min(cap, c.value + n));
  if (value === c.value) return null;
  const hit = !!c.target && c.value < c.target && value >= c.target;
  return { counter: { ...c, value, last: now }, hit };
}

export function setMode(c: Counter, mode: Mode, now = new Date()): Counter {
  if (c.mode === mode) return c;
  const next: Counter = { ...c, mode, target: null };
  if (mode === 'days') next.start = todayIso(now);
  else delete next.start;
  return next;
}

export function setTarget(c: Counter, text: string): Counter {
  const n = parseInt(text, 10);
  const target = n > 0 ? Math.min(MAX, n) : null;
  return {
    ...c,
    target,
    value: target && c.mode === 'tally' ? Math.min(c.value, target) : c.value,
  };
}

/** Bilgi satırı (göstergenin altındaki sağ metin). */
export function infoText(c: Counter, v: View, now = new Date()): string {
  if (c.mode === 'days') {
    const s = parse(c.start ?? todayIso(now));
    let info: string;
    if (v.future) info = T.startsIn(v.future);
    else if (v.t) {
      const end = new Date(s);
      end.setDate(end.getDate() + v.t);
      info = (v.done ? T.ended : T.ends)(fmtDate(end));
    } else info = T.since(fmtDate(s));
    if (c.start === todayIso(now) && !v.future) info = `${T.startedToday} · ${info}`;
    return info;
  }
  return c.last ? T.lastPress(fmtTime(c.last)) : T.never;
}

/** Hedef satırının sağındaki metin ve ilerleme yüzdesi. */
export function goalText(c: Counter, v: View): { text: string; pct: number } {
  const days = c.mode === 'days';
  if (!v.t) return { text: days ? '' : T.hintTarget, pct: 0 };
  const pct = Math.min(100, (Math.max(0, v.el) / v.t) * 100);
  if (v.done) return { text: days ? T.timeUp : T.goalDone, pct };
  const left = days ? (v.future ? T.notStarted : T.nthDay(v.el + 1)) : `${v.el} / ${v.t}`;
  return { text: `${left} · ${T.pct(Math.floor(pct))}`, pct };
}

export const digitWidth = (c: Counter, v: View) =>
  Math.max(c.mode === 'days' ? 2 : 4, String(v.t || 0).length, String(v.n).length);
