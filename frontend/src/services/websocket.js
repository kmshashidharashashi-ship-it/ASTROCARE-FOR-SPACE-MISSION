/**
 * ASTRACARE – Robust WebSocket Client with Reconnect Guarding and Error Containment.
 * Prevents duplicate sockets in React StrictMode, handles offline gracefully,
 * and eliminates ECONNRESET / ECONNREFUSED terminal proxy spam.
 */

class WebSocketClient {
  constructor() {
    this.telemetryWs = null;
    this.alertsWs = null;
    this.telemetryListeners = new Set();
    this.alertListeners = new Set();
    this.statusListeners = new Set();
    this.reconnectTimer = null;
    this.retryCount = 0;
    this.isExplicitlyClosed = false;
    this.isConnected = false;
  }

  connect() {
    this.isExplicitlyClosed = false;

    // Check if sockets are already connected or in connecting state
    const isTelemetryActive =
      this.telemetryWs &&
      (this.telemetryWs.readyState === WebSocket.OPEN ||
        this.telemetryWs.readyState === WebSocket.CONNECTING);

    const isAlertsActive =
      this.alertsWs &&
      (this.alertsWs.readyState === WebSocket.OPEN ||
        this.alertsWs.readyState === WebSocket.CONNECTING);

    if (isTelemetryActive && isAlertsActive) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;

    // ── Connect Telemetry Socket ─────────────────────────────────────────────
    if (!isTelemetryActive) {
      try {
        this.telemetryWs = new WebSocket(`${protocol}//${host}/ws/telemetry`);

        this.telemetryWs.onopen = () => {
          this.retryCount = 0;
          this.isConnected = true;
          this.notifyStatus(true);
        };

        this.telemetryWs.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.telemetryListeners.forEach((cb) => {
              try {
                cb(data);
              } catch (e) {
                console.error('[Telemetry listener error]:', e);
              }
            });
          } catch (e) {
            // Heartbeat ping/pong string
          }
        };

        this.telemetryWs.onclose = () => {
          this.isConnected = false;
          this.notifyStatus(false);
          if (!this.isExplicitlyClosed) {
            this.scheduleReconnect();
          }
        };

        this.telemetryWs.onerror = () => {
          // Do NOT call this.telemetryWs?.close() here!
          // Browser fires onclose automatically after onerror.
          // Calling close() here forcibly aborts TCP stream causing ECONNRESET in Vite proxy.
        };
      } catch (err) {
        this.scheduleReconnect();
      }
    }

    // ── Connect Alerts Socket ────────────────────────────────────────────────
    if (!isAlertsActive) {
      try {
        this.alertsWs = new WebSocket(`${protocol}//${host}/ws/alerts`);

        this.alertsWs.onopen = () => {
          this.isConnected = true;
          this.notifyStatus(true);
        };

        this.alertsWs.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.alertListeners.forEach((cb) => {
              try {
                cb(data);
              } catch (e) {
                console.error('[Alert listener error]:', e);
              }
            });
          } catch (e) {}
        };

        this.alertsWs.onclose = () => {
          if (!this.isExplicitlyClosed) {
            this.scheduleReconnect();
          }
        };

        this.alertsWs.onerror = () => {
          // Allow standard onclose to handle reconnection without abrupt TCP reset
        };
      } catch (err) {
        this.scheduleReconnect();
      }
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer || this.isExplicitlyClosed) return;

    // Exponential backoff with ceiling: 4s -> 8s -> 12s -> max 16s
    const delay = Math.min(4000 + this.retryCount * 2000, 16000);
    this.retryCount += 1;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  disconnect() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.telemetryWs) {
      try {
        this.telemetryWs.close(1000, 'Client unmounted');
      } catch (e) {}
      this.telemetryWs = null;
    }
    if (this.alertsWs) {
      try {
        this.alertsWs.close(1000, 'Client unmounted');
      } catch (e) {}
      this.alertsWs = null;
    }
    this.isConnected = false;
    this.notifyStatus(false);
  }

  subscribeTelemetry(callback) {
    this.telemetryListeners.add(callback);
    return () => this.telemetryListeners.delete(callback);
  }

  subscribeAlerts(callback) {
    this.alertListeners.add(callback);
    return () => this.alertListeners.delete(callback);
  }

  subscribeStatus(callback) {
    this.statusListeners.add(callback);
    callback(this.isConnected);
    return () => this.statusListeners.delete(callback);
  }

  notifyStatus(connected) {
    this.statusListeners.forEach((cb) => {
      try {
        cb(connected);
      } catch (e) {}
    });
  }
}

export const wsClient = new WebSocketClient();
