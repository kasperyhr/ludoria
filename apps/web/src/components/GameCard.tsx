import type { GameCatalogItem } from '@ludoria/protocol';
import { Badge, Button, Card } from '@ludoria/ui';

const modeLabel: Record<GameCatalogItem['mode'], string> = {
  multiplayer: '多人桌游',
  solo: '单人益智'
};

const statusLabel: Record<GameCatalogItem['status'], string> = {
  planned: 'Planned',
  preview: 'Preview',
  available: 'Available'
};

export function GameCard({ game }: { game: GameCatalogItem }) {
  const demoPathByGameId: Partial<Record<GameCatalogItem['id'], string>> = {
    'token-bluffing-demo': '/demo/token-bluffing',
    'sudoku-lite': '/demo/sudoku-lite'
  };
  const demoPath = demoPathByGameId[game.id];

  return (
    <Card className="game-card">
      <div className="game-card__topline">
        <Badge>{modeLabel[game.mode]}</Badge>
        <span>{statusLabel[game.status]}</span>
      </div>
      <h3>{game.name}</h3>
      <p>{game.description}</p>
      <div className="game-card__footer">
        <span>{game.playerCountLabel}</span>
        {demoPath ? (
          <Button onClick={() => { window.location.href = demoPath; }}>进入 demo</Button>
        ) : (
          <span>{game.id}</span>
        )}
      </div>
    </Card>
  );
}
