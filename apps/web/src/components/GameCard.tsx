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
  const canOpenDemo = game.id === 'token-bluffing-demo';

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
        {canOpenDemo ? (
          <Button onClick={() => { window.location.href = '/demo/token-bluffing'; }}>进入 demo</Button>
        ) : (
          <span>{game.id}</span>
        )}
      </div>
    </Card>
  );
}
