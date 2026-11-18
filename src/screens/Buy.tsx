import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { addPurchase, fmtDate, knownVarieties, landedCosts, normName, startOfDay } from '../logic';
import { useStore } from '../store';
import { Btn, C, Card, Chip, ChipRow, DateNav, Field, H, InfoChip, Num, Row, Screen } from '../ui';

type Line = { variety: string; qty: string; cost: string; life: string };
const blank = (): Line => ({ variety: '', qty: '', cost: '', life: '' });

export default function Buy({ onSaved }: { onSaved: () => void }) {
  const { state, update } = useStore();
  const cur = state.settings.currency;
  const [daysAgo, setDaysAgo] = useState(0);
  const [harbor, setHarbor] = useState('');
  const [extra, setExtra] = useState('');
  const [lines, setLines] = useState<Line[]>([blank()]);
  const known = knownVarieties(state);

  const set = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const pick = (i: number, v: string) =>
    set(i, { variety: v, life: lines[i].life || String(state.settings.defaultShelfLife[v] ?? '') });

  const valid = lines.filter((l) => l.variety.trim() && Num(l.qty) > 0 && Num(l.cost) > 0);
  const calc = valid.map((l) => ({ qty: Num(l.qty), rawCostPerKg: Num(l.cost) }));
  const landed = landedCosts(calc, Num(extra));
  const total = calc.reduce((a, l) => a + l.qty * l.rawCostPerKg, 0) + Num(extra);
  const date = startOfDay(Date.now()) - daysAgo * 86400000;

  const save = () => {
    update((s) =>
      addPurchase(s, {
        date: date + 6 * 3600000, // morning of the purchase day
        harbor: harbor.trim(),
        extraCost: Num(extra),
        lines: valid.map((l) => ({
          variety: normName(l.variety),
          qty: Num(l.qty),
          rawCostPerKg: Num(l.cost),
          shelfLifeDays: Math.max(1, Math.round(Num(l.life) || 3)),
        })),
      }),
    );
    setLines([blank()]); setExtra(''); setHarbor(''); setDaysAgo(0);
    Alert.alert('Saved', 'Stock added to the cold room.');
    onSaved();
  };

  return (
    <Screen>
      <Card>
        <H>Harbor purchase</H>
        <DateNav title={daysAgo === 0 ? `Today · ${fmtDate(date)}` : fmtDate(date)}
          onPrev={() => setDaysAgo((d) => d + 1)} onNext={() => setDaysAgo((d) => Math.max(0, d - 1))} nextDisabled={daysAgo === 0} />
        <Field label="Harbor / supplier (optional)" value={harbor} onChangeText={setHarbor} placeholder="e.g. Kasimedu" />
      </Card>

      {lines.map((l, i) => (
        <Card key={i}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '800', color: C.ink }}>Fish #{i + 1}</Text>
            {lines.length > 1 && <Btn kind="ghost" title="Remove" onPress={() => setLines((ls) => ls.filter((_, j) => j !== i))} style={{ paddingVertical: 4 }} />}
          </Row>
          {known.length > 0 && (
            <ChipRow style={{ marginVertical: 10 }}>
              {known.map((v) => <Chip key={v} label={v} active={normName(l.variety) === v} onPress={() => pick(i, v)} />)}
            </ChipRow>
          )}
          <Field label="Variety" value={l.variety} onChangeText={(t) => set(i, { variety: t })} placeholder="e.g. Seer fish" />
          <Row style={{ marginTop: 10 }}>
            <Field label="Quantity (kg)" value={l.qty} onChangeText={(t) => set(i, { qty: t })} keyboardType="decimal-pad" placeholder="0" />
            <Field label={`Cost (${cur}/kg)`} value={l.cost} onChangeText={(t) => set(i, { cost: t })} keyboardType="decimal-pad" placeholder="0" />
            <Field label="Shelf life (days)" value={l.life} onChangeText={(t) => set(i, { life: t })} keyboardType="number-pad" placeholder="3" />
          </Row>
          {valid.includes(l) && (
            <ChipRow style={{ marginTop: 12 }}>
              <InfoChip label="Landed cost / kg" value={`${cur}${landed[valid.indexOf(l)]}`} tone="brand" />
              <InfoChip label="Line total" value={`${cur}${Math.round(Num(l.qty) * Num(l.cost))}`} />
            </ChipRow>
          )}
        </Card>
      ))}

      <Btn kind="ghost" title="+ Add another fish" onPress={() => setLines((ls) => [...ls, blank()])} style={{ marginBottom: 12 }} />

      <Card>
        <Field label={`Trip costs: transport, ice, labour (${cur}, total)`} value={extra} onChangeText={setExtra} keyboardType="decimal-pad" placeholder="0" />
        <Text style={{ color: C.sub, marginTop: 6, fontSize: 12 }}>Shared across the fish above in proportion to their value, so margins reflect the true cost.</Text>
        <ChipRow style={{ marginTop: 12 }}>
          <InfoChip label="Total spend" value={`${cur}${Math.round(total)}`} tone="brand" />
        </ChipRow>
      </Card>

      <Btn title="Save to cold room" disabled={valid.length === 0} onPress={save} />
    </Screen>
  );
}
