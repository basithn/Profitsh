import { Allocation, Batch, Sale, State, Waste } from './types';

export const DAY = 24 * 60 * 60 * 1000;

export const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const round2 = (n: number) => Math.round(n * 100) / 100;
export const round3 = (n: number) => Math.round(n * 1000) / 1000;

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const normName = (s: string) =>
  s.trim().replace(/\s+/g, ' ').replace(/^./, (c) => c.toUpperCase());

/** Kg of a batch still in the cold room. */
export function remaining(batch: Batch, s: Pick<State, 'sales' | 'wastes'>): number {
  let q = batch.qty;
  for (const sale of s.sales)
    for (const a of sale.allocations) if (a.batchId === batch.id) q -= a.qty;
  for (const w of s.wastes) if (w.batchId === batch.id) q -= w.qty;
  return Math.max(0, round3(q));
}

/** Spread trip-level costs (transport, ice, ...) over lines in proportion to purchase value. */
export function landedCosts(
  lines: { qty: number; rawCostPerKg: number }[],
  extraCost: number,
): number[] {
  const total = lines.reduce((s, l) => s + l.qty * l.rawCostPerKg, 0);
  const totalQty = lines.reduce((s, l) => s + l.qty, 0);
  return lines.map((l) => {
    if (l.qty <= 0) return l.rawCostPerKg;
    // proportional to value; fall back to per-kg split if no prices entered
    const share =
      total > 0 ? (l.qty * l.rawCostPerKg) / total : totalQty > 0 ? l.qty / totalQty : 0;
    return round2(l.rawCostPerKg + (extraCost * share) / l.qty);
  });
}

export type Freshness = 'expired' | 'today' | 'soon' | 'ok';

export function daysLeft(batch: Batch, now: number): number {
  return Math.round((startOfDay(batch.expiresAt) - startOfDay(now)) / DAY);
}

export function freshness(batch: Batch, now: number): Freshness {
  const d = daysLeft(batch, now);
  if (d < 0) return 'expired';
  if (d === 0) return 'today';
  if (d === 1) return 'soon';
  return 'ok';
}

export function freshnessLabel(batch: Batch, now: number): string {
  const d = daysLeft(batch, now);
  if (d < 0) return `Expired ${-d}d ago`;
  if (d === 0) return 'Sell today';
  if (d === 1) return '1 day left';
  return `${d} days left`;
}

/** Oldest-expiry-first allocation across batches of a variety. Pure: doesn't mutate state. */
export function allocateFifo(s: State, variety: string, qty: number): Allocation[] {
  const batches = s.batches
    .filter((b) => b.variety === variety)
    .sort((a, b) => a.expiresAt - b.expiresAt || a.purchasedAt - b.purchasedAt);
  const out: Allocation[] = [];
  let need = qty;
  for (const b of batches) {
    if (need <= 0) break;
    const r = remaining(b, s);
    if (r <= 0) continue;
    const take = round3(Math.min(r, need));
    out.push({ batchId: b.id, qty: take, costPerKg: b.costPerKg });
    need = round3(need - take);
  }
  return out;
}

export const allocCost = (a: Allocation[]) =>
  round2(a.reduce((s, x) => s + x.qty * x.costPerKg, 0));

export type StockRow = {
  variety: string;
  qty: number;
  value: number; // at landed cost
  avgCost: number;
  batches: (Batch & { left: number })[];
  nextExpiry: number | null;
};

export function stockRows(s: State): StockRow[] {
  const map = new Map<string, StockRow>();
  for (const b of s.batches) {
    const left = remaining(b, s);
    if (left <= 0) continue;
    const row =
      map.get(b.variety) ??
      { variety: b.variety, qty: 0, value: 0, avgCost: 0, batches: [], nextExpiry: null };
    row.qty = round3(row.qty + left);
    row.value = round2(row.value + left * b.costPerKg);
    row.batches.push({ ...b, left });
    row.nextExpiry = row.nextExpiry === null ? b.expiresAt : Math.min(row.nextExpiry, b.expiresAt);
    map.set(b.variety, row);
  }
  const rows = [...map.values()];
  for (const r of rows) {
    r.avgCost = r.qty > 0 ? round2(r.value / r.qty) : 0;
    r.batches.sort((a, b) => a.expiresAt - b.expiresAt);
  }
  return rows.sort((a, b) => (a.nextExpiry ?? 0) - (b.nextExpiry ?? 0));
}

