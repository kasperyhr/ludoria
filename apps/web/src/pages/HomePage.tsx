import { useEffect, useState } from 'react';
import type { GameCatalogItem, HealthResponse } from '@ludoria/protocol';
import { Button } from '@ludoria/ui';
import { getGameCatalog, getHealth } from '../api/client';
import { AppLayout } from '../components/AppLayout';
import { GameCatalog } from '../components/GameCatalog';
import { HealthStatus } from '../components/HealthStatus';

export function HomePage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [games, setGames] = useState<GameCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadShellData() {
      try {
        setIsLoading(true);
        setError(null);
        const [healthResponse, gameCatalog] = await Promise.all([getHealth(), getGameCatalog()]);

        if (isMounted) {
          setHealth(healthResponse);
          setGames(gameCatalog);
        }
      } catch (unknownError) {
        if (isMounted) {
          setError(unknownError instanceof Error ? unknownError.message : '无法连接 Ludoria Worker');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadShellData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AppLayout>
      <main>
        <section className="hero">
          <div className="hero__content">
            <p className="eyebrow">Phase 1 runnable shell</p>
            <h1>温暖、克制、为桌游而生的在线大厅</h1>
            <p>
              Ludoria 现在可以本地启动前端与 Worker，并通过共享协议读取 health
              状态和 mock 游戏目录。完整房间、账号和游戏规则会留到后续阶段。
            </p>
            <div className="actions">
              <Button>查看游戏目录</Button>
              <Button variant="secondary">检查 Worker</Button>
            </div>
          </div>
          <HealthStatus health={health} isLoading={isLoading} error={error} />
        </section>

        <section className="section-heading" id="catalog">
          <p className="eyebrow">Game catalog</p>
          <h2>Mock 游戏列表</h2>
          <p>这些条目来自 Worker 的 `/api/games`，类型由 `packages/protocol` 共享。</p>
        </section>

        <GameCatalog games={games} isLoading={isLoading} error={error} />
      </main>
    </AppLayout>
  );
}
