import React from 'react';
import { Alert, Text, View } from 'react-native';
import { fmtDate, freshness, freshnessLabel, stockRows } from '../logic';
import { useStore } from '../store';
import { addWaste } from '../logic';
import { Btn, C, Card, ChipRow, Empty, InfoChip, Pill, Row, Screen } from '../ui';

const tone = { expired: 'bad', today: 'bad', soon: 'warn', ok: 'good' } as const;

export default function Stock() {
  const { state, update } = useStore();
  const now = Date.now();
  const cur = state.settings.currency;
  const rows = stockRows(state);
  const totalKg = rows.reduce((a, r) => a + r.qty, 0);
  const totalVal = rows.reduce((a, r) => a + r.value, 0);
  const urgent = rows.flatMap((r) => r.batches).filter((b) => ['expired', 'today', 'soon'].includes(freshness(b, now)));

  const writeOff = (id: string, qty: number, variety: string, expired: boolean) =>
    Alert.alert(`Write off ${qty} kg ${variety}?`, 'Records the stock as spoiled/discarded; its cost counts as a loss.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Write off', style: 'destructive', onPress: () => update((s) => addWaste(s, { batchId: id, qty, reason: expired ? 'expired' : 'spoiled', date: Date.now() })) },
    ]);

  return (
    <Screen>
      <ChipRow style={{ marginBottom: 12 }}>
        <InfoChip label="In cold room" value={`${totalKg.toFixed(1)} kg`} tone="brand" />
        <InfoChip label="Stock value (at cost)" value={`${cur}${Math.round(totalVal)}`} />
      </ChipRow>

      {urgent.length > 0 && (
        <Card style={{ backgroundColor: C.warnBg, borderColor: '#F0D08A' }}>
          <Text style={{ fontWeight: '800', color: C.warn, marginBottom: 4 }}>⚠ Sell first</Text>
          {urgent.map((b) => (
            <Text key={b.id} style={{ color: C.ink, marginTop: 2 }}>
              {b.variety} · {b.left} kg · {freshnessLabel(b, now)}
            </Text>
          ))}
        </Card>
      )}

      {rows.length === 0 && <Empty text="No stock yet. Record your harbor purchase in the Buy tab." />}

      {rows.map((r) => (
        <Card key={r.variety}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: C.ink }}>{r.variety}</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: C.brand }}>{r.qty} kg</Text>
          </Row>
          <ChipRow style={{ marginVertical: 8 }}>
            <InfoChip label="Avg cost / kg" value={`${cur}${r.avgCost}`} />
            <InfoChip label="Worth" value={`${cur}${Math.round(r.value)}`} />
          </ChipRow>
          {r.batches.map((b) => {
            const f = freshness(b, now);
            return (
              <View key={b.id} style={{ borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 8 }}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ color: C.ink, fontWeight: '600' }}>
                      {b.left} kg <Text style={{ color: C.sub, fontWeight: '400' }}>of {b.qty} · bought {fmtDate(b.purchasedAt)}</Text>
                    </Text>
                    <Text style={{ color: C.sub, fontSize: 12 }}>
                      Cost {cur}{b.costPerKg}/kg · use by {fmtDate(b.expiresAt)}
                    </Text>
                  </View>
                  <Pill label={freshnessLabel(b, now)} tone={tone[f]} />
                </Row>
                {(f === 'expired' || f === 'today') && (
                  <Btn kind="danger" title={`Write off ${b.left} kg`} onPress={() => writeOff(b.id, b.left, b.variety, f === 'expired')} style={{ marginTop: 8, paddingVertical: 8 }} />
                )}
              </View>
            );
          })}
        </Card>
      ))}
    </Screen>
  );
}
