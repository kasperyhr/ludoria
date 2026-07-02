import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  ChatMessage,
  DeclareTokenCountCommandPayload,
  ServerToClientMessage,
  SessionRole,
  TokenBluffingView,
  TokenColor
} from '@ludoria/protocol';
import { Badge, Button, Card } from '@ludoria/ui';
import { createSession, joinSession } from '../api/client';
import { AppLayout } from '../components/AppLayout';

const tokenOptions: TokenColor[] = ['red', 'blue', 'gold'];
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

export function TokenBluffingDemoPage() {
  const socketRef = useRef<WebSocket | null>(null);
  const [sessionId, setSessionId] = useState(sessionStorage.getItem('ludoria.demo.sessionId') ?? '');
  const [sessionToken, setSessionToken] = useState(sessionStorage.getItem('ludoria.demo.sessionToken') ?? '');
  const [displayName, setDisplayName] = useState('Player');
  const [role, setRole] = useState<SessionRole>('player');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [view, setView] = useState<TokenBluffingView | null>(null);
  const [events, setEvents] = useState<ServerToClientMessage[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenColor>('red');
  const [declaredCount, setDeclaredCount] = useState(1);
  const [chatText, setChatText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [idleCheckPrompt, setIdleCheckPrompt] = useState<IdleCheckPrompt | null>(null);

  const selfTokens = useMemo(() => {
    if (view?.viewer !== 'player') {
      return [];
    }

    return view.self.hiddenTokens;
  }, [view]);

  useEffect(() => () => socketRef.current?.close(), []);

  function connectWebSocket(websocketUrl: string) {
    socketRef.current?.close();
    const socket = new WebSocket(toWebSocketUrl(websocketUrl));
    socketRef.current = socket;
    setConnectionStatus('connecting');

    socket.addEventListener('open', () => setConnectionStatus('connected'));
    socket.addEventListener('close', () => setConnectionStatus('disconnected'));
    socket.addEventListener('error', () => {
      setConnectionStatus('error');
      setError('WebSocket connection failed.');
    });
    socket.addEventListener('message', (messageEvent) => {
      const message = JSON.parse(String(messageEvent.data)) as ServerToClientMessage;

      if (message.type === 'SESSION_SNAPSHOT') {
        setView(message.view);
        setRole(message.role);
        setEvents((current) => [...current, message]);
      } else if (message.type === 'PLAYER_VIEW_UPDATE' || message.type === 'SPECTATOR_VIEW_UPDATE') {
        setView(message.view);
      } else if (message.type === 'PUBLIC_EVENT') {
        setEvents((current) => [...current, message]);
      } else if (message.type === 'CHAT_MESSAGE') {
        setChatMessages((current) => [...current, message.message]);
      } else if (message.type === 'IDLE_CHECK') {
        setIdleCheckPrompt({
          message: message.message,
          expiresAt: message.expiresAt
        });
      } else if (message.type === 'ROOM_STATUS_CHANGED') {
        setEvents((current) => [...current, message]);
      } else if (message.type === 'ERROR') {
        setError(message.message);
      }
    });
  }

  async function handleCreateSession() {
    setError(null);
    const response = await createSession();
    setSessionId(response.sessionId);
    sessionStorage.setItem('ludoria.demo.sessionId', response.sessionId);
  }

  async function handleJoin(nextRole: SessionRole) {
    if (!sessionId.trim()) {
      setError('请先创建或输入 sessionId。');
      return;
    }

    setError(null);
    const response = await joinSession(sessionId.trim(), {
      displayName: displayName.trim() || nextRole,
      role: nextRole
    });
    setRole(response.role);
    setSessionToken(response.sessionToken);
    sessionStorage.setItem('ludoria.demo.sessionId', response.sessionId);
    sessionStorage.setItem('ludoria.demo.sessionToken', response.sessionToken);
    connectWebSocket(response.websocketUrl);
  }

  function handleReconnect() {
    if (!sessionId || !sessionToken) {
      setError('缺少 sessionId 或 session token，无法重连。');
      return;
    }

    connectWebSocket(`/worker-api/api/sessions/${sessionId}/connect?token=${encodeURIComponent(sessionToken)}`);
  }

  function sendCommand() {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setError('WebSocket 尚未连接。');
      return;
    }

    const payload: DeclareTokenCountCommandPayload = {
      token: selectedToken,
      count: declaredCount
    };

    socket.send(JSON.stringify({
      type: 'SUBMIT_COMMAND',
      commandId: crypto.randomUUID(),
      command: {
        type: 'DECLARE_TOKEN_COUNT',
        payload
      }
    }));
  }

  function sendChat() {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN || !chatText.trim()) {
      return;
    }

    socket.send(JSON.stringify({
      type: 'CHAT_MESSAGE',
      text: chatText
    }));
    setChatText('');
  }

  function sendKeepAlive() {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setError('WebSocket 尚未连接。');
      return;
    }

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
          <Card className="control-panel">
            <h2>Session</h2>
            <label>
              Session ID
              <input value={sessionId} onChange={(event) => setSessionId(event.target.value)} placeholder="创建后自动填入" />
            </label>
            <label>
              昵称
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            </label>
            <div className="actions">
              <Button onClick={handleCreateSession}>创建 session</Button>
              <Button onClick={() => { void handleJoin('player'); }}>作为玩家加入</Button>
              <Button variant="secondary" onClick={() => { void handleJoin('spectator'); }}>作为观战者加入</Button>
              <Button variant="secondary" onClick={handleReconnect}>断线重连</Button>
            </div>
            <p className="panel-note">连接状态：<Badge>{connectionStatus}</Badge> 当前身份：<Badge>{role}</Badge></p>
            {idleCheckPrompt ? (
              <div className="panel-note">
                <p>{idleCheckPrompt.message}</p>
                <p>有效期至：{new Date(idleCheckPrompt.expiresAt).toLocaleString()}</p>
                <Button variant="secondary" onClick={sendKeepAlive}>继续房间</Button>
              </div>
            ) : null}
            {error ? <p className="panel-note panel-note--error">{error}</p> : null}
          </Card>

          <Card className="control-panel">
            <h2>你的隐藏 token</h2>
            {view?.viewer === 'player' ? (
              <div className="token-row">
                {selfTokens.map((token, index) => <Badge key={`${token}-${index}`}>{token}</Badge>)}
              </div>
            ) : (
              <p className="panel-note">观战者不会收到任何隐藏 token 种类。</p>
            )}
          </Card>

          <Card className="control-panel">
            <h2>玩家列表</h2>
            <div className="player-list">
              {view?.players.map((player) => (
                <div key={player.id} className="player-row">
                  <span>{player.displayName}</span>
                  <span>{player.tokenCount} tokens</span>
                </div>
              )) ?? <p className="panel-note">加入 session 后显示玩家。</p>}
            </div>
          </Card>

          <Card className="control-panel">
            <h2>提交 command</h2>
            <label>
              Token
              <select value={selectedToken} onChange={(event) => setSelectedToken(event.target.value as TokenColor)}>
                {tokenOptions.map((token) => <option key={token} value={token}>{token}</option>)}
              </select>
            </label>
            <label>
              Count
              <input type="number" min="0" max="9" value={declaredCount} onChange={(event) => setDeclaredCount(Number(event.target.value))} />
            </label>
            <Button onClick={sendCommand}>DECLARE_TOKEN_COUNT</Button>
          </Card>

          <Card className="control-panel">
            <h2>公共事件</h2>
            <div className="event-log">
              {events.slice(-8).map((event, index) => (
                <pre key={index}>{JSON.stringify(event, null, 2)}</pre>
              ))}
            </div>
          </Card>

          <Card className="control-panel">
            <h2>公共聊天</h2>
            <div className="chat-log">
              {chatMessages.map((message) => (
                <p key={message.id}><strong>{message.displayName}</strong>: {message.text}</p>
              ))}
            </div>
            <label>
              Message
              <input value={chatText} onChange={(event) => setChatText(event.target.value)} />
            </label>
            <Button onClick={sendChat}>发送聊天</Button>
          </Card>
        </div>
      </main>
    </AppLayout>
  );
}
