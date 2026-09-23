# Daim (دائم)

A minimal, privacy-conscious prayer tracker for Muslims. Log your five daily prayers with one tap, see your consistency over time, and optionally compare progress on a simple leaderboard.

> **Pray → log it → build consistency → see progress**

Daim deliberately avoids streaks, badges, XP, and guilt-based notifications. It never assumes you failed — it only reports what was recorded.

## Download

Android APK builds are published on [GitHub Releases](../../releases). *(Coming soon — V1 in progress.)*

## Repository layout

```
daim/
├── mobile/        React Native + Expo (TypeScript) Android app
├── backend/       Cloudflare Worker API (Hono + D1)
├── migrations/    D1 database schema migrations
└── docs/          Product spec (PRD.md) and technical spec (TECH.md)
```

## Stack

- **Mobile:** React Native, Expo, TypeScript — Android-first, distributed as APK via GitHub Releases before moving to Google Play
- **Backend:** Cloudflare Workers, Hono, D1, Analytics Engine, Cron Triggers
- **Auth:** Google Sign-In only

## Development

See [docs/PRD.md](docs/PRD.md) for product behavior and [docs/TECH.md](docs/TECH.md) for architecture, database schema, and API details.

### Backend

```bash
cd backend
bun install
bun run dev      # local dev server via wrangler
bun run test      # vitest (Workers runtime)
```

## License

TBD.
