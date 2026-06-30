import { useMemo, useState } from 'react';
import type { PuzzleCompletionResponse, PuzzleHintResponse, PuzzlePublicView, SudokuCellValue } from '@ludoria/protocol';
import { Badge, Button, Card } from '@ludoria/ui';
import {
  applyPuzzleMove,
  checkPuzzleCompletion,
  createSudokuLiteSession,
  getPuzzleHint,
  getPuzzleSession
} from '../api/client';
import { AppLayout } from '../components/AppLayout';

type SelectedCell = {
  row: number;
  col: number;
};

const digits: SudokuCellValue[] = [1, 2, 3, 4];

function cellKey(row: number, col: number) {
  return `${row}:${col}`;
}

export function SudokuLitePage() {
  const [sessionId, setSessionId] = useState(sessionStorage.getItem('ludoria.sudoku.sessionId') ?? '');
  const [view, setView] = useState<PuzzlePublicView | null>(null);
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [hint, setHint] = useState<PuzzleHintResponse | null>(null);
  const [completion, setCompletion] = useState<PuzzleCompletionResponse | null>(null);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [error, setError] = useState<string | null>(null);

  const givens = useMemo(() => {
    const lockedCells = new Set<string>();

    for (const given of view?.puzzle.givens ?? []) {
      lockedCells.add(cellKey(given.row, given.col));
    }

    return lockedCells;
  }, [view]);

  const values = useMemo(() => {
    const currentValues = new Map<string, SudokuCellValue>();

    for (const given of view?.puzzle.givens ?? []) {
      currentValues.set(cellKey(given.row, given.col), given.value);
    }

    view?.progress.cells.forEach((rowValues, row) => {
      rowValues.forEach((value, col) => {
        if (value !== null) {
          currentValues.set(cellKey(row, col), value);
        }
      });
    });

    for (const given of view?.puzzle.givens ?? []) {
      currentValues.set(cellKey(given.row, given.col), given.value);
    }

    return currentValues;
  }, [view]);

  async function createSession() {
    setError(null);
    setHint(null);
    setCompletion(null);
    setSaveStatus('creating');

    try {
      const response = await createSudokuLiteSession();
      setSessionId(response.sessionId);
      setView(response);
      sessionStorage.setItem('ludoria.sudoku.sessionId', response.sessionId);
      setSaveStatus('saved');
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : '无法创建 Sudoku Lite session。');
      setSaveStatus('error');
    }
  }

  async function loadSession() {
    if (!sessionId.trim()) {
      setError('请输入或创建 puzzle session。');
      return;
    }

    setError(null);
    setHint(null);
    setCompletion(null);
    setSaveStatus('loading');

    try {
      const response = await getPuzzleSession(sessionId.trim());
      setView(response);
      setSaveStatus('saved');
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : '无法读取 puzzle session。');
      setSaveStatus('error');
    }
  }

  async function submitMove(value: SudokuCellValue | null) {
    if (!view || !selectedCell) {
      return;
    }

    if (givens.has(cellKey(selectedCell.row, selectedCell.col))) {
      setError('题目给定格不能修改。');
      return;
    }

    setError(null);
    setHint(null);
    setCompletion(null);
    setSaveStatus('saving');

    try {
      const response = await applyPuzzleMove(view.sessionId, {
        row: selectedCell.row,
        col: selectedCell.col,
        value
      });
      setView({ ...view, progress: response.progress });
      setSaveStatus('saved');
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : '落子失败。');
      setSaveStatus('error');
    }
  }

  async function requestHint() {
    if (!view) {
      return;
    }

    setError(null);

    try {
      setHint(await getPuzzleHint(view.sessionId));
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : '无法获取提示。');
    }
  }

  async function requestCheck() {
    if (!view) {
      return;
    }

    setError(null);

    try {
      setCompletion(await checkPuzzleCompletion(view.sessionId));
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : '无法检查完成状态。');
    }
  }

  return (
    <AppLayout>
      <main className="demo-shell sudoku-shell">
        <section className="section-heading">
          <p className="eyebrow">Sudoku Lite</p>
          <h1>4x4 单人谜题流程验证</h1>
          <p>创建 puzzle session，编辑公开进度，并通过 Worker 校验移动、提示和完成状态。</p>
        </section>

        <div className="sudoku-layout">
          <Card className="control-panel">
            <h2>Puzzle Session</h2>
            <label>
              Session ID
              <input value={sessionId} onChange={(event) => setSessionId(event.target.value)} placeholder="创建后自动填入" />
            </label>
            <div className="actions">
              <Button onClick={createSession}>创建 session</Button>
              <Button variant="secondary" onClick={loadSession}>读取 session</Button>
            </div>
            <p className="panel-note">保存状态：<Badge>{saveStatus}</Badge></p>
            {view ? (
              <p className="panel-note">题目：{view.puzzle.id} · 难度：{view.puzzle.difficulty}</p>
            ) : null}
            {error ? <p className="panel-note panel-note--error">{error}</p> : null}
          </Card>

          <Card className="control-panel sudoku-board-panel">
            <div className="sudoku-board-header">
              <h2>Board</h2>
              {completion ? (
                <Badge variant={completion.isComplete ? 'success' : 'danger'}>
                  {completion.isComplete ? 'Complete' : `${completion.errorCount} errors`}
                </Badge>
              ) : null}
            </div>

            <div className="sudoku-board" aria-label="Sudoku Lite board">
              {Array.from({ length: 16 }, (_, index) => {
                const row = Math.floor(index / 4);
                const col = index % 4;
                const key = cellKey(row, col);
                const value = values.get(key);
                const isGiven = givens.has(key);
                const isSelected = selectedCell?.row === row && selectedCell.col === col;

                return (
                  <button
                    key={key}
                    className="sudoku-cell"
                    data-given={isGiven}
                    data-selected={isSelected}
                    onClick={() => setSelectedCell({ row, col })}
                    type="button"
                  >
                    {value ?? ''}
                  </button>
                );
              })}
            </div>

            <div className="sudoku-controls">
              {digits.map((digit) => (
                <Button key={digit} onClick={() => { void submitMove(digit); }}>{digit}</Button>
              ))}
              <Button variant="secondary" onClick={() => { void submitMove(null); }}>清空</Button>
            </div>

            <div className="actions">
              <Button variant="secondary" onClick={requestHint}>提示</Button>
              <Button onClick={requestCheck}>检查完成</Button>
            </div>

            {hint ? (
              <p className="panel-note">
                {hint.hint
                  ? `提示：第 ${hint.hint.row + 1} 行第 ${hint.hint.col + 1} 列，可尝试 ${hint.hint.candidates.join(' 或 ')}。`
                  : '提示：当前没有可用提示。'}
              </p>
            ) : null}
          </Card>
        </div>
      </main>
    </AppLayout>
  );
}
