# ATL | Austin Trading League

A high-performance, turn-based trading league web app for the AustinLeague (AL2) ecosystem.

## 🚀 Features

- **Multi-Division & League Hierarchy:**
  - **Forex Division:** Forex Scalp League (1% max SL limit).
  - **Crypto Division:** Crypto Scalp League (2% max SL limit).
  - **ATL Master Standings:** Ranked by Average Position across leagues.
- **Turn-Based Order of Play:**
  - Reverse ladder (#20 to #1) where trailing players trade first.
  - 1 trade per player per round with dynamic queue filtering.
  - Concurrent multi-order execution with live holding duration tracking.
- **Risk Management & Discipline Index:**
  - Live calculations for Risk $, Risk %, Reward $, and Risk-to-Reward ratio.
  - Inline SL limit breach warnings (`isRiskyTrade` stat tracking).
- **Interactive Equity Curves:**
  - Wallet balance curves toggleable between **Per Trade** and **Daily Close**.
  - Multi-wallet treasury: Master Treasury, Forex Wallet, Crypto Wallet.
- **Detailed Player & Team Profiles:**
  - Deep-dive metrics: Win rates, Long vs Short %, best/worst trade, discipline index, and trade history.
- **Cloud Sync & Safety:**
  - Firebase Firestore real-time sync (`onSnapshot`).
  - 1-click JSON backup export.

## 🛠 Tech Stack

- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Modern Dark Theme + Tailwind CSS v4
- **Backend:** Firebase Firestore
- **Icons:** Lucide React
- **Celebration FX:** Canvas Confetti

## 📦 Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

Build for production:
```bash
npm run build
```
