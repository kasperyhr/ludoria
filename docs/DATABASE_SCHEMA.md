# Database Schema

Phase 5 introduced a local D1 metadata layer managed through Drizzle ORM. Phase 6 adds indexes, migration automation, and a seed script.

## Schema Location

- `packages/db/src/schema.ts` -- Drizzle ORM schema (9 tables, 12 indexes)
- `packages/db/migrations/0000_initial_metadata.sql` -- initial table creation
- `packages/db/migrations/0001_add_metadata_indexes.sql` -- index creation
- `packages/db/src/seed-data.ts` -- game catalog seed data

## Running Migrations Locally

```powershell
corepack pnpm db:migrate:local
```

## Seeding Locally

```powershell
corepack pnpm db:seed:local
```

The worker also auto-seeds the game_catalog on first `/api/games` read if the table is empty.

## Tables

9 tables: users, guest_sessions, game_catalog, game_sessions, session_players, session_invites, puzzle_sessions, puzzle_progress, review_summaries.

See `packages/db/src/schema.ts` for the authoritative column definitions.

## Indexes

12 indexes on: game_catalog(mode, status), game_sessions(game_id, status, room_status), session_players(session_id, actor_id), session_invites(session_id), puzzle_sessions(game_id, status), puzzle_progress(puzzle_session_id), review_summaries(session_id).

## What D1 Never Stores

- Raw session tokens
- Hidden player tokens, hands, private roles
- Sudoku solutions or answer grids
- Complete authoritative multiplayer GameState (that lives in DO storage)
