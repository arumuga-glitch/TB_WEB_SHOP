class MQTTService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Function[]> = new Map();

  connect() {
    console.log("MQTT Service: Connected");
    
    setInterval(() => {
      this.notifySubscribers('dashboard-update', {
        type: 'request-update',
        data: { pending: Math.floor(Math.random() * 5) + 1 }
      });
    }, 15000);
  }

  subscribe(topic: string, callback: Function) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, []);
    }
    this.subscribers.get(topic)!.push(callback);
  }

  unsubscribe(topic: string, callback: Function) {
    if (this.subscribers.has(topic)) {
      const callbacks = this.subscribers.get(topic)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private notifySubscribers(topic: string, message: any) {
    if (this.subscribers.has(topic)) {
      this.subscribers.get(topic)!.forEach(callback => {
        callback(message);
      });
    }
  }

  disconnect() {
    this.ws?.close();
    this.subscribers.clear();
  }
}

export const mqttService = new MQTTService();