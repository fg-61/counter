// Makaralı gösterge: her hane 0–9 şeridini dikeyde kaydırır.
import { useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { AccessibilityInfo, Animated, StyleSheet, Text, View } from 'react-native';
import { font, Theme } from './theme';

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function Cell({ d, h, t }: { d: number; h: number; t: Theme }) {
  const [y] = useState(() => new Animated.Value(-d * h));
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      y.setValue(-d * h);
      return;
    }
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) y.setValue(-d * h);
      else Animated.spring(y, { toValue: -d * h, useNativeDriver: true, speed: 18, bounciness: 7 }).start();
    });
    return () => {
      cancelled = true;
    };
  }, [d, h, y]);

  return (
    <View style={[styles.cell, { width: h * 0.66, height: h, backgroundColor: t.cell }]}>
      <Animated.View style={{ transform: [{ translateY: y }] }}>
        {DIGITS.map((n) => (
          <Text key={n} style={[styles.digit, { height: h, lineHeight: h, fontSize: h * 0.62, color: t.drumFg }]}>
            {n}
          </Text>
        ))}
      </Animated.View>
      <LinearGradient
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0)', 'rgba(255,255,255,0.04)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
        locations={[0, 0.3, 0.5, 0.7, 1]}
      />
    </View>
  );
}

export function Meter({ n, width, h, t, label }: { n: number; width: number; h: number; t: Theme; label: string }) {
  const s = String(n).padStart(width, '0');
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      style={[styles.meter, { backgroundColor: t.drum }]}
    >
      {[...s].map((ch, i) => (
        // anahtar sağdan hizalı: hane sayısı artınca mevcut makaralar yerinde kalır
        <Cell key={s.length - i} d={Number(ch)} h={h} t={t} />
      ))}
      <View pointerEvents="none" style={styles.seam} />
    </View>
  );
}

const styles = StyleSheet.create({
  meter: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  cell: { overflow: 'hidden', borderRadius: 6 },
  digit: { fontFamily: font.num, textAlign: 'center', includeFontPadding: false },
  seam: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: '50%',
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
});
