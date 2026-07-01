import test from 'node:test';
import assert from 'node:assert/strict';
import { sudokuLiteBuiltInPuzzle, sudokuLiteDefinition } from '../src/solo/sudoku-lite.ts';

test('public puzzle does not include the solution', () => {
  const publicPuzzle = sudokuLiteDefinition.getPublicPuzzle(sudokuLiteBuiltInPuzzle);
  assert.equal('solution' in publicPuzzle, false);
  assert.equal(JSON.stringify(publicPuzzle).includes('[[1,2,3,4]'), false);
});

test('givens cannot be overwritten by a move', () => {
  const progress = sudokuLiteDefinition.createInitialProgress(sudokuLiteBuiltInPuzzle);
  const result = sudokuLiteDefinition.applyMove(sudokuLiteBuiltInPuzzle, progress, { row: 0, col: 0, value: 2 });
  assert.equal(result.ok, false);
});

test('invalid digits are rejected', () => {
  const progress = sudokuLiteDefinition.createInitialProgress(sudokuLiteBuiltInPuzzle);
  const result = sudokuLiteDefinition.applyMove(sudokuLiteBuiltInPuzzle, progress, { row: 0, col: 1, value: 9 });
  assert.equal(result.ok, false);
});

test('legal moves update progress', () => {
  const progress = sudokuLiteDefinition.createInitialProgress(sudokuLiteBuiltInPuzzle);
  const result = sudokuLiteDefinition.applyMove(sudokuLiteBuiltInPuzzle, progress, { row: 0, col: 1, value: 2 });
  assert.equal(result.ok, true);
  assert.equal(result.value.cells[0][1], 2);
  assert.equal(result.value.moveCount, 1);
});

test('checkCompletion identifies incomplete and complete states', () => {
  let progress = sudokuLiteDefinition.createInitialProgress(sudokuLiteBuiltInPuzzle);
  assert.equal(sudokuLiteDefinition.checkCompletion(sudokuLiteBuiltInPuzzle, progress).isSolved, false);

  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const value = sudokuLiteBuiltInPuzzle.solution[row][col];
      const result = sudokuLiteDefinition.applyMove(sudokuLiteBuiltInPuzzle, progress, { row, col, value });
      if (result.ok) {
        progress = result.value;
      }
    }
  }

  const completion = sudokuLiteDefinition.checkCompletion(sudokuLiteBuiltInPuzzle, progress);
  assert.equal(completion.isComplete, true);
  assert.equal(completion.isSolved, true);
});

test('hint does not return the full solution', () => {
  const progress = sudokuLiteDefinition.createInitialProgress(sudokuLiteBuiltInPuzzle);
  const hint = sudokuLiteDefinition.getHint(sudokuLiteBuiltInPuzzle, progress);
  assert.ok(hint);
  assert.equal('solution' in hint, false);
  assert.equal(Array.isArray(hint.candidates), true);
  assert.deepEqual(hint.candidates, [2]);
});
