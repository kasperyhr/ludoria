import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  ChatMessage,
  DeclareTokenCountCommandPayload,
  ServerToClientMessage,
  SessionRole,
  TokenBluffingView,
  TokenColor,
} from '@ludoria/protocol';
import { Badge, Button, Card } from '@ludoria/ui';
import { createSession, joinSession } from '../api/client';
import { AppLayout } from '../components/AppLayout';

const tokenOptions: TokenColor[] = ['red', 'blue', 'gold'];
const tokenLabel: Record<TokenColor, string> = { red: 'Red', blue: 'Blue', gold: 'Gold' };
const workerWebSocketOrigin = import.meta.env.VITE_LUDORIA_WORKER_WS_URL ?? 'ws://127.0.0.1:8787';

interface IdleCheckPrompt {
  message: string;
  expiresAt: string;
}

function toWebSocketUrl(url: string) {
  if (url.startsWith('/')) {
    return `${workerWebSocketOrigin}${url.replace(/^\/worker-api/, '')}`;
  }
  return url.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
}

function formatEventMessage(event: ServerToClientMessage): string | null {
  if (event.type === 'PUBLIC_EVENT') {
    const e = event.event;
    if (e.type === 'PLAYER_JOINED') return `${e.payload.displayName} 加入了房间`;
    if (e.type === 'TOKEN_COUNT_DECLARED') return `${e.payload.displayName} 声明了 ${e.payload.declaredCount} 个 ${e.payload.declaredToken} token`;
  }
  if (event.type === 'ROOM_STATUS_CHANGED') return `房间状态变为 ${event.status}`;
  return null;
}

