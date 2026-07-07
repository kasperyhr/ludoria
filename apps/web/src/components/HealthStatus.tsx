import type { HealthResponse } from '@ludoria/protocol';
import { Badge, Card } from '@ludoria/ui';

export function HealthStatus({
  health,
  isLoading,
  error,
}: {
  health: HealthResponse | null;
  isLoading: boolean;
  error: string | null;
}) {
  return (
    <Card className="health-card">
      <div className="health-card__header">
        <Badge variant={health ? 'success' : 'neutral'}>Worker</Badge>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
          {isLoading ? '检测中...' : error ? '离线' : '在线'}
        </span>
      </div>
      <dl>
        <div>
          <dt>服务状态</dt>
          <dd>{health ? (health.ok ? '\u2705 正常' : '\u274C 异常') : isLoading ? '\u23F3 加载中' : '\u26A0\uFE0F 未连接'}</dd>
        </div>
        <div>
          <dt>Worker</dt>
          <dd>{health?.service ?? '—'}</dd>
        </div>
        <div>
          <dt>Phase</dt>
          <dd>{health?.phase ?? '—'}</dd>
        </div>
      </dl>
    </Card>
  );
}
