import { getOrCreateWsClientKey } from './storage';

const CHATBOT_WS_PATH = '/api/openans-support-chatbot/v1/robot/wss/messages';
type MessageEnvelope = {
  topic: string;
  data: unknown;
};

type Subscriber = (payload: MessageEnvelope) => void;
type StatusListener = (status: WebSocket['readyState'] | 'error') => void;

export function buildWebSocketUrl(): string {
  const clientKey = encodeURIComponent(getOrCreateWsClientKey());

  if (typeof window === 'undefined') {
    return `ws://127.0.0.1:7788${CHATBOT_WS_PATH}?lang=zh&websocket-client-key=${clientKey}`;
  }

  const isDevServer = window.location.port === '5174' || window.location.port === '5175';
  const protocol = isDevServer
    ? 'ws:'
    : window.location.protocol === 'https:'
      ? 'wss:'
      : 'ws:';
  const host = isDevServer ? '127.0.0.1:7788' : window.location.host;
  const browserLang = (navigator.language || 'zh-CN').split('-')[0].toLowerCase();

  return `${protocol}//${host}${CHATBOT_WS_PATH}?lang=${browserLang}&websocket-client-key=${clientKey}`;
}

export class CosightWebSocketClient {
  private socket: WebSocket | null = null;
  private topics = new Set<string>();
  private subscribers = new Map<string, Set<Subscriber>>();
  private statusListeners = new Set<StatusListener>();

  connect(): WebSocket {
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED && this.socket.readyState !== WebSocket.CLOSING) {
      return this.socket;
    }

    this.socket = new WebSocket(buildWebSocketUrl());
    this.socket.onopen = () => {
      this.emitStatus(WebSocket.OPEN);
      this.topics.forEach((topic) => this.sendSubscribe(topic));
    };
    this.socket.onclose = () => {
      this.emitStatus(WebSocket.CLOSED);
    };
    this.socket.onerror = () => {
      this.emitStatus('error');
    };
    this.socket.onmessage = (event) => {
      const parsed = JSON.parse(event.data) as MessageEnvelope;
      if (!parsed?.topic) {
        return;
      }
      this.subscribers.get(parsed.topic)?.forEach((listener) => listener(parsed));
    };
    return this.socket;
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
  }

  subscribe(topic: string, callback: Subscriber): () => void {
    this.connect();
    this.topics.add(topic);
    const current = this.subscribers.get(topic) ?? new Set<Subscriber>();
    current.add(callback);
    this.subscribers.set(topic, current);

    if (this.instance?.readyState === WebSocket.OPEN) {
      this.sendSubscribe(topic);
    }

    return () => {
      const existing = this.subscribers.get(topic);
      if (!existing) {
        return;
      }
      existing.delete(callback);
      if (existing.size === 0) {
        this.subscribers.delete(topic);
        this.topics.delete(topic);
      }
    };
  }

  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    if (this.socket) {
      listener(this.socket.readyState);
    }
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  sendMessage(topic: string, message: unknown): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    this.socket.send(
      JSON.stringify({
        action: 'message',
        topic,
        data: JSON.stringify(message),
        lang: (navigator.language || 'zh-CN').split('-')[0].toLowerCase(),
      }),
    );
    return true;
  }

  get instance(): WebSocket | null {
    return this.socket;
  }

  private sendSubscribe(topic: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(
      JSON.stringify({
        action: 'subscribe',
        topic,
      }),
    );
  }

  private emitStatus(status: WebSocket['readyState'] | 'error'): void {
    this.statusListeners.forEach((listener) => listener(status));
  }
}
