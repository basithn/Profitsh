export type Batch = {
  id: string;
  tripId: string;
  variety: string;
  purchasedAt: number; // ms
  shelfLifeDays: number;
  expiresAt: number; // ms
  qty: number; // kg bought
  rawCostPerKg: number; // harbor price
  costPerKg: number; // landed cost (harbor price + share of trip costs)
};

export type Trip = {
  id: string;
  date: number;
  harbor: string;
  extraCost: number; // transport, ice, labour, tolls
};

export type Allocation = { batchId: string; qty: number; costPerKg: number };

export type Sale = {
  id: string;
  date: number;
  variety: string;
  qty: number;
  pricePerKg: number;
  allocations: Allocation[];
};

export type Waste = {
  id: string;
  date: number;
  batchId: string;
  variety: string;
  qty: number;
  costPerKg: number;
  reason: string;
};

export type Settings = {
  currency: string;
  targetMarginPct: number;
  defaultShelfLife: Record<string, number>; // variety -> days
};

export type State = {
  trips: Trip[];
  batches: Batch[];
  sales: Sale[];
  wastes: Waste[];
  settings: Settings;
};

export const emptyState = (): State => ({
  trips: [],
  batches: [],
  sales: [],
  wastes: [],
  settings: { currency: '₹', targetMarginPct: 25, defaultShelfLife: {} },
});
