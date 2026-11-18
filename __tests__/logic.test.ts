import { describe, expect, test } from "@jest/globals";
import { addPurchase, addSale, addWaste, daysLeft, freshness, landedCosts, remaining, stockRows, weekRange, weekReport, DAY, startOfDay } from '../src/logic';
import { emptyState } from '../src/types';

const mon = startOfDay(new Date(2026, 10, 16).getTime()); // Mon 16 Nov 2026

test('landed cost spreads trip costs by value', () => {
  const c = landedCosts([{ qty: 10, rawCostPerKg: 100 }, { qty: 10, rawCostPerKg: 300 }], 400);
  // extra: 100 to first, 300 to second
  expect(c).toEqual([110, 330]);
});

test('week flow: buy, sell FIFO, waste, restock', () => {
  let s = addPurchase(emptyState(), { date: mon, harbor: 'H', extraCost: 0, lines: [{ variety: 'Seer', qty: 20, rawCostPerKg: 500, shelfLifeDays: 3 }] });
  s = addPurchase(s, { date: mon + 2 * DAY, harbor: 'H', extraCost: 100, lines: [{ variety: 'Seer', qty: 10, rawCostPerKg: 600, shelfLifeDays: 3 }] });
  let r = addSale(s, { variety: 'Seer', qty: 25, pricePerKg: 700, date: mon + 2 * DAY + 1000 });
  expect(r.error).toBeUndefined();
  s = r.state;
  const [a, b] = s.batches;
  expect(remaining(a, s)).toBe(0);
  expect(remaining(b, s)).toBe(5);
  s = addWaste(s, { batchId: b.id, qty: 2, reason: 'spoiled', date: mon + 3 * DAY });
  expect(addSale(s, { variety: 'Seer', qty: 9, pricePerKg: 1, date: mon }).error).toMatch(/Only 3/);

  const { start, end } = weekRange(mon + 3 * DAY);
  expect(start).toBe(mon);
  const rep = weekReport(s, start, end);
  // 20kg@500 + 5kg@610 = 13050 cogs; revenue 25*700=17500; waste 2*610=1220
  expect(rep.cogs).toBe(13050);
  expect(rep.revenue).toBe(17500);
  expect(rep.netProfit).toBe(17500 - 13050 - 1220);
  const v = rep.varieties[0];
  expect([v.opening, v.purchased, v.sold, v.wasted, v.closing]).toEqual([0, 30, 25, 2, 3]);
  // next week opens with 3
  const nw = weekReport(s, start + 7 * DAY, end + 7 * DAY);
  expect(nw.varieties[0].opening).toBe(3);
  expect(stockRows(s)[0].qty).toBe(3);
});

test('freshness', () => {
  const s = addPurchase(emptyState(), { date: mon, harbor: '', extraCost: 0, lines: [{ variety: 'A', qty: 1, rawCostPerKg: 1, shelfLifeDays: 2 }] });
  const b = s.batches[0];
  expect(daysLeft(b, mon + 3600e3)).toBe(2);
  expect(freshness(b, mon + DAY)).toBe('soon');
  expect(freshness(b, mon + 2 * DAY)).toBe('today');
  expect(freshness(b, mon + 3 * DAY)).toBe('expired');
});
