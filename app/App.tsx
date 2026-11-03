// Sayaç / Counter: tek ekran — üstte sayaç sekmeleri, ortada makaralı gösterge,
// altta basma tuşu (sayaç) ya da gün çetelesi (gün).
import {
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
} from '@expo-google-fonts/archivo';
import { ChivoMono_700Bold } from '@expo-google-fonts/chivo-mono';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  AppState,
  Modal,
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  bump as bumpCounter,
  Counter,
  digitWidth,
  fmtDate,
  goalText,
  infoText,
  initialState,
  iso,
  Mode,
  newCounter,
  normalize,
  parse,
  setMode as setCounterMode,
  setTarget,
  State,
  todayIso,
  view,
} from './src/logic';
import { localeTag, T } from './src/i18n';
import { Meter } from './src/Meter';
import { font, Theme, useTheme } from './src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const KEY = 'cetele.v1';

export default function App() {
  const [fontsLoaded] = useFonts({ Archivo_500Medium, Archivo_600SemiBold, Archivo_700Bold, ChivoMono_700Bold });
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((s) => setState((s && normalize(JSON.parse(s))) || initialState()))
      .catch(() => setState(initialState()));
  }, []);

  useEffect(() => {
    if (state) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const ready = fontsLoaded && !!state;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;
  return (
    <SafeAreaProvider>
      <Screen state={state} setState={setState as (f: (s: State) => State) => void} />
    </SafeAreaProvider>
  );
}

type Ask = { title: string; text: string; go: string; danger?: boolean; fn: () => void };

function Screen({ state, setState }: { state: State; setState: (f: (s: State) => State) => void }) {
  const t = useTheme();
  const s = useMemo(() => makeStyles(t), [t]);
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();

  // gün değişince yeniden çiz
  const [today, setToday] = useState(todayIso());
  useEffect(() => {
    const tick = () => setToday(todayIso());
    const id = setInterval(tick, 30000);
    const sub = AppState.addEventListener('change', (st) => st === 'active' && tick());
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);
  const now = useMemo(() => new Date(), [today]); // eslint-disable-line react-hooks/exhaustive-deps

  const c = state.counters.find((x) => x.id === state.active) ?? state.counters[0];
  const v = view(c, now);
  const days = c.mode === 'days';
  const index = state.counters.indexOf(c);

  const update = useCallback(
    (fn: (c: Counter) => Counter) =>
      setState((st) => ({ ...st, counters: st.counters.map((x) => (x.id === st.active ? fn(x) : x)) })),
    [setState],
  );

  // sheet + toast
  const [ask, setAsk] = useState<Ask | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastT = useRef<ReturnType<typeof setTimeout>>(undefined);
  const showToast = (msg: string) => {
    setToast(msg);
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(null), 2600);
  };

  // basarken ekran kapanmasın
  useEffect(() => {
    if (days) deactivateKeepAwake().catch(() => {});
  }, [days]);

  // hızlı art arda basışlarda yeniden çizimi beklemeden en güncel sayıdan devam et
  const live = useRef(c);
  useEffect(() => {
    live.current = c;
  }, [c]);
  const press = (n: number) => {
    const r = bumpCounter(live.current, n);
    if (!r) return;
    live.current = r.counter;
    update(() => r.counter);
    if (r.hit) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    else if (n > 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    else Haptics.selectionAsync().catch(() => {});
    activateKeepAwakeAsync().catch(() => {});
  };

  const changeMode = (m: Mode) => {
    if (m === c.mode) return;
    Haptics.selectionAsync().catch(() => {});
    update((x) => setCounterMode(x, m));
  };

  const addCounter = () => {
    setState((st) => {
      const n = newCounter(st.counters.length + 1);
      return { active: n.id, counters: [...st.counters, n] };
    });
    setTimeout(() => tabsRef.current?.scrollToEnd({ animated: true }), 50);
  };
  const tabsRef = useRef<ScrollViewInstance>(null);

  const pickStart = () => {
    DateTimePickerAndroid.open({
      value: parse(c.start ?? todayIso()),
      mode: 'date',
      onChange: (e, d) => {
        if (e.type === 'set' && d) update((x) => ({ ...x, start: iso(d) }));
      },
    });
  };

  const startedToday = days && c.start === todayIso(now);
  const onUndo = () => {
    if (!days) return press(-1);
    setAsk({
      title: T.qStart,
      text: T.qStartTxt(fmtDate(parse(c.start!)), c.target),
      go: T.startToday,
      fn: () => {
        update((x) => ({ ...x, start: todayIso() }));
        showToast(T.tStarted(c.target));
      },
    });
  };
  const onReset = () =>
    setAsk({
      title: T.qReset(c.name),
      text: T.qResetTxt(c.target),
      go: T.reset,
      danger: true,
      fn: () => {
        update((x) => ({ ...x, value: 0, last: null }));
        showToast(T.tReset);
      },
    });
  const onDelete = () =>
    setAsk({
      title: T.qDel(c.name),
      text: T.qDelTxt,
      go: T.del,
      danger: true,
      fn: () => {
        setState((st) => {
          const i = st.counters.findIndex((x) => x.id === st.active);
          const counters = st.counters.filter((_, j) => j !== i);
          return { active: counters[Math.max(0, i - 1)].id, counters };
        });
        showToast(T.tDel);
      },
    });

  const goal = goalText(c, v);
  const cellH = Math.max(56, Math.min(104, winW * 0.24, winH < 640 ? 62 : 104));

  // isim alanı: yazarken serbest, çıkınca boşsa "Adsız"
  const [nameDraft, setNameDraft] = useState(c.name);
  const [nameFocus, setNameFocus] = useState(false);

  return (
    // boş bir yere dokununca klavyeyi kapat
    <Pressable
      accessible={false}
      onPress={Keyboard.dismiss}
      style={[s.root, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 18 }]}
    >
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      <View style={[s.app, { paddingLeft: Math.max(16, insets.left), paddingRight: Math.max(16, insets.right) }]}>
        {/* sekmeler */}
        <ScrollView
          ref={tabsRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.tabsWrap}
          contentContainerStyle={s.tabs}
          accessibilityRole="tablist"
        >
          {state.counters.map((x) => {
            const xv = view(x, now);
            const sel = x.id === c.id;
            return (
              <Pressable
                key={x.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: sel }}
                onPress={() => {
                  Keyboard.dismiss();
                  setState((st) => ({ ...st, active: x.id }));
                }}
                style={[s.tab, sel && s.tabSel]}
              >
                <Text numberOfLines={1} style={[s.tabT, sel && { color: t.bg }]}>
                  {x.name || T.unnamed}
                </Text>
                <Text style={[s.tabN, sel && { color: t.accent }]}>
                  {xv.done ? '✓' : x.mode === 'days' ? `${xv.n}${T.dShort}` : xv.n}
                </Text>
              </Pressable>
            );
          })}
          <Pressable onPress={addCounter} style={[s.tab, s.tabAdd]} accessibilityLabel={T.addLbl}>
            <Text style={[s.tabT, { color: t.muted }]}>{T.add}</Text>
          </Pressable>
        </ScrollView>

        {/* başlık */}
        <View style={s.head}>
          <View style={s.headTop}>
            <Text style={s.eyebrow}>
              {T.no(index + 1, state.counters.length)}
            </Text>
            <View style={s.seg} accessibilityRole="radiogroup" accessibilityLabel={T.kind}>
              {(['tally', 'days'] as const).map((m) => (
                <Pressable
                  key={m}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: c.mode === m }}
                  onPress={() => changeMode(m)}
                  style={[s.segBtn, c.mode === m && { backgroundColor: t.fg }]}
                >
                  <Text style={[s.segT, c.mode === m && { color: t.bg }]}>{m === 'tally' ? T.mTally : T.mDays}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <TextInput
            style={[s.name, nameFocus && { borderBottomColor: t.muted }]}
            value={nameFocus ? nameDraft : c.name}
            onChangeText={(txt) => {
              setNameDraft(txt);
              update((x) => ({ ...x, name: txt.trim() || T.unnamed }));
            }}
            onFocus={() => {
              setNameDraft(c.name);
              setNameFocus(true);
            }}
            onBlur={() => setNameFocus(false)}
            maxLength={40}
            returnKeyType="done"
            accessibilityLabel={T.nameLbl}
            selectionColor={t.accent}
          />
        </View>

        <Meter n={v.n} width={digitWidth(c, v)} h={cellH} t={t} label={`${v.n} ${v.unit}`} />

        <View style={s.sub}>
          <Text style={s.unit}>{v.unit.toLocaleUpperCase(localeTag)}</Text>
          <Text style={s.info}>{infoText(c, v, now)}</Text>
        </View>

        {/* hedef */}
        <View style={s.goal}>
          <View style={s.goalRow}>
            <View style={s.fields}>
              <View style={s.field}>
                <Text style={s.label}>{days ? T.days : T.target}</Text>
                <TextInput
                  key={c.id + c.mode}
                  style={[s.input, { width: 92, textAlign: 'right' }]}
                  defaultValue={c.target ? String(c.target) : ''}
                  placeholder={days ? T.eg : T.none}
                  placeholderTextColor={t.muted}
                  keyboardType="number-pad"
                  maxLength={5}
                  returnKeyType="done"
                  onChangeText={(txt) => update((x) => setTarget(x, txt))}
                  accessibilityLabel={days ? T.daysLbl : T.target}
                  selectionColor={t.accent}
                />
              </View>
              {days && (
                <View style={s.field}>
                  <Text style={s.label}>{T.start}</Text>
                  <Pressable
                    style={[s.input, { justifyContent: 'center' }]}
                    onPress={pickStart}
                    accessibilityRole="button"
                    accessibilityLabel={T.startLbl(fmtDate(parse(c.start!)))}
                  >
                    <Text style={s.dateT}>{fmtDate(parse(c.start!))}</Text>
                  </Pressable>
                </View>
              )}
            </View>
            <Text style={[s.left, v.done && { color: t.ok, fontFamily: font.uiBold }]}>{goal.text}</Text>
          </View>
          {!!v.t && <Bar pct={goal.pct} color={v.done ? t.ok : t.accent} track={t.line} />}
        </View>

        {/* alt bölüm */}
        {days ? (
          <DaysGrid c={c} el={v.el} t={v.t} s={s} />
        ) : (
          <PressButton
            s={s}
            t={t}
            disabled={v.done}
            label={v.t ? '−1' : '+1'}
            small={v.t ? T.down : T.count}
            onPress={() => press(1)}
          />
        )}

        <View style={s.row}>
          <Btn s={s} onPress={onUndo} disabled={days ? startedToday : c.value === 0}>
            {days ? (startedToday ? T.startedTodayBtn : T.startToday) : T.undo}
          </Btn>
          {!days && (
            <Btn s={s} onPress={onReset}>
              {T.reset}
            </Btn>
          )}
          <Btn s={s} onPress={onDelete} disabled={state.counters.length < 2}>
            {T.del}
          </Btn>
        </View>
      </View>

      <Sheet ask={ask} onClose={() => setAsk(null)} s={s} t={t} bottom={insets.bottom} />
      {toast && <Toast msg={toast} s={s} bottom={insets.bottom} />}
    </Pressable>
  );
}

function Bar({ pct, color, track }: { pct: number; color: string; track: string }) {
  return (
    <View style={{ height: 8, borderRadius: 99, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ height: '100%', width: `${pct}%`, backgroundColor: color }} />
    </View>
  );
}

type S = ReturnType<typeof makeStyles>;

function PressButton(p: { s: S; t: Theme; disabled: boolean; label: string; small: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={p.onPress}
      disabled={p.disabled}
      accessibilityRole="button"
      accessibilityLabel={T.pressLbl}
      accessibilityState={{ disabled: p.disabled }}
      style={{ flex: 1, minHeight: 100, marginBottom: 8 }}
    >
      {({ pressed }) => {
        const down = pressed && !p.disabled;
        return (
          <View style={[{ flex: 1 }, p.disabled && { opacity: 0.45 }]}>
            <View style={p.s.pressShadow} />
            <View style={[p.s.pressFace, down && { transform: [{ translateY: 8 }] }]}>
              <Text style={p.s.pressNum}>{p.label}</Text>
              <Text style={p.s.pressSmall}>{p.small}</Text>
            </View>
          </View>
        );
      }}
    </Pressable>
  );
}

function DaysGrid({ c, el, t, s }: { c: Counter; el: number; t: number | null; s: S }) {
  if (!t)
    return (
      <View style={s.days}>
        <Text style={s.daysP}>
          {T.hintDays}
        </Text>
      </View>
    );
  const n = Math.min(t, 1000);
  return (
    <ScrollView style={s.days} contentContainerStyle={s.daysGrid} key={c.id}>
      {Array.from({ length: n }, (_, i) => (
        <View key={i} style={[s.day, i < el && s.dayOn, i === el && s.dayToday]}>
          <Text style={[s.dayT, i < el && s.dayOnT]}>{i + 1}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function Btn({ s, onPress, disabled, children }: { s: S; onPress: () => void; disabled?: boolean; children: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [s.btn, disabled && { opacity: 0.4 }, pressed && { opacity: 0.7 }]}
    >
      <Text numberOfLines={1} style={s.btnT}>
        {children}
      </Text>
    </Pressable>
  );
}

function Sheet({ ask, onClose, s, t, bottom }: { ask: Ask | null; onClose: () => void; s: S; t: Theme; bottom: number }) {
  const [last, setLast] = useState(ask);
  if (ask && ask !== last) setLast(ask);
  const a = ask ?? last;
  return (
    <Modal visible={!!ask} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Pressable style={[s.sheet, { paddingBottom: Math.max(16, bottom + 8) }]} onPress={onClose}>
        <Pressable style={s.card} onPress={() => {}}>
          <Text style={s.cardH} accessibilityRole="header">
            {a?.title}
          </Text>
          <Text style={s.cardP}>{a?.text}</Text>
          <View style={s.acts}>
            <Pressable style={s.act} onPress={onClose} accessibilityRole="button">
              <Text style={s.actT}>{T.cancel}</Text>
            </Pressable>
            <Pressable
              style={[s.act, { backgroundColor: a?.danger ? t.danger : t.fg, borderColor: a?.danger ? t.danger : t.fg }]}
              onPress={() => {
                const fn = ask?.fn;
                onClose();
                fn?.();
              }}
              accessibilityRole="button"
            >
              <Text style={[s.actT, { color: a?.danger ? '#fff' : t.bg }]}>{a?.go}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Toast({ msg, s, bottom }: { msg: string; s: S; bottom: number }) {
  const [o] = useState(() => new Animated.Value(0));
  useEffect(() => {
    o.setValue(0);
    Animated.timing(o, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [msg, o]);
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        s.toast,
        { bottom: 84 + bottom, opacity: o, transform: [{ translateY: o.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] },
      ]}
    >
      <Text style={s.toastT} numberOfLines={1}>
        {msg}
      </Text>
    </Animated.View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    app: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', gap: 16 },

    tabsWrap: { flexGrow: 0, marginHorizontal: -2 },
    tabs: { gap: 8, padding: 2 },
    tab: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
      borderWidth: 1,
      borderColor: t.line,
      backgroundColor: t.surface,
      borderRadius: 999,
      paddingVertical: 8,
      paddingHorizontal: 14,
      maxWidth: 240,
    },
    tabSel: { backgroundColor: t.fg, borderColor: t.fg },
    tabAdd: { borderStyle: 'dashed', backgroundColor: 'transparent' },
    tabT: { fontFamily: font.uiSemi, fontSize: 14, color: t.fg, flexShrink: 1 },
    tabN: { fontFamily: font.num, fontSize: 12, color: t.muted },

    head: { gap: 4 },
    headTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
    eyebrow: { fontFamily: font.uiSemi, fontSize: 11, letterSpacing: 1.3, color: t.muted },
    seg: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: t.line,
      borderRadius: 10,
      padding: 2,
      backgroundColor: t.surface,
    },
    segBtn: { borderRadius: 8, paddingVertical: 5, paddingHorizontal: 12 },
    segT: { fontFamily: font.uiSemi, fontSize: 13, color: t.muted },
    name: {
      fontFamily: font.uiBold,
      fontSize: 24,
      color: t.fg,
      paddingVertical: 2,
      paddingHorizontal: 0,
      borderBottomWidth: 1,
      borderBottomColor: 'transparent',
    },

    sub: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: -6 },
    unit: { fontFamily: font.uiBold, fontSize: 12, letterSpacing: 0.7, color: t.fg },
    info: { fontFamily: font.ui, fontSize: 13, color: t.muted, flexShrink: 1, textAlign: 'right' },

    goal: { gap: 8 },
    goalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
    fields: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    field: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    label: { fontFamily: font.uiSemi, fontSize: 13, letterSpacing: 0.5, color: t.muted },
    input: {
      fontFamily: font.num,
      fontSize: 16,
      color: t.fg,
      borderWidth: 1,
      borderColor: t.line,
      backgroundColor: t.surface,
      borderRadius: 10,
      paddingVertical: 6,
      paddingHorizontal: 9,
      minHeight: 40,
    },
    dateT: { fontFamily: font.uiSemi, fontSize: 15, color: t.fg },
    left: { fontFamily: font.ui, fontSize: 13, color: t.muted },

    pressShadow: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 8,
      bottom: -8,
      borderRadius: 28,
      backgroundColor: t.accentDeep,
    },
    pressFace: {
      flex: 1,
      borderRadius: 28,
      backgroundColor: t.accent,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    pressNum: { fontFamily: font.num, fontSize: 80, lineHeight: 88, color: t.accentFg, includeFontPadding: false },
    pressSmall: { fontFamily: font.uiSemi, fontSize: 13, letterSpacing: 1.5, color: t.accentFg, opacity: 0.75 },

    days: {
      flex: 1,
      minHeight: 90,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.line,
      borderRadius: 20,
      padding: 14,
    },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingBottom: 28 },
    daysP: { fontFamily: font.ui, fontSize: 14, lineHeight: 21, color: t.muted, maxWidth: 320 },
    day: {
      width: 28,
      height: 28,
      borderRadius: 6,
      backgroundColor: t.line,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayOn: { backgroundColor: t.accent },
    dayToday: { borderWidth: 2, borderColor: t.fg },
    dayT: { fontFamily: font.num, fontSize: 10, color: t.muted },
    dayOnT: { color: t.accentFg },

    row: { flexDirection: 'row', gap: 10 },
    btn: {
      flex: 1,
      height: 50,
      borderWidth: 1,
      borderColor: t.line,
      backgroundColor: t.surface,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    btnT: { fontFamily: font.uiSemi, fontSize: 15, color: t.fg },

    sheet: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(10,12,11,0.5)', paddingTop: 16, paddingHorizontal: 20 },
    card: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: t.surface,
      borderRadius: 22,
      paddingTop: 22,
      paddingHorizontal: 20,
      paddingBottom: 16,
      gap: 10,
      elevation: 12,
    },
    cardH: { fontFamily: font.uiBold, fontSize: 20, lineHeight: 25, color: t.fg },
    cardP: { fontFamily: font.ui, fontSize: 15, lineHeight: 22, color: t.muted },
    acts: { flexDirection: 'row', gap: 10, marginTop: 8 },
    act: {
      flex: 1,
      height: 50,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.line,
      backgroundColor: t.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actT: { fontFamily: font.uiBold, fontSize: 16, color: t.fg },

    toast: {
      position: 'absolute',
      alignSelf: 'center',
      backgroundColor: t.fg,
      borderRadius: 999,
      paddingVertical: 11,
      paddingHorizontal: 18,
      maxWidth: '90%',
      elevation: 8,
    },
    toastT: { fontFamily: font.uiSemi, fontSize: 14, color: t.bg },
  });
