# Fish Shop Ledger

Android app (Expo / React Native, TypeScript) for fish shop owners. Works offline; data stays on the phone.

## What it does
- **Buy** – record a harbor trip: variety, kg, cost/kg, shelf life (days). Trip costs (transport, ice, labour) are shared across the fish by value, giving a true *landed cost* per kg.
- **Stock** – cold-room inventory by variety and batch, with freshness badges (Sell today / 1 day left / Expired), a "sell first" alert, and write-off of spoiled stock.
- **Sell** – record sales through the week. Stock is deducted oldest-expiry-first (FIFO), so cost follows the batch actually sold. Shows live margin and the price needed for your target margin. Undo supported.
- **Profit** – week-by-week (Mon–Sun) sales, cost, wastage, net profit, margin per variety, and a stock movement ledger (Opening + Bought − Sold − Waste = Left) that carries across restocks.

## Run
```
npm install
npx expo start        # scan the QR code with Expo Go on your Android phone
```
## Build an installable APK
```
npm i -g eas-cli && eas login
eas build -p android --profile preview
```
## Dev
`npm test` (business logic tests), `npm run typecheck`.
