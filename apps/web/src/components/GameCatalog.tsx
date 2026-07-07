import type { GameCatalogItem } from '@ludoria/protocol';
import { Card } from '@ludoria/ui';
import { GameCard } from './GameCard';

function CatalogSkeleton() {
  return (
    <div className="catalog-grid">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="game-card" style={{ minHeight: 180, opacity: 0.5 }}>
          <div style={{ height: 24, width: '40%', background: 'rgba(255,246,230,0.08)', borderRadius: 4, marginBottom: 16 }} />
          <div style={{ height: 20, width: '70%', background: 'rgba(255,246,230,0.05)', borderRadius: 4, marginBottom: 10 }} />
          <div style={{ height: 16, width: '90%', background: 'rgba(255,246,230,0.04)', borderRadius: 4 }} />
        </Card>
      ))}
    </div>
  );
}

export function GameCatalog({
  games,
  isLoading,
  error,
}: {
  games: GameCatalogItem[];
  isLoading: boolean;
  error: string | null;
}) {
  if (isLoading) {
    return <CatalogSkeleton />;
  }

  if (error) {
    return (
      <div className="catalog-grid" style={{ gridTemplateColumns: '1fr' }}>
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <p className="panel-note panel-note--error" style={{ margin: 0 }}>
            无法加载游戏目录 — Worker 可能未启动或网络不可达。
          </p>
        </Card>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="catalog-grid" style={{ gridTemplateColumns: '1fr' }}>
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <p className="panel-note" style={{ margin: 0 }}>
            游戏目录为空 — 请运行 D1 seed 或等待 Worker 自动填充。
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="catalog-grid">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}
