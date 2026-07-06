# Database Schema

Phase 5 introduces a local D1 metadata layer managed through Drizzle ORM. The schema lives in packages/db/src/schema.ts, migrations in packages/db/migrations/, and seed data in packages/db/src/seed-data.ts.

## D1 Tables

### users
Platform user metadata (placeholder for future account system).

| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| display_name | text NOT NULL | |
| created_at | text NOT NULL | ISO datetime |
| updated_at | text NOT NULL | ISO datetime |

### guest_sessions
Guest identity metadata. Does not store raw tokens.

| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| display_name | text NOT NULL | |
| created_at | text NOT NULL | |
| expires_at | text | |
| revoked_at | text | |

### game_catalog
Game directory entries.

| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| name | text NOT NULL | |
| mode | text NOT NULL | multiplayer or solo |
| status | text NOT NULL | planned, preview, or available |
| description | text NOT NULL | |
| player_count_label | text NOT NULL | |
| created_at | text NOT NULL | |
| updated_at | text NOT NULL | |

### game_sessions
Multiplayer session index. Does not store full GameState, hidden tokens, or raw session tokens.

| Column | Type | Notes |
|--------|------|-------|
| id | text PK | session ID |
| game_id | text NOT NULL | |
| status | text NOT NULL | |
| room_status | text NOT NULL | active, idle_checking, closed, abandoned |
| created_at | text NOT NULL | |
| updated_at | text NOT NULL | |
| expires_at | text | |
| closed_at | text | |
| participant_count | integer NOT NULL | |
| spectator_count | integer NOT NULL | |
| durable_object_name | text | DO name for routing |

### session_players
Participant summary. Does not store hidden tokens or raw tokens.

| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| session_id | text FK | references game_sessions |
| actor_id | text NOT NULL | |
| display_name | text NOT NULL | |
| role | text NOT NULL | player or spectator |
| joined_at | text NOT NULL | |
| left_at | text | |

### session_invites
Future invite code metadata. Does not store plaintext codes.

| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| session_id | text FK | references game_sessions |
| invite_code_hash | text NOT NULL | |
| created_at | text NOT NULL | |
| expires_at | text | |
| revoked_at | text | |

### puzzle_sessions
Solo puzzle metadata. Does not store solutions.

| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| game_id | text NOT NULL | |
| puzzle_id | text NOT NULL | |
| status | text NOT NULL | active, completed, abandoned |
| created_at | text NOT NULL | |
| updated_at | text NOT NULL | |
| completed_at | text | set when solved |
| move_count | integer NOT NULL | |

### puzzle_progress
Player progress. progress_json must not contain solution data.

| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| puzzle_session_id | text FK | references puzzle_sessions |
| progress_json | text NOT NULL | player-filled cells, no solution |
| updated_at | text NOT NULL | |

### review_summaries
Future match review. summary_json must not leak pre-game-end hidden information.

| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| session_id | text NOT NULL | |
| game_id | text NOT NULL | |
| summary_json | text NOT NULL | |
| created_at | text NOT NULL | |

## Migrations

`powershell
cd packages/db
npx drizzle-kit generate --config drizzle.config.ts
npx wrangler d1 migrations apply ludoria-db --local
`

The initial migration (0000_initial_metadata.sql) creates all 9 tables.

## What D1 Never Stores

- Raw session tokens
- Hidden player tokens, hands, private roles
- Sudoku solutions or answer grids
- Complete authoritative multiplayer GameState (that lives in DO storage)
