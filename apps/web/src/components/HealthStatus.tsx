import type { HealthResponse } from '@ludoria/protocol';
import { Badge, Card } from '@ludoria/ui';

export function HealthStatus({
  health,
  isLoading,
  error
}: {
  health: HealthResponse | null;
  isLoading: boolean;
  error: string | null;
}) {
  const statusText = health?.ok ? 'Worker online' : isLoading ? 'Checking worker' : 'Worker unavailable';

  return (
    <Card className="health-card" id="status">
      <div className="health-card__header">
        <span>Worker health</span>
        <Badge variant={health?.ok ? 'success' : error ? 'danger' : 'neutral'}>{statusText}</Badge>
      </div>
      <dl>
        <div>
          <dt>Service</dt>
          <dd>{health?.service ?? 'ludoria-worker'}</dd>
        </div>
        <div>
          <dt>Phase</dt>
          <dd>{health?.phase ?? 'phase-1'}</dd>
        </div>
      </dl>
      {error ? <p className="panel-note panel-note--error">{error}</p> : null}
    </Card>
  );
}
