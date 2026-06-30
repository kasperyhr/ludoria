import type { GameCatalogItem } from '@ludoria/protocol';
import { GameCard } from './GameCard';

export function GameCatalog({
  games,
  isLoading,
  error
}: {
  games: GameCatalogItem[];
  isLoading: boolean;
  error: string | null;
}) {
  if (isLoading) {
    return <p className="panel-note">正在从 Worker 读取游戏目录...</p>;
  }

  if (error) {
    return <p className="panel-note panel-note--error">{error}</p>;
  }

  return (
    <div className="catalog-grid">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}
