import React from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Card } from '@ludoria/ui';
import './styles.css';

function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <p className="brand">Ludoria</p>
        <h1>在线桌游与益智游戏大厅</h1>
        <p>Phase 0 placeholder：当前只展示项目方向，不包含完整游戏 UI 或业务逻辑。</p>
        <div className="actions">
          <Button>查看游戏目录</Button>
          <Button variant="secondary">阅读架构</Button>
        </div>
      </section>
      <section className="grid" aria-label="placeholder routes">
        <Card title="多人桌游">GameSessionActor、WebSocket 和服务器权威状态将在后续阶段实现。</Card>
        <Card title="单人益智">Sudoku、Nonogram、autosave 和 completion check 先保留契约。</Card>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
