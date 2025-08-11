# BarnPilot Demo UI (Offline, LocalStorage)

A fully client-side demo of BarnPilot with complete offline CRUD for core features. **No backend required.**

## Features
- Dashboard: KPIs, quick add, recent activity
- Schedule: weekly grid, add/edit/delete events
- Horses & Staff: full CRUD
- Billing: invoices with line items, full CRUD and totals
- Shows: assign horses, full CRUD
- Barn Setup: stalls (assign/reassign/delete), feed schedule CRUD
- Tasks / Live Board: full CRUD + fullscreen board
- Client Updates: template generator + copy
- Reports: computed stats + narrative summary
- Settings: barn name, dark mode, export/import JSON
- Reset demo data button

## How to run locally
1. Download the ZIP and unzip.
2. Open `index.html` in your browser (double-click). Everything works offline.

## Publish on GitHub Pages
1. Create a GitHub repo (e.g., `barnpilot-demo-ui`).
2. Upload **the contents** of the folder (not the folder itself):
   ```
   index.html
   README.md
   assets/
     ├── styles.css
     └── app.js
   ```
3. Go to **Settings → Pages**:
   - Source: *Deploy from a branch*
   - Branch: `main` → `/ (root)`
4. Wait ~30–60 seconds for Pages to build, then open the URL it provides.

## Import/Export Data
- **Export:** `Schedule` or `Settings` → **Export JSON** (downloads `barnpilot-demo-data.json`).
- **Import:** Click **Import JSON** and select a previously exported file.
  - Import replaces your current local data with the file’s data.
  - If the file is invalid, you’ll see an alert.

## Data storage
All data is stored in your browser under `localStorage` key `barnpilot_demo_state_v2`.
To reset, use the **Reset Demo Data** button or clear browser storage.
