import React, { useState } from 'react';
import { ScrollView, Share, Text, View } from 'react-native';
import { fmtDate, weekRange, weekReport, DAY } from '../logic';
import { useStore } from '../store';
import { Btn, C, Card, Empty, Field, H, Num, Pill, Row, Stat, toneForMargin } from '../ui';

export default function Profit() {
  const { state, update } = useStore();
  const cur = state.settings.currency;
  const [off, setOff] = useState(0);
  const { start, end } = weekRange(Date.now(), off);
  const rep = weekReport(state, start, end);
  const label = `${fmtDate(start)} – ${fmtDate(end - DAY)}`;
  const money = (n: number) => `${n < 0 ? '-' : ''}${cur}${Math.abs(Math.round(n)).toLocaleString()}`;

  const share = () =>
    Share.share({
      message:
        `Week ${label}\nSales ${money(rep.revenue)}\nFish cost ${money(rep.cogs)}\nWastage ${money(rep.wasteCost)}\nNet profit ${money(rep.netProfit)} (${rep.marginPct}%)\n\n` +
        rep.varieties.map((v) => `${v.variety}: sold ${v.sold}kg, margin ${v.marginPct}%, profit ${money(v.profit)}`).join('\n'),
    });

  return (
    <ScrollView contentContainerStyle={{ padding: 14 }} keyboardShouldPersistTaps="handled">
      <Row style={{ alignItems: 'center', marginBottom: 12 }}>
        <Btn title="◀" kind="ghost" onPress={() => setOff((o) => o - 1)} style={{ paddingHorizontal: 14 }} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontWeight: '800', color: C.ink }}>{label}</Text>
          <Text style={{ color: C.sub, fontSize: 12 }}>{off === 0 ? 'This week' : off === -1 ? 'Last week' : `${-off} weeks ago`}</Text>
        </View>
        <Btn title="▶" kind="ghost" disabled={off >= 0} onPress={() => setOff((o) => o + 1)} style={{ paddingHorizontal: 14 }} />
      </Row>

      <Card>
        <Row style={{ flexWrap: 'wrap', rowGap: 12 }}>
          <Stat label="Sales" value={money(rep.revenue)} />
          <Stat label="Fish cost sold" value={money(rep.cogs)} />
          <Stat label="Wastage loss" value={money(rep.wasteCost)} tone={rep.wasteCost > 0 ? 'bad' : undefined} />
          <Stat label="Net profit" value={money(rep.netProfit)} tone={rep.netProfit >= 0 ? 'good' : 'bad'} />
        </Row>
        <Row style={{ marginTop: 12, alignItems: 'center' }}>
          <Pill label={`Net margin ${rep.marginPct}%`} tone={toneForMargin(rep.marginPct)} />
          <Text style={{ color: C.sub }}>Sold {rep.soldKg} kg · bought {rep.purchasedKg} kg ({money(rep.purchasedValue)})</Text>
        </Row>
      </Card>

      {rep.varieties.length === 0 && <Empty text="No activity this week." />}

      {rep.varieties.map((v) => (
        <Card key={v.variety}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: C.ink }}>{v.variety}</Text>
            <Pill label={v.sold > 0 ? `Margin ${v.marginPct}%` : 'No sales'} tone={v.sold > 0 ? toneForMargin(v.marginPct) : 'neutral'} />
          </Row>
          <Text style={{ color: C.sub, marginTop: 4 }}>
            Avg cost {cur}{v.avgCost} → avg price {cur}{v.avgPrice} per kg · profit {money(v.profit)}
            {v.wasteCost > 0 ? ` (after ${money(v.wasteCost)} wastage)` : ''}
          </Text>
          <Row style={{ marginTop: 10, justifyContent: 'space-between' }}>
            {([['Opening', v.opening], ['+ Bought', v.purchased], ['− Sold', v.sold], ['− Waste', v.wasted], ['= Left', v.closing]] as const).map(([k, n]) => (
              <View key={k} style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ color: C.sub, fontSize: 11 }}>{k}</Text>
                <Text style={{ fontWeight: '800', color: C.ink }}>{n}</Text>
              </View>
            ))}
          </Row>
        </Card>
      ))}

      <Btn kind="ghost" title="Share weekly summary" onPress={share} style={{ marginBottom: 14 }} />

      <Card>
        <H>Settings</H>
        <Row>
          <Field label="Currency symbol" value={cur} maxLength={4} onChangeText={(t) => update((s) => ({ ...s, settings: { ...s.settings, currency: t } }))} />
          <Field label="Target margin %" value={String(state.settings.targetMarginPct)} keyboardType="number-pad"
            onChangeText={(t) => update((s) => ({ ...s, settings: { ...s.settings, targetMarginPct: Math.min(90, Num(t)) } }))} />
        </Row>
      </Card>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}
