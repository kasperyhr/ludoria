import React from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Card } from '@ludoria/ui';
import './styles.css';

function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <p className="brand">Ludoria</p>
        <h1>???????????</h1>
        <p>Phase 0 placeholder?????????????????? UI ??????</p>
        <div className="actions">
          <Button>??????</Button>
          <Button variant="secondary">????</Button>
        </div>
      </section>
      <section className="grid" aria-label="placeholder routes">
        <Card title="????">GameSessionActor?WebSocket ?????????????????</Card>
        <Card title="????">Sudoku?Nonogram?autosave ? completion check ??????</Card>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
