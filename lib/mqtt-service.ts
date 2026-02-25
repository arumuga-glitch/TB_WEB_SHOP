
import mqtt, { MqttClient } from "mqtt";

export const MQTT_BROKER_WS_URL =
  process.env.NEXT_PUBLIC_MQTT_BROKER_WS_URL ||
  "wss://broker.hivemq.com:8884/mqtt";

const RECONNECT_PERIOD_MS = 3000;

let client: MqttClient | null = null;

const messageListeners = new Map<string, Set<(payload: unknown) => void>>();

export function getMqttClient(clientIdSuffix?: string): MqttClient {
  if (client) return client;

  client = mqtt.connect(MQTT_BROKER_WS_URL, {
    clientId: `shop_${clientIdSuffix ?? Math.random().toString(16).slice(2)}`,
    username: process.env.NEXT_PUBLIC_MQTT_USERNAME,
    password: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
    clean: true,
    reconnectPeriod: RECONNECT_PERIOD_MS,
    connectTimeout: 10_000,
  });

  client.on("connect", () => {
    if (process.env.NODE_ENV !== "production") {
      console.log("🟢 MQTT Connected successfully to", MQTT_BROKER_WS_URL);
    }
    messageListeners.forEach((_, topic) => {
      client?.subscribe(topic, { qos: 1 });
    });
  });

  client.on("reconnect", () => {
    if (process.env.NODE_ENV !== "production") {
      console.log("🟡 MQTT Reconnecting...");
    }
  });

  client.on("error", (err) => {
    console.error("🔴 MQTT Connection Error:", err);
  });

  client.on("offline", () => {
    if (process.env.NODE_ENV !== "production") {
      console.warn("🟠 MQTT Client is offline");
    }
  });

  client.on("message", (topic, message) => {
    const raw = message.toString();

    let payload: unknown = raw;
    try {
      payload = JSON.parse(raw);
    } catch {
    }

    const handlers = messageListeners.get(topic);
    if (handlers) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`📥 MQTT message on [${topic}]:`, payload);
      }
      handlers.forEach((fn) => fn(payload));
    }
  });

  return client;
}


export function subscribeToTopic(
  topic: string,
  handler: (payload: unknown) => void
): () => void {

  if (!messageListeners.has(topic)) {
    messageListeners.set(topic, new Set());
  }
  messageListeners.get(topic)!.add(handler);


  const c = getMqttClient();
  if (c.connected) {
    c.subscribe(topic, { qos: 1 });
  }

  return () => {
    const handlers = messageListeners.get(topic);
    if (handlers) {
      handlers.delete(handler);

      if (handlers.size === 0) {
        messageListeners.delete(topic);
        c.unsubscribe(topic);
      }
    }
  };
}


export function newRequestTopic(shopId: string): string {
  return `service/request/${shopId}`;
}

export function disconnectMqtt(): void {
  if (client) {
    client.end(true);
    client = null;
    messageListeners.clear();
  }
}
