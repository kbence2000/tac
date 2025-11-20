# tac — Vite + React + Cloudflare Pages + Replit

Overview
- Vite + React SPA
- Cloudflare Pages Functions for API (/api/hello)
- Express dev server for local / Replit

Local dev
1. npm ci
2. npm run dev
3. Open http://localhost:5173

Production build
1. npm ci
2. npm run build
3. Preview locally with npm run preview or run the Express server: npm start (serves from dist)

Cloudflare Pages (recommended)
- In Cloudflare Pages, create a new project and connect this GitHub repo (or deploy from this branch).
- Build command: npm run build
- Build output directory: dist
- Ensure Functions are enabled and that the functions directory is included (default: functions/)
- On push to main you’ll get automatic builds & deploys.

Replit
- Import the repo into Replit (New Repl → Import from GitHub).
- Replit will run `npm start` (see .replit).
- For first run, open the Replit shell and run `npm ci && npm run build` then start the repl, or change the run command to `npm run dev` for live dev.

Notes
- If you want a GitHub Action to publish to Cloudflare automatically, I can add a workflow that uses a CLOUDFLARE_API_TOKEN and CF_ACCOUNT_ID secret.