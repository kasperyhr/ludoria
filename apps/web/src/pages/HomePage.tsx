import { useEffect, useState } from 'react';
import type { GameCatalogItem, HealthResponse } from '@ludoria/protocol';
import { Button, Card } from '@ludoria/ui';
import { getGameCatalog, getHealth } from '../api/client';
import { AppLayout } from '../components/AppLayout';
import { GameCatalog } from '../components/GameCatalog';
import { HealthStatus } from '../components/HealthStatus';

const features = [
  {
    icon: '\u{1F9E9}',
    title: '多人隐藏信息',
    desc: '服务器权威状态，每位玩家只看到自己的手牌和 token，观战者看不到任何隐藏信息。',
  },
  {
    icon: '\u{1F9E0}',
    title: '单人益智引擎',
    desc: '数独、数织等 puzzle 游戏，题目生成、进度保存、提示系统、完成检查一体化。',
  },
  {
    icon: '\u2601\uFE0F',
    title: 'Cloudflare Edge',
    desc: '基于 Workers、Durable Objects 和 D1 的全球边缘运行时，低延迟、自动扩展。',
  },
];

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
    return () => { isMounted = false; };
  }, []);

  return (
    <AppLayout>
      <main>
        <section className="hero">
          <div className="hero__content">
            <p className="eyebrow">Cloudflare Game Hub</p>
            <h1>温暖、克制、为桌游而生</h1>
            <p>
              Ludoria 是一个运行在 Cloudflare 全球边缘网络上的在线桌游大厅。
              支持多人隐藏信息桌游和单人益智 puzzle，服务器权威规则，安全视角投影。
            </p>
            <div className="actions">
              <Button onClick={() => document.querySelector('#catalog')?.scrollIntoView({ behavior: 'smooth' })}>
                浏览游戏目录
              </Button>
              <Button variant="secondary" onClick={() => { void getHealth().then(setHealth); }}>
                检查 Worker 状态
              </Button>
            </div>
          </div>
          <HealthStatus health={health} isLoading={isLoading} error={error} />
        </section>

        <section className="feature-strip">
          {features.map((f) => (
            <Card key={f.title} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </Card>
          ))}
        </section>

        <section className="section-heading" id="catalog">
          <p className="eyebrow">Game Catalog</p>
          <h2>已接入与规划中的游戏</h2>
          <p>数据来源：Worker /api/games，类型由 packages/protocol 共享。</p>
        </section>

        <GameCatalog games={games} isLoading={isLoading} error={error} />
      </main>
    </AppLayout>
  );
}
