import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

export const C = {
  bg: '#F2F6F8',
  card: '#FFFFFF',
  ink: '#10242F',
  sub: '#5F7480',
  line: '#DCE5EA',
  brand: '#0B6E8A',
  brandDark: '#084F63',
  good: '#1B8A4B',
  warn: '#C77700',
  bad: '#C0392B',
  goodBg: '#E3F4EA',
  warnBg: '#FFF1D6',
  badBg: '#FBE4E1',
  chip: '#E4EEF2',
};

export const Card = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
  <View style={[s.card, style]}>{children}</View>
);

export const H = ({ children }: { children: React.ReactNode }) => <Text style={s.h}>{children}</Text>;

export const Btn = ({
  title, onPress, kind = 'primary', disabled, style,
}: {
  title: string; onPress: () => void; kind?: 'primary' | 'ghost' | 'danger'; disabled?: boolean; style?: ViewStyle;
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      s.btn,
      kind === 'ghost' && s.btnGhost,
      kind === 'danger' && s.btnDanger,
      (pressed || disabled) && { opacity: disabled ? 0.45 : 0.8 },
      style,
    ]}
  >
    <Text style={[s.btnTxt, kind === 'ghost' && { color: C.brand }, kind === 'danger' && { color: C.bad }]}>{title}</Text>
  </Pressable>
);

export const Chip = ({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) => (
  <Pressable onPress={onPress} style={[s.chip, active && { backgroundColor: C.brand }]}>
    <Text style={[s.chipTxt, active && { color: '#fff' }]}>{label}</Text>
  </Pressable>
);

export const Pill = ({ label, tone }: { label: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }) => {
  const map = {
    good: [C.goodBg, C.good], warn: [C.warnBg, C.warn], bad: [C.badBg, C.bad], neutral: [C.chip, C.sub],
  } as const;
  return (
    <View style={[s.pill, { backgroundColor: map[tone][0] }]}>
      <Text style={{ color: map[tone][1], fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </View>
  );
};

export const Field = ({ label, ...p }: TextInputProps & { label: string }) => (
  <View style={{ flex: 1, minWidth: 90 }}>
    <Text style={s.lbl}>{label}</Text>
    <TextInput placeholderTextColor="#9AABB5" style={s.input} {...p} />
  </View>
);

export const Num = (v: string) => {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export const Row = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
  <View style={[{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }, style]}>{children}</View>
);

export const Stat = ({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) => (
  <View style={s.stat}>
    <Text style={s.lbl}>{label}</Text>
    <Text style={[s.statV, tone === 'good' && { color: C.good }, tone === 'bad' && { color: C.bad }]}>{value}</Text>
  </View>
);

export const Empty = ({ text }: { text: string }) => (
  <Text style={{ color: C.sub, textAlign: 'center', padding: 24 }}>{text}</Text>
);

export const toneForMargin = (m: number): 'good' | 'warn' | 'bad' => (m >= 20 ? 'good' : m >= 0 ? 'warn' : 'bad');

const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.line },
  h: { fontSize: 18, fontWeight: '800', color: C.ink, marginBottom: 8 },
  btn: { backgroundColor: C.brand, paddingVertical: 13, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center' },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.brand },
  btnDanger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.bad },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  chip: { backgroundColor: C.chip, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  chipTxt: { color: C.ink, fontWeight: '600' },
  pill: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 10, alignSelf: 'flex-start' },
  lbl: { fontSize: 12, color: C.sub, marginBottom: 4, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, fontSize: 16, color: C.ink, backgroundColor: '#FAFCFD' },
  stat: { flex: 1, minWidth: 100 },
  statV: { fontSize: 20, fontWeight: '800', color: C.ink },
});
