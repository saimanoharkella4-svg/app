type MessageCallback = (data: any) => void;

export class AdminWebSocket {
  private ws: WebSocket | null = null;
  private url: string = 'ws://127.0.0.1:8000/api/ws/admin';
  private callbacks: Set<MessageCallback> = new Set();
  private isConnected: boolean = false;
  private reconnectTimer: any = null;

  connect(onStatusChange?: (connected: boolean) => void) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        if (onStatusChange) onStatusChange(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.callbacks.forEach((cb) => cb(parsed));
        } catch (e) {
          // ignore non-json
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        if (onStatusChange) onStatusChange(false);
        this.scheduleReconnect(onStatusChange);
      };

      this.ws.onerror = () => {
        this.isConnected = false;
        if (onStatusChange) onStatusChange(false);
      };
    } catch (e) {
      this.scheduleReconnect(onStatusChange);
    }
  }

  private scheduleReconnect(onStatusChange?: (connected: boolean) => void) {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect(onStatusChange);
    }, 4000);
  }

  subscribe(callback: MessageCallback) {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const adminWs = new AdminWebSocket();
