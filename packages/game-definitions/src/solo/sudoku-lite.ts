import type { SoloPuzzleDefinition, ValidationResult } from '@ludoria/game-engine';
import type {
  PuzzleCompletionResponse,
  PuzzleHintResponse,
  PuzzleProgressView,
  SudokuCellValue,
  SudokuLitePublicPuzzle
} from '@ludoria/protocol';

export type SudokuLiteCell = SudokuCellValue | null;

export interface SudokuLitePuzzle {
  id: 'sudoku-lite-built-in-001';
  gameId: 'sudoku-lite';
  size: 4;
  boxSize: 2;
  difficulty: 'intro';
  givens: Array<{
    row: number;
    col: number;
    value: SudokuCellValue;
  }>;
  solution: SudokuCellValue[][];
}

export interface SudokuLiteProgress extends PuzzleProgressView {}

export interface SudokuLiteMove {
  row: number;
  col: number;
  value: SudokuCellValue | null;
}

export const sudokuLiteBuiltInPuzzle: SudokuLitePuzzle = {
  id: 'sudoku-lite-built-in-001',
  gameId: 'sudoku-lite',
  size: 4,
  boxSize: 2,
  difficulty: 'intro',
  givens: [
    { row: 0, col: 0, value: 1 },
    { row: 0, col: 3, value: 4 },
    { row: 1, col: 1, value: 4 },
    { row: 1, col: 2, value: 1 },
    { row: 2, col: 1, value: 1 },
    { row: 2, col: 2, value: 4 },
    { row: 3, col: 0, value: 4 },
    { row: 3, col: 3, value: 1 }
  ],
  solution: [
    [1, 2, 3, 4],
    [3, 4, 1, 2],
    [2, 1, 4, 3],
    [4, 3, 2, 1]
  ]
};

function nowIso() {
  return new Date().toISOString();
}

function createEmptyGrid(size: number): SudokuLiteCell[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null));
}

function isGiven(puzzle: SudokuLitePuzzle, row: number, col: number) {
  return puzzle.givens.some((given) => given.row === row && given.col === col);
}

function withGivens(puzzle: SudokuLitePuzzle, cells: SudokuLiteCell[][]) {
  const next = cells.map((row) => [...row]);

  for (const given of puzzle.givens) {
    const row = next[given.row];
    if (row) {
      row[given.col] = given.value;
    }
  }

  return next;
}

function getSolutionValue(puzzle: SudokuLitePuzzle, row: number, col: number) {
  return puzzle.solution[row]?.[col] ?? null;
}

function countErrors(puzzle: SudokuLitePuzzle, progress: SudokuLiteProgress) {
  let errorCount = 0;

  for (let row = 0; row < puzzle.size; row += 1) {
    for (let col = 0; col < puzzle.size; col += 1) {
      const value = progress.cells[row]?.[col] ?? null;

      if (value !== null && value !== getSolutionValue(puzzle, row, col)) {
        errorCount += 1;
      }
    }
  }

  return errorCount;
}

function countEmpty(progress: SudokuLiteProgress) {
  return progress.cells.flat().filter((value) => value === null).length;
}

export const sudokuLiteDefinition: SoloPuzzleDefinition<
  SudokuLitePuzzle,
  SudokuLitePublicPuzzle,
  SudokuLiteProgress,
  SudokuLiteMove,
  NonNullable<PuzzleHintResponse['hint']>,
  PuzzleCompletionResponse
> = {
  id: 'sudoku-lite',
  displayName: 'Sudoku Lite',
  createInitialProgress(puzzle) {
    return {
      cells: withGivens(puzzle, createEmptyGrid(puzzle.size)),
      updatedAt: nowIso(),
      moveCount: 0
    };
  },
  validateMove(puzzle, _progress, move): ValidationResult<SudokuLiteMove> {
    if (!Number.isInteger(move.row) || !Number.isInteger(move.col)) {
      return { ok: false, error: 'INVALID_COORDINATE', message: 'row and col must be integers.' };
    }

    if (move.row < 0 || move.row >= puzzle.size || move.col < 0 || move.col >= puzzle.size) {
      return { ok: false, error: 'INVALID_COORDINATE', message: 'row and col are outside the puzzle board.' };
    }

    if (isGiven(puzzle, move.row, move.col)) {
      return { ok: false, error: 'GIVEN_CELL_LOCKED', message: 'givens cannot be overwritten.' };
    }

    if (move.value !== null && ![1, 2, 3, 4].includes(move.value)) {
      return { ok: false, error: 'INVALID_VALUE', message: 'value must be 1-4 or null.' };
    }

    return { ok: true, value: move };
  },
  applyMove(puzzle, progress, move) {
    const validation = this.validateMove(puzzle, progress, move);

    if (!validation.ok) {
      return validation;
    }

    const cells = progress.cells.map((row) => [...row]);
    const targetRow = cells[move.row];

    if (!targetRow) {
      return { ok: false, error: 'INVALID_COORDINATE', message: 'row is outside the puzzle board.' };
    }

    targetRow[move.col] = move.value;

    return {
      ok: true,
      value: {
        cells: withGivens(puzzle, cells),
        updatedAt: nowIso(),
        moveCount: progress.moveCount + 1
      }
    };
  },
  checkCompletion(puzzle, progress) {
    const emptyCells = countEmpty(progress);
    const errorCount = countErrors(puzzle, progress);

    return {
      isComplete: emptyCells === 0,
      isSolved: emptyCells === 0 && errorCount === 0,
      emptyCells,
      errorCount
    };
  },
  getHint(puzzle, progress) {
    for (let row = 0; row < puzzle.size; row += 1) {
      for (let col = 0; col < puzzle.size; col += 1) {
        if (isGiven(puzzle, row, col)) {
          continue;
        }

        const current = progress.cells[row]?.[col] ?? null;

        if (current === null) {
          const correct = getSolutionValue(puzzle, row, col);
          const candidates = ([1, 2, 3, 4] as SudokuCellValue[])
            .filter((value) => value === correct || value !== current)
            .slice(0, 2);

          return {
            row,
            col,
            candidates,
            message: `第 ${row + 1} 行第 ${col + 1} 列可以先比较所在行和 2x2 宫。`
          };
        }
      }
    }

    return null;
  },
  getPublicPuzzle(puzzle) {
    return {
      id: puzzle.id,
      gameId: puzzle.gameId,
      size: puzzle.size,
      boxSize: puzzle.boxSize,
      difficulty: puzzle.difficulty,
      givens: puzzle.givens,
      solutionHash: this.getSolutionHash(puzzle)
    };
  },
  getSolutionHash(puzzle) {
    return `sudoku-lite:${puzzle.id}:solution-hash-placeholder`;
  }
};