export function knownVarieties(s: State): string[] {
  const set = new Set<string>(Object.keys(s.settings.defaultShelfLife));
  for (const b of s.batches) set.add(b.variety);
  return [...set].sort();
}

export function lastSellingPrice(s: State, variety: string): number | null {
  const sales = s.sales.filter((x) => x.variety === variety);
  if (!sales.length) return null;
  return sales.reduce((a, b) => (b.date > a.date ? b : a)).pricePerKg;
}

export const marginPct = (price: number, cost: number) =>
  price > 0 ? round2(((price - cost) / price) * 100) : 0;

/** Price needed to hit a target margin on cost. */
export const priceForMargin = (cost: number, pct: number) =>
  pct >= 100 ? 0 : round2(cost / (1 - pct / 100));

// ---------- Weekly reporting ----------

export function weekRange(now: number, offsetWeeks = 0): { start: number; end: number } {
  const d = new Date(startOfDay(now));
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  const start = d.getTime() - dow * DAY + offsetWeeks * 7 * DAY;
  return { start, end: start + 7 * DAY }; // [start, end)
}

export type VarietyReport = {
  variety: string;
  opening: number;
  purchased: number;
  sold: number;
  wasted: number;
  closing: number;
  revenue: number;
  cogs: number;
  wasteCost: number;
  profit: number;
  avgPrice: number;
  avgCost: number;
  marginPct: number;
};

export type WeekReport = {
  revenue: number;
  cogs: number;
  grossProfit: number;
  wasteCost: number;
  tripCosts: number; // memo only: already inside landed cost
  netProfit: number;
  marginPct: number; // net profit / revenue
  soldKg: number;
  purchasedKg: number;
  purchasedValue: number;
  varieties: VarietyReport[];
};

const within = (t: number, a: number, b: number) => t >= a && t < b;

export function weekReport(s: State, start: number, end: number): WeekReport {
  const names = new Set<string>();
  s.batches.forEach((b) => names.add(b.variety));
  const rows: VarietyReport[] = [...names].sort().map((variety) => {
    const bs = s.batches.filter((b) => b.variety === variety);
    const sales = s.sales.filter((x) => x.variety === variety);
    const wastes = s.wastes.filter((x) => x.variety === variety);
    const bought = (f: (t: number) => boolean) =>
      bs.filter((b) => f(b.purchasedAt)).reduce((a, b) => a + b.qty, 0);
    const sold = (f: (t: number) => boolean) =>
      sales.filter((x) => f(x.date)).reduce((a, x) => a + x.qty, 0);
    const wst = (f: (t: number) => boolean) =>
      wastes.filter((x) => f(x.date)).reduce((a, x) => a + x.qty, 0);

    const before = (t: number) => t < start;
    const inWeek = (t: number) => within(t, start, end);
    const upToEnd = (t: number) => t < end;

    const opening = bought(before) - sold(before) - wst(before);
    const purchased = bought(inWeek);
    const soldQ = sold(inWeek);
    const wastedQ = wst(inWeek);
    const closing = bought(upToEnd) - sold(upToEnd) - wst(upToEnd);

    const wkSales = sales.filter((x) => inWeek(x.date));
    const revenue = wkSales.reduce((a, x) => a + x.qty * x.pricePerKg, 0);
    const cogs = wkSales.reduce((a, x) => a + allocCost(x.allocations), 0);
    const wasteCost = wastes
      .filter((x) => inWeek(x.date))
      .reduce((a, x) => a + x.qty * x.costPerKg, 0);
    const profit = revenue - cogs - wasteCost;
    return {
      variety,
      opening: round3(opening),
      purchased: round3(purchased),
      sold: round3(soldQ),
      wasted: round3(wastedQ),
      closing: round3(closing),
      revenue: round2(revenue),
      cogs: round2(cogs),
      wasteCost: round2(wasteCost),
      profit: round2(profit),
      avgPrice: soldQ > 0 ? round2(revenue / soldQ) : 0,
      avgCost: soldQ > 0 ? round2(cogs / soldQ) : 0,
      marginPct: revenue > 0 ? round2(((revenue - cogs) / revenue) * 100) : 0,
    };
  });

  const active = rows.filter(
    (r) => r.opening || r.purchased || r.sold || r.wasted || r.closing,
  );
  const sum = (f: (r: VarietyReport) => number) => round2(active.reduce((a, r) => a + f(r), 0));
  const revenue = sum((r) => r.revenue);
  const cogs = sum((r) => r.cogs);
  const wasteCost = sum((r) => r.wasteCost);
  const wkBatches = s.batches.filter((b) => within(b.purchasedAt, start, end));
  return {
    revenue,
    cogs,
    grossProfit: round2(revenue - cogs),
    wasteCost,
    tripCosts: round2(
      s.trips.filter((t) => within(t.date, start, end)).reduce((a, t) => a + t.extraCost, 0),
    ),
    netProfit: round2(revenue - cogs - wasteCost),
    marginPct: revenue > 0 ? round2(((revenue - cogs - wasteCost) / revenue) * 100) : 0,
    soldKg: sum((r) => r.sold),
    purchasedKg: round3(wkBatches.reduce((a, b) => a + b.qty, 0)),
    purchasedValue: round2(wkBatches.reduce((a, b) => a + b.qty * b.costPerKg, 0)),
    varieties: active,
  };
}

