import type { PropsWithChildren } from 'react';

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand-mark" href="/" aria-label="Ludoria home">
          <span className="brand-sigil">L</span>
          <span>
            <strong>Ludoria</strong>
            <small>Game Hub</small>
          </span>
        </a>
        <nav className="nav-links" aria-label="Primary navigation">
          <a href="/">大厅</a>
          <a href="/#catalog">游戏</a>
          <a href="/demo/token-bluffing">Token Demo</a>
          <a href="/demo/sudoku-lite">Sudoku</a>
        </nav>
      </header>
      {children}
      <footer style={{ maxWidth: 1180, margin: '64px auto 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.76rem' }}>
        Ludoria &middot; Cloudflare Game Hub
      </footer>
    </div>
  );
}
