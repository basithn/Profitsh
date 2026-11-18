import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { addSale, allocateFifo, allocCost, deleteSale, fmtDate, lastSellingPrice, marginPct, priceForMargin, round2, startOfDay, stockRows } from '../logic';
import { useStore } from '../store';
import { Btn, C, Card, Chip, ChipRow, Empty, Field, H, InfoChip, Num, Row, Screen, toneForMargin } from '../ui';

export default function Sell() {
  const { state, update } = useStore();
  const cur = state.settings.currency;
  const rows = stockRows(state);
  const [variety, setVariety] = useState('');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');

  const row = rows.find((r) => r.variety === variety);
  const q = Num(qty);
  const p = Num(price);
  const alloc = row && q > 0 ? allocateFifo(state, variety, q) : [];
  const cost = allocCost(alloc);
  const unitCost = q > 0 && row ? cost / q : row?.avgCost ?? 0;
  const over = row ? q > row.qty : false;
  const m = marginPct(p, unitCost);
  const target = priceForMargin(unitCost, state.settings.targetMarginPct);

  const choose = (v: string) => {
    setVariety(v);
    const last = lastSellingPrice(state, v);
    setPrice(last ? String(last) : '');
  };

  const save = () => {
    const res = addSale(state, { variety, qty: q, pricePerKg: p, date: Date.now() });
    if (res.error) return Alert.alert('Not enough stock', res.error);
    update((s) => addSale(s, { variety, qty: q, pricePerKg: p, date: Date.now() }).state);
    setQty('');
  };

  const today = state.sales.filter((x) => x.date >= startOfDay(Date.now())).sort((a, b) => b.date - a.date);

  return (
    <Screen>
      <Card>
        <H>Record a sale</H>
        {rows.length === 0 && <Empty text="Nothing in stock to sell." />}
        <ChipRow>
          {rows.map((r) => <Chip key={r.variety} label={`${r.variety} · ${r.qty}kg`} active={variety === r.variety} onPress={() => choose(r.variety)} />)}
        </ChipRow>
        {row && (
          <>
            <Row style={{ marginTop: 14 }}>
              <Field label="Sold (kg)" value={qty} onChangeText={setQty} keyboardType="decimal-pad" placeholder="0" />
              <Field label={`Price (${cur}/kg)`} value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0" />
            </Row>
            <ChipRow style={{ marginTop: 14 }}>
              <InfoChip label="Cost / kg" value={`${cur}${round2(unitCost)}`} />
              <InfoChip label="Min price (break-even)" value={`${cur}${round2(unitCost)}`} tone="warn" onPress={() => setPrice(String(round2(unitCost)))} />
              <InfoChip label={`Price for ${state.settings.targetMarginPct}% margin`} value={`${cur}${target}`} tone="brand" onPress={() => setPrice(String(target))} />
            </ChipRow>
            <Text style={{ color: C.sub, fontSize: 11, marginTop: 6 }}>Tap a price chip to use it.</Text>
            {q > 0 && p > 0 && !over && (
              <ChipRow style={{ marginTop: 12 }}>
                <InfoChip label="Margin" value={`${m}%`} tone={toneForMargin(m)} />
                <InfoChip label="Profit" value={`${cur}${round2(q * p - cost)}`} tone={q * p - cost >= 0 ? 'good' : 'bad'} />
                <InfoChip label="Sale total" value={`${cur}${round2(q * p)}`} />
              </ChipRow>
            )}
            {over && <Text style={{ color: C.bad, marginTop: 8 }}>Only {row.qty} kg in stock</Text>}
            <Btn title="Save sale" disabled={q <= 0 || p <= 0 || over} onPress={save} style={{ marginTop: 16 }} />
            <Text style={{ color: C.sub, fontSize: 12, marginTop: 6 }}>Oldest stock is sold first, so cost follows the batch actually sold.</Text>
          </>
        )}
      </Card>

      <Card>
        <H>Today's sales</H>
        {today.length === 0 && <Empty text="No sales yet today." />}
        {today.map((x) => (
          <Row key={x.id} style={{ justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1, borderTopColor: C.line }}>
            <View>
              <Text style={{ fontWeight: '700', color: C.ink }}>{x.variety} · {x.qty} kg @ {cur}{x.pricePerKg}</Text>
              <Text style={{ color: C.sub, fontSize: 12 }}>
                {cur}{round2(x.qty * x.pricePerKg)} · profit {cur}{round2(x.qty * x.pricePerKg - allocCost(x.allocations))}
              </Text>
            </View>
            <Btn kind="ghost" title="Undo" style={{ paddingVertical: 4 }} onPress={() =>
              Alert.alert('Undo this sale?', 'The fish goes back into stock.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Undo', style: 'destructive', onPress: () => update((s) => deleteSale(s, x.id)) },
              ])} />
          </Row>
        ))}
      </Card>
    </Screen>
  );
}
