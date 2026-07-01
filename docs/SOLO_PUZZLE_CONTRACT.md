# Solo Puzzle Contract

Solo puzzle games use a small contract that keeps puzzle rules outside React and outside route handlers.

## Flow

```text
Puzzle -> Progress -> Move -> Completion
```

- `Puzzle`: immutable puzzle definition and private solution data.
- `Progress`: player-editable state that can be saved and resumed.
- `Move`: a small player action such as setting or clearing one cell.
- `Completion`: server-side result derived from puzzle plus progress.

## Sudoku Lite

Phase 3 implements `sudoku-lite`, a fixed 4x4 puzzle used to validate the contract before adding generation, persistence, or full-size Sudoku.

The public puzzle includes:

- `id`
- `gameId`
- `size`
- `boxSize`
- `difficulty`
- `givens`
- `solutionHash`

The public puzzle does not include the solution grid.

## Move Validation

Moves are validated in `packages/game-definitions/src/solo/sudoku-lite.ts`.

Sudoku Lite rejects:

- coordinates outside the 4x4 board
- non-integer coordinates
- attempts to edit givens
- values outside `1..4`

## Hinting

Phase 4A Sudoku Lite hints return one target cell and a single candidate for the current demo. They must not return the full solution or enough structured data to reconstruct it directly.

## Completion

Completion checks compare progress against the private puzzle solution on the server side. The frontend cannot self-report completion.

## Persistence

Phase 3 stores puzzle sessions in Worker memory only. Phase 4 should move progress storage to Durable Objects and/or D1.
