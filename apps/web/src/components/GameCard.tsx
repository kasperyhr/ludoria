import type { GameCatalogItem } from '@ludoria/protocol';
import { Badge, Button, Card } from '@ludoria/ui';

const modeLabel: Record<GameCatalogItem['mode'], string> = {
  multiplayer: '多人桌游',
  solo: '单人益智'
};

const statusLabel: Record<GameCatalogItem['status'], string> = {
  planned: '规划中',
  preview: 'Preview',
  available: '可用',
};

const statusVariant: Record<GameCatalogItem['status'], 'neutral' | 'success'> = {
  planned: 'neutral',
  preview: 'neutral',
  available: 'success',
};

export function GameCard({ game }: { game: GameCatalogItem }) {
  const demoPathByGameId: Partial<Record<GameCatalogItem['id'], string>> = {
    'token-bluffing-demo': '/demo/token-bluffing',
    'sudoku-lite': '/demo/sudoku-lite',
  };
  const demoPath = demoPathByGameId[game.id];
  const isPlayable = game.status !== 'planned' && !!demoPath;

  return (
    <Card className="game-card">
      <div className="game-card__topline">
        <Badge>{modeLabel[game.mode]}</Badge>
        <Badge variant={statusVariant[game.status]}>{statusLabel[game.status]}</Badge>
      </div>
      <h3>{game.name}</h3>
      <p>{game.description}</p>
      <div className="game-card__footer">
        <span>{game.playerCountLabel}</span>
        {isPlayable ? (
          <Button onClick={() => { window.location.href = demoPath; }}>进入 demo</Button>
        ) : (
          <Button variant="ghost" disabled>即将推出</Button>
        )}
      </div>
    </Card>
  );
}