export const fmtDate = (t: number) =>
  new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export function addPurchase(
  s: State,
  p: {
    date: number;
    harbor: string;
    extraCost: number;
    lines: { variety: string; qty: number; rawCostPerKg: number; shelfLifeDays: number }[];
  },
): State {
  const tripId = uid();
  const costs = landedCosts(p.lines, p.extraCost);
  const batches: Batch[] = p.lines.map((l, i) => ({
    id: uid() + i,
    tripId,
    variety: l.variety,
    purchasedAt: p.date,
    shelfLifeDays: l.shelfLifeDays,
    expiresAt: startOfDay(p.date) + l.shelfLifeDays * DAY,
    qty: l.qty,
    rawCostPerKg: l.rawCostPerKg,
    costPerKg: costs[i],
  }));
  const defaults = { ...s.settings.defaultShelfLife };
  p.lines.forEach((l) => (defaults[l.variety] = l.shelfLifeDays));
  return {
    ...s,
    trips: [...s.trips, { id: tripId, date: p.date, harbor: p.harbor, extraCost: p.extraCost }],
    batches: [...s.batches, ...batches],
    settings: { ...s.settings, defaultShelfLife: defaults },
  };
}

export function addSale(
  s: State,
  p: { variety: string; qty: number; pricePerKg: number; date: number },
): { state: State; error?: string } {
  const allocations = allocateFifo(s, p.variety, p.qty);
  const got = round3(allocations.reduce((a, x) => a + x.qty, 0));
  if (got + 1e-9 < p.qty) return { state: s, error: `Only ${got} kg of ${p.variety} in stock` };
  const sale: Sale = { id: uid(), ...p, allocations };
  return { state: { ...s, sales: [...s.sales, sale] } };
}

export function addWaste(
  s: State,
  p: { batchId: string; qty: number; reason: string; date: number },
): State {
  const b = s.batches.find((x) => x.id === p.batchId);
  if (!b) return s;
  const qty = Math.min(p.qty, remaining(b, s));
  if (qty <= 0) return s;
  const w: Waste = {
    id: uid(),
    date: p.date,
    batchId: b.id,
    variety: b.variety,
    qty,
    costPerKg: b.costPerKg,
    reason: p.reason,
  };
  return { ...s, wastes: [...s.wastes, w] };
}

export const deleteSale = (s: State, id: string): State => ({
  ...s,
  sales: s.sales.filter((x) => x.id !== id),
});
