# Roadmap

## Phase 0: Bootstrap

Create the monorepo, documentation, rules, local skills, and package placeholders.

## Phase 1: Runnable Shell

Make the web and Worker apps run locally with basic navigation, a health API, a mock game catalog, and shared protocol types.

## Phase 2: Demo Multiplayer Game

Implement `Token Bluffing Demo` to validate:

- local `GameSessionActor` placeholder
- WebSocket session flow
- command validation
- public events
- server-authoritative hidden state
- safe player and spectator view projection

## Phase 3: Demo Solo Puzzle

Implemented `Sudoku Lite` to validate:

- `Puzzle -> Progress -> Move -> Completion`
- public puzzle projection without solution leakage
- locked givens
- move validation
- progress updates
- hint endpoint
- completion check endpoint
- minimal protocol runtime validation with Valibot

## Phase 4: Cloudflare Integration

Move local placeholders toward production Cloudflare primitives:

- migrate `GameSessionActor` to Durable Objects
- persist puzzle progress and session metadata in Durable Objects and/or D1
- introduce migration-ready D1 schema
- add Wrangler deployment workflow
- define real environment bindings and secrets strategy
- decide where R2 is needed for assets, logs, or generated content

## Phase 5: Polish UI

Refine the game hall into a premium board game lounge experience with responsive layouts, stronger game cards, cleaner session ergonomics, and visual QA.

## Phase 6: Real Games

Add real multiplayer board games and richer solo puzzle games after the engine contracts, security boundaries, and persistence model are stable.
