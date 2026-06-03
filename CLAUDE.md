# GainQuest — CLAUDE.md

GainQuest is a webapp where users unlock gaming time by completing workouts.
The harder you train, the more gaming time you earn.

## Stack
- **Frontend**: Vue 3 + TypeScript + Vite (`frontend/`)
- **Backend**: Node.js + Express + TypeScript (`backend/`)
- **Auth + DB**: Supabase (PostgreSQL with RLS)
- **Dev**: Docker Compose

## Monorepo structure
```
gainquest/
  frontend/          Vue 3 app
    src/
      assets/        Global CSS (dark gamer theme)
      components/    Reusable UI components
      composables/   Vue composables
      lib/           supabase.ts client
      router/        Vue Router (auth guards included)
      stores/        Pinia stores (auth.ts, ...)
      types/         database.ts (typed Supabase schema)
      views/         Page-level components
  backend/           Express API
    src/
      lib/           supabase.ts (service role client)
      middleware/    auth.ts (JWT verification)
      routes/        auth.ts, workouts.ts, profiles.ts
  supabase/
    migrations/      001_initial_schema.sql
  docker-compose.yml
  .env.example
```

## Database schema (Supabase)
- `profiles` — extends auth.users; tracks level, XP, gaming time, streak
- `workout_templates` — reusable workout plans (public or private)
- `workout_sessions` — logged workouts with XP and gaming minutes earned
- `exercises` — individual exercises within a session

RLS is enabled on all tables. A trigger auto-creates a profile on signup.

## XP & gaming time logic (Phase 3)
- Each completed set earns XP based on volume (sets × reps × weight)
- Completing a session earns bonus gaming minutes
- Level = floor(sqrt(xp / 100))
- Streak: consecutive days with at least one completed session

## Build phases
1. ✅ Project setup, auth, DB schema
2. Database model (done in migration 001)
3. Core features: workout logging, template builder, XP calculation
4. Gaming timer: countdown, loot animation, streak display
5. Guides library: preset programs (PPL, Full Body, 5x5)

## Dev setup
1. Copy `.env.example` to `.env` and fill in Supabase credentials
2. Run the SQL in `supabase/migrations/001_initial_schema.sql` in Supabase SQL editor
3. `npm install` from root
4. `npm run dev` to start both frontend (port 5173) and backend (port 3000)

## Style
- Dark gamer theme using CSS custom properties in `frontend/src/assets/main.css`
- Primary: `#7c3aed` (purple), Accent: `#10b981` (green), XP: `#f59e0b` (gold)
- No UI framework — plain CSS with `.card`, `.btn`, `.input` utility classes
