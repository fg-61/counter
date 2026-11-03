// Arayüz metinleri: telefon dili Türkçeyse Türkçe, değilse İngilizce (PWA ile aynı metinler).
import { getLocales } from 'expo-localization';

/** Türkçe ayrılma eki: 10'dan, 5'ten, 100'den, 1000'den */
export const ek = (num: number) => {
  const n = Math.abs(num);
  if (n && n % 100 === 0) return 'den';
  const o = n % 10;
  const t = Math.floor(n / 10) % 10;
  if (o) return ['', 'den', 'den', 'ten', 'ten', 'ten', 'dan', 'den', 'den', 'dan'][o];
  return ['dan', 'dan', 'den', 'dan', 'tan', 'den', 'tan', 'ten', 'den', 'dan'][t];
};

const tr = {
  app: 'Sayaç',
  tabs: 'Sayaçlar',
  kind: 'Tür',
  nameLbl: 'Sayaç adı',
  no: (i: number, n: number) => `SAYAÇ NO. ${i} / ${n}`,
  def: (i: number | string) => `Sayaç ${i}`,
  unnamed: 'Adsız',
  add: '+ Yeni',
  addLbl: 'Yeni sayaç',
  mTally: 'Sayaç',
  mDays: 'Gün',
  counted: 'sayıldı',
  left: 'kaldı',
  dLeft: 'gün kaldı',
  dPassed: 'gün oldu',
  dShort: 'g',
  startsIn: (n: number) => `başlamasına ${n} gün`,
  ends: (d: string) => `bitiş ${d}`,
  ended: (d: string) => `bitti ${d}`,
  since: (d: string) => `${d}'den beri`,
  startedToday: 'bugün başladı',
  lastPress: (t: string) => `son basış ${t}`,
  never: 'henüz basılmadı',
  target: 'Hedef',
  days: 'Gün',
  daysLbl: 'Gün sayısı',
  start: 'Başlangıç',
  startLbl: (d: string) => `Başlangıç tarihi ${d}`,
  none: 'yok',
  eg: 'ör. 10',
  timeUp: 'Süre doldu ✓',
  goalDone: 'Hedef tamam ✓',
  notStarted: 'henüz başlamadı',
  nthDay: (n: number) => `${n}. gün`,
  pct: (p: number) => `%${p}`,
  hintTarget: 'girersen geriye sayar',
  hintDays: "Gün sayısı girersen (ör. 10) her gün bir kutu dolar ve sayaç 10'dan geriye düşer.",
  count: 'SAY',
  down: 'DÜŞ',
  pressLbl: 'Bir say',
  startToday: 'Bugün başlat',
  startedTodayBtn: 'Bugün başladı ✓',
  undo: 'Geri al',
  reset: 'Sıfırla',
  del: 'Sil',
  cancel: 'Vazgeç',
  qStart: 'Sayım bugünden başlasın mı?',
  qStartTxt: (was: string, t: number | null) =>
    `Başlangıç ${was} yerine bugün olacak. ` +
    (t ? `Gösterge yeniden ${t}'${ek(t)} geriye sayacak.` : 'Gün sayısı bugünden itibaren sayılacak.'),
  tStarted: (t: number | null) => (t ? `Başladı · ${t} gün kaldı` : 'Başladı · sayım bugünden'),
  qReset: (n: string) => `"${n}" sıfırlansın mı?`,
  qResetTxt: (t: number | null) => (t ? `Gösterge yeniden ${t}'${ek(t)} başlayacak.` : 'Sayı 0 olacak.'),
  tReset: 'Sıfırlandı',
  qDel: (n: string) => `"${n}" silinsin mi?`,
  qDelTxt: 'Bu sayaç ve sayısı kalıcı olarak silinir.',
  tDel: 'Silindi',
};

export type Strings = typeof tr;

const en: Strings = {
  app: 'Counter',
  tabs: 'Counters',
  kind: 'Type',
  nameLbl: 'Counter name',
  no: (i, n) => `COUNTER NO. ${i} / ${n}`,
  def: (i) => `Counter ${i}`,
  unnamed: 'Untitled',
  add: '+ New',
  addLbl: 'New counter',
  mTally: 'Count',
  mDays: 'Days',
  counted: 'counted',
  left: 'left',
  dLeft: 'days left',
  dPassed: 'days in',
  dShort: 'd',
  startsIn: (n) => `starts in ${n} ${n === 1 ? 'day' : 'days'}`,
  ends: (d) => `ends ${d}`,
  ended: (d) => `ended ${d}`,
  since: (d) => `since ${d}`,
  startedToday: 'started today',
  lastPress: (t) => `last tap ${t}`,
  never: 'no taps yet',
  target: 'Target',
  days: 'Days',
  daysLbl: 'Number of days',
  start: 'Start',
  startLbl: (d) => `Start date ${d}`,
  none: 'none',
  eg: 'e.g. 10',
  timeUp: "Time's up ✓",
  goalDone: 'Goal reached ✓',
  notStarted: 'not started',
  nthDay: (n) => `day ${n}`,
  pct: (p) => `${p}%`,
  hintTarget: 'set one to count down',
  hintDays: 'Enter a number of days (e.g. 10). A box fills each day and the counter drops from 10.',
  count: 'TAP',
  down: 'DOWN',
  pressLbl: 'Count one',
  startToday: 'Start today',
  startedTodayBtn: 'Started today ✓',
  undo: 'Undo',
  reset: 'Reset',
  del: 'Delete',
  cancel: 'Cancel',
  qStart: 'Start counting from today?',
  qStartTxt: (was, t) =>
    `The start moves from ${was} to today. ` +
    (t ? `The display counts down from ${t} again.` : 'Days are counted from today.'),
  tStarted: (t) => (t ? `Started · ${t} days left` : 'Started · counting from today'),
  qReset: (n) => `Reset "${n}"?`,
  qResetTxt: (t) => (t ? `The display goes back to ${t}.` : 'The count goes back to 0.'),
  tReset: 'Reset done',
  qDel: (n) => `Delete "${n}"?`,
  qDelTxt: 'This counter and its count are removed for good.',
  tDel: 'Deleted',
};

const deviceLocale = () => {
  try {
    return getLocales()[0];
  } catch {
    return undefined;
  }
};

const loc = deviceLocale();
export let isTr = loc?.languageCode === 'tr';
export let localeTag = isTr ? 'tr-TR' : (loc?.languageTag ?? 'en-US');
export let T: Strings = isTr ? tr : en;

/** Testler için dili değiştirir. */
export function setLang(lang: 'tr' | 'en') {
  isTr = lang === 'tr';
  localeTag = isTr ? 'tr-TR' : 'en-US';
  T = isTr ? tr : en;
}
