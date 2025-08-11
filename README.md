# BarnPilot Demo UI (Static)

A fully client-side demo of the BarnPilot interface for scheduling, staff assignments, billing, shows, live board, and reports. **LocalStorage only** — no backend required.

## Quick Start
1. Download and unzip this project.
2. Commit/push to a GitHub repo.
3. Enable **GitHub Pages** for the repo (Settings → Pages → "Deploy from a branch" → `main` → `/root`).
4. Visit your Pages URL to view the demo.

## Features
- Dashboard with KPIs & quick add
- Weekly schedule grid (demo)
- Horses, Staff, Billing, Shows
- Barn setup (stalls + feed schedule)
- Client updates template & copy
- Reports (computed from local data)
- Live status board with fullscreen
- Dark mode toggle
- Export demo data as JSON
- Reset demo data button

## Notes
- This is a UI/UX demo only. No authentication or server.
- Tailwind CSS included via CDN for rapid styling.
- All data persists in `localStorage` under the key `barnpilot_demo_state_v1`.
