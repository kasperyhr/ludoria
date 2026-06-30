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
          <a href="#catalog">游戏目录</a>
          <a href="#status">联调状态</a>
        </nav>
      </header>
      {children}
    </div>
  );
}
