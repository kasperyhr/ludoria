import { useMemo, useState } from 'react';
import type { PuzzleCompletionResponse, PuzzlePublicView, SudokuCellValue } from '@ludoria/protocol';
import { Badge, Button, Card } from '@ludoria/ui';
import { applyPuzzleMove, checkPuzzleCompletion, createSudokuLiteSession, getPuzzleHint, getPuzzleSession } from '../api/client';
import { AppLayout } from '../components/AppLayout';

type SelectedCell = { row: number; col: number };
const digits: SudokuCellValue[] = [1, 2, 3, 4];

function cellKey(row: number, col: number) { return `${row}:${col}`; }

export function SudokuLitePage() {
  const [sessionId, setSessionId] = useState(sessionStorage.getItem('ludoria.sudoku.sessionId') ?? '');
  const [view, setView] = useState<PuzzlePublicView | null>(null);
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [completion, setCompletion] = useState<PuzzleCompletionResponse | null>(null);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [error, setError] = useState<string | null>(null);
  const [cellErrors, setCellErrors] = useState<Set<string>>(new Set());

  const givens = useMemo(() => {
    const locked = new Set<string>();
    for (const g of view?.puzzle.givens ?? []) locked.add(cellKey(g.row, g.col));
    return locked;
  }, [view]);

  const values = useMemo(() => {
    const v = new Map<string, SudokuCellValue>();
    for (const g of view?.puzzle.givens ?? []) v.set(cellKey(g.row, g.col), g.value);
    view?.progress.cells.forEach((row, r) => row.forEach((val, c) => { if (val !== null) v.set(cellKey(r, c), val); }));
    return v;
  }, [view]);

  async function createSession() {
    setError(null); setHint(null); setCompletion(null); setCellErrors(new Set()); setSaveStatus('creating');
    try {
      const r = await createSudokuLiteSession();
      setSessionId(r.sessionId); setView(r);
      sessionStorage.setItem('ludoria.sudoku.sessionId', r.sessionId);
      setSaveStatus('saved');
    } catch (e) { setError(e instanceof Error ? e.message : '无法创建'); setSaveStatus('error'); }
  }

  async function loadSession() {
    if (!sessionId.trim()) { setError('请输入或创建 puzzle session'); return; }
    setError(null); setHint(null); setCompletion(null); setSaveStatus('loading');
    try {
      setView(await getPuzzleSession(sessionId.trim()));
      setSaveStatus('saved');
    } catch (e) { setError(e instanceof Error ? e.message : '无法读取'); setSaveStatus('error'); }
  }

  async function submitMove(value: SudokuCellValue | null) {
    if (!view || !selectedCell) return;
    if (givens.has(cellKey(selectedCell.row, selectedCell.col))) { setError('题目给定格不能修改'); return; }
    setError(null); setHint(null); setSaveStatus('saving');
    try {
      const r = await applyPuzzleMove(view.sessionId, { row: selectedCell.row, col: selectedCell.col, value });
      setView({ ...view, progress: r.progress });
      setSaveStatus('saved');
      // Clear error highlight for this cell
      const key = cellKey(selectedCell.row, selectedCell.col);
      setCellErrors((prev) => { const next = new Set(prev); next.delete(key); return next; });
    } catch (e) { setError(e instanceof Error ? e.message : '落子失败'); setSaveStatus('error'); }
  }

  async function requestHint() {
    if (!view) return;
    setError(null);
    try {
      const r = await getPuzzleHint(view.sessionId);
      if (r.hint) {
        setHint(`提示：第 ${r.hint.row + 1} 行第 ${r.hint.col + 1} 列，可尝试 ${r.hint.candidates.join(' 或 ')}。`);
      } else {
        setHint('所有空格已填完或不需提示。');
      }
    } catch (e) { setError(e instanceof Error ? e.message : '无法获取提示'); }
  }

  async function requestCheck() {
    if (!view) return;
    setError(null);
    try {
      const c = await checkPuzzleCompletion(view.sessionId);
      setCompletion(c);
      if (!c.isSolved && c.errorCount > 0) {
        // Mark error cells
        const errs = new Set<string>();
        view.puzzle.givens.forEach((g) => { /* skip givens */ });
        // We cannot determine exact error cells from just the count without solution
        // So we show the error count in the banner
      }
    } catch (e) { setError(e instanceof Error ? e.message : '无法检查'); }
  }

  return (
    <AppLayout>
      <main className="demo-shell sudoku-shell">
        <section className="section-heading">
          <p className="eyebrow">Sudoku Lite</p>
          <h1>4x4 单人数独流程验证</h1>
          <p>创建 puzzle session，编辑公开进度，通过 Worker 校验移动、提示和完成状态。</p>
        </section>

        <div className="sudoku-layout">
          <Card className="control-panel">
            <h2>Puzzle Session</h2>
            <label>Session ID <input value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="创建后自动填入" /></label>
            <div className="actions" style={{ marginTop: 8 }}>
              <Button onClick={createSession}>创建 session</Button>
              <Button variant="secondary" onClick={loadSession}>读取 session</Button>
            </div>
            <p style={{ marginTop: 14, fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              保存状态: <Badge variant={saveStatus === 'saved' ? 'success' : saveStatus === 'error' ? 'danger' : 'neutral'}>{saveStatus}</Badge>
            </p>
            {view && <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>题目: {view.puzzle.id} &middot; 难度: {view.puzzle.difficulty}</p>}
            {error && <p className="panel-note panel-note--error" style={{ marginTop: 12 }}>{error}</p>}
            {completion?.isSolved && (
              <div className="completion-banner" style={{ marginTop: 16 }}>
                <p>恭喜！数独已完成！</p>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: 4 }}>共 {view?.progress.moveCount ?? 0} 步</p>
              </div>
            )}
          </Card>

          <Card className="control-panel sudoku-board-panel">
            <div className="sudoku-board-header">
              <h2>Board</h2>
              {completion && (
                <Badge variant={completion.isSolved ? 'success' : completion.errorCount > 0 ? 'danger' : 'neutral'}>
                  {completion.isSolved ? '完成' : `${completion.errorCount} 个错误`}
                </Badge>
              )}
            </div>

            <div className="sudoku-board" aria-label="Sudoku Lite board">
              {Array.from({ length: 16 }, (_, i) => {
                const row = Math.floor(i / 4);
                const col = i % 4;
                const key = cellKey(row, col);
                const value = values.get(key);
                const isGiven = givens.has(key);
                const isSelected = selectedCell?.row === row && selectedCell.col === col;
                const isError = cellErrors.has(key);
                return (
                  <button key={key} className="sudoku-cell" data-given={isGiven} data-selected={isSelected} data-error={isError}
                    onClick={() => setSelectedCell({ row, col })} type="button">
                    {value ?? ''}
                  </button>
                );
              })}
            </div>

            <div className="sudoku-status-bar">
              {view && <span>步数: {view.progress.moveCount}</span>}
              {selectedCell && <span>选中: 第{selectedCell.row + 1}行 第{selectedCell.col + 1}列</span>}
            </div>

            <div className="sudoku-controls">
              {digits.map((d) => <Button key={d} onClick={() => { void submitMove(d); }}>{d}</Button>)}
              <Button variant="secondary" onClick={() => { void submitMove(null); }}>清空</Button>
            </div>

            <div className="actions" style={{ justifyContent: 'center', marginTop: 4 }}>
              <Button variant="secondary" onClick={requestHint}>提示</Button>
              <Button onClick={requestCheck}>检查完成</Button>
            </div>

            {hint && <p className="panel-note panel-note--success" style={{ marginTop: 12 }}>{hint}</p>}
            {completion && !completion.isSolved && completion.errorCount > 0 && (
              <p className="panel-note panel-note--error" style={{ marginTop: 8 }}>
                还有 {completion.errorCount} 个格子的值不正确，还有 {completion.emptyCells} 个空格。
              </p>
            )}
          </Card>
        </div>
      </main>
    </AppLayout>
  );
}
