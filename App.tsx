import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Buy from './src/screens/Buy';
import Profit from './src/screens/Profit';
import Sell from './src/screens/Sell';
import Stock from './src/screens/Stock';
import { StoreProvider, useStore } from './src/store';
import { C } from './src/ui';

const TABS = [
  { key: 'stock', label: 'Stock', icon: '🧊' },
  { key: 'buy', label: 'Buy', icon: '⚓' },
  { key: 'sell', label: 'Sell', icon: '🐟' },
  { key: 'profit', label: 'Profit', icon: '📈' },
] as const;
type Tab = (typeof TABS)[number]['key'];

function Shell() {
  const [tab, setTab] = useState<Tab>('stock');
  const { loaded } = useStore();
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Fish Shop Ledger</Text>
        <Text style={styles.sub}>Shelf life · cost · profit</Text>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loaded && (
          <View style={{ flex: 1 }}>
            {tab === 'stock' && <Stock />}
            {tab === 'buy' && <Buy onSaved={() => setTab('stock')} />}
            {tab === 'sell' && <Sell />}
            {tab === 'profit' && <Profit />}
          </View>
        )}
      </KeyboardAvoidingView>
      <View style={styles.bar}>
        {TABS.map((t) => (
          <Pressable key={t.key} style={styles.tab} onPress={() => setTab(t.key)}>
            <Text style={{ fontSize: 20 }}>{t.icon}</Text>
            <Text style={[styles.tabTxt, tab === t.key && { color: C.brand, fontWeight: '800' }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.brandDark, paddingHorizontal: 16, paddingTop: 34, paddingBottom: 12 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  sub: { color: '#A9D3E0', fontSize: 12 },
  bar: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.line, paddingBottom: 6 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  tabTxt: { fontSize: 12, color: C.sub, marginTop: 2 },
});