export function TokenBluffingDemoPage() {
  const socketRef = useRef<WebSocket | null>(null);
  const [sessionId, setSessionId] = useState(sessionStorage.getItem('ludoria.demo.sessionId') ?? '');
  const [sessionToken, setSessionToken] = useState(sessionStorage.getItem('ludoria.demo.sessionToken') ?? '');
  const [displayName, setDisplayName] = useState('Player');
  const [role, setRole] = useState<SessionRole>('player');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [view, setView] = useState<TokenBluffingView | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenColor>('red');
  const [declaredCount, setDeclaredCount] = useState(1);
  const [chatText, setChatText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [idleCheckPrompt, setIdleCheckPrompt] = useState<IdleCheckPrompt | null>(null);
  const [logEntries, setLogEntries] = useState<Array<{ text: string; type: string; time: string }>>([]);

  const selfTokens = useMemo(() => {
    if (view?.viewer !== 'player') return [];
    return view.self.hiddenTokens;
  }, [view]);

  useEffect(() => () => socketRef.current?.close(), []);

  function addLog(text: string, type = 'info') {
    setLogEntries((prev) => [...prev.slice(-49), { text, type, time: new Date().toLocaleTimeString() }]);
  }

  function connectWebSocket(websocketUrl: string) {
    socketRef.current?.close();
    const socket = new WebSocket(toWebSocketUrl(websocketUrl));
    socketRef.current = socket;
    setConnectionStatus('connecting');

    socket.addEventListener('open', () => { setConnectionStatus('connected'); addLog('已连接'); });
    socket.addEventListener('close', () => { setConnectionStatus('disconnected'); addLog('连接已断开'); });
    socket.addEventListener('error', () => {
      setConnectionStatus('error');
      setError('WebSocket 连接失败');
    });
    socket.addEventListener('message', (messageEvent) => {
      const message = JSON.parse(String(messageEvent.data)) as ServerToClientMessage;

      if (message.type === 'SESSION_SNAPSHOT') {
        setView(message.view);
        setRole(message.role);
      } else if (message.type === 'PLAYER_VIEW_UPDATE' || message.type === 'SPECTATOR_VIEW_UPDATE') {
        setView(message.view);
      } else if (message.type === 'PUBLIC_EVENT') {
        const text = formatEventMessage(message);
        if (text) addLog(text, message.event.type);
      } else if (message.type === 'CHAT_MESSAGE') {
        setChatMessages((current) => [...current, message.message]);
      } else if (message.type === 'IDLE_CHECK') {
        setIdleCheckPrompt({ message: message.message, expiresAt: message.expiresAt });
      } else if (message.type === 'ROOM_STATUS_CHANGED') {
        addLog(`房间: ${message.status}`, 'status');
      } else if (message.type === 'ERROR') {
        setError(message.message);
        addLog(`错误: ${message.message}`, 'error');
      }
    });
  }

  async function handleCreateSession() {
    setError(null);
    const response = await createSession();
    setSessionId(response.sessionId);
    sessionStorage.setItem('ludoria.demo.sessionId', response.sessionId);
    addLog('Session 已创建');
  }

  async function handleJoin(nextRole: SessionRole) {
    if (!sessionId.trim()) { setError('请先创建或输入 sessionId'); return; }
    setError(null);
    const response = await joinSession(sessionId.trim(), { displayName: displayName.trim() || nextRole, role: nextRole });
    setRole(response.role);
    setSessionToken(response.sessionToken);
    sessionStorage.setItem('ludoria.demo.sessionId', response.sessionId);
    sessionStorage.setItem('ludoria.demo.sessionToken', response.sessionToken);
    connectWebSocket(response.websocketUrl);
  }

  function handleReconnect() {
    if (!sessionId || !sessionToken) { setError('缺少 sessionId 或 token'); return; }
    connectWebSocket(`/worker-api/api/sessions/${sessionId}/connect?token=${encodeURIComponent(sessionToken)}`);
  }

  function sendCommand() {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) { setError('WebSocket 尚未连接'); return; }
    socket.send(JSON.stringify({
      type: 'SUBMIT_COMMAND',
      commandId: crypto.randomUUID(),
      command: { type: 'DECLARE_TOKEN_COUNT', payload: { token: selectedToken, count: declaredCount } },
    }));
  }

  function sendChat() {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || !chatText.trim()) return;
    socket.send(JSON.stringify({ type: 'CHAT_MESSAGE', text: chatText }));
    setChatText('');
  }

  function sendKeepAlive() {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) { setError('WebSocket 尚未连接'); return; }
    socket.send(JSON.stringify({ type: 'KEEP_ALIVE' }));
    setIdleCheckPrompt(null);
  }

  return (
    <AppLayout>
      <main className="demo-shell">
        <section className="section-heading">
          <p className="eyebrow">Token Bluffing Demo</p>
          <h1>多人隐藏信息架构验证</h1>
          <p>创建 session，用多个浏览器窗口加入玩家或观战者，验证不同身份收到不同安全视角。</p>
        </section>

        <div className="demo-grid">
          {/* Session Controls */}
          <Card className="control-panel">
            <h2>Session</h2>
            <label>Session ID <input value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="创建后自动填入" /></label>
            <label>昵称 <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></label>
            <div className="actions" style={{ marginTop: 8 }}>
              <Button onClick={handleCreateSession}>创建 session</Button>
              <Button onClick={() => { void handleJoin('player'); }}>作为玩家加入</Button>
              <Button variant="secondary" onClick={() => { void handleJoin('spectator'); }}>作为观战者加入</Button>
              <Button variant="ghost" onClick={handleReconnect}>断线重连</Button>
            </div>
            <p style={{ marginTop: 16, fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              <span className={`connection-dot`} data-status={connectionStatus} />
              {connectionStatus} &middot; 身份: <Badge>{role}</Badge>
            </p>
            {idleCheckPrompt && (
              <div className="idle-prompt">
                <p>{idleCheckPrompt.message} (有效期至 {new Date(idleCheckPrompt.expiresAt).toLocaleTimeString()})</p>
                <Button variant="secondary" onClick={sendKeepAlive}>继续房间</Button>
              </div>
            )}
            {error && <p className="panel-note panel-note--error" style={{ marginTop: 12 }}>{error}</p>}
          </Card>

          {/* Hidden Tokens */}
          <Card className="control-panel">
            <h2>{view?.viewer === 'player' ? '你的隐藏 token' : '观战视角'}</h2>
            {view?.viewer === 'player' ? (
              <div className="token-row">
                {selfTokens.map((token, i) => (
                  <span key={`${token}-${i}`} className="token-chip" data-token={token}>{tokenLabel[token]}</span>
                ))}
              </div>
            ) : (
              <p className="panel-note" style={{ margin: 0, fontSize: '0.88rem' }}>
                观战者不会收到任何玩家的隐藏 token 种类，仅能看到数量。
              </p>
            )}
          </Card>

          {/* Players */}
          <Card className="control-panel">
            <h2>玩家列表</h2>
            <div className="player-list">
              {view?.players.map((p) => (
                <div key={p.id} className="player-row">
                  <span className="player-name">{p.displayName}</span>
                  <span className="player-meta">{p.tokenCount} tokens {p.connected ? '' : '(离线)'}</span>
                </div>
              )) ?? <p className="panel-note" style={{ margin: 0 }}>加入 session 后显示玩家</p>}
            </div>
          </Card>

          {/* Command */}
          <Card className="control-panel">
            <h2>提交声明</h2>
            <label>Token <select value={selectedToken} onChange={(e) => setSelectedToken(e.target.value as TokenColor)}>
              {tokenOptions.map((t) => <option key={t} value={t}>{tokenLabel[t]}</option>)}
            </select></label>
            <label>数量 <input type="number" min={0} max={9} value={declaredCount} onChange={(e) => setDeclaredCount(Number(e.target.value))} /></label>
            <Button onClick={sendCommand} style={{ marginTop: 8 }}>DECLARE_TOKEN_COUNT</Button>
          </Card>

          {/* Event Log */}
          <Card className="control-panel">
            <h2>游戏日志</h2>
            <div className="event-log">
              {logEntries.length === 0 && <p className="panel-note" style={{ margin: 0 }}>等待事件...</p>}
              {logEntries.map((entry, i) => (
                <div key={i} className="event-entry" data-type={entry.type}>
                  <span className="event-entry__time">{entry.time}</span>
                  <span>{entry.text}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Chat */}
          <Card className="control-panel">
            <h2>公共聊天</h2>
            <div className="chat-log">
              {chatMessages.map((m) => (
                <div key={m.id} className="chat-message"><strong>{m.displayName}</strong>: {m.text}</div>
              ))}
            </div>
            <div className="chat-input-row">
              <input value={chatText} onChange={(e) => setChatText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendChat(); }} placeholder="输入消息..." />
              <Button variant="secondary" onClick={sendChat}>发送</Button>
            </div>
          </Card>
        </div>
      </main>
    </AppLayout>
  );
}
