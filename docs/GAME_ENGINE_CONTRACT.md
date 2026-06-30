# Game Engine Contract

`packages/game-engine` defines framework-neutral contracts. Concrete rules live in `packages/game-definitions`; React components and Worker route handlers should not contain core rules.

## MultiplayerGameDefinition

Multiplayer games use:

- `setup`
- `validateCommand`
- `applyCommand`
- `applyEvent`
- `getPlayerView`
- `getSpectatorView`
- `getReviewSummary`

The required flow is:

```text
Command -> Validate -> Event -> State -> View
```

`Token Bluffing Demo` uses this contract to prove hidden information boundaries. Full state can contain hidden tokens, but public views and public events must not leak them.

## SoloPuzzleDefinition

Solo puzzles use:

- `createInitialProgress`
- `validateMove`
- `applyMove`
- `checkCompletion`
- `getHint`
- `getPublicPuzzle`
- `getSolutionHash`

The required flow is:

```text
Puzzle -> Progress -> Move -> Completion
```

`Sudoku Lite` uses this contract to prove a solo puzzle can expose a public puzzle, accept validated moves, persist progress, return safe hints, and check completion without sending the full solution to the frontend.

## Boundary Rules

- Game definitions own game rules.
- Protocol schemas own transport-level shape validation.
- Worker handlers own HTTP/WebSocket wiring and session lookup.
- React owns rendering and user interaction only.
