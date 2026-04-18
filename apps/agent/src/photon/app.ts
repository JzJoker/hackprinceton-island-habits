// Stub for Photon iMessage SDK integration
// This would connect to Photon AI's iMessage API to send and receive messages

interface PhotonMessage {
  id: string;
  text: string;
  from: string;
  groupId?: string;
  timestamp: number;
  groupMembers?: string[];
}

interface PhotonApp {
  sendMessage(groupId: string, text: string): Promise<void>;
  on(event: string, handler: (msg: PhotonMessage) => Promise<void>): void;
  close(): Promise<void>;
}

export async function createApp(): Promise<PhotonApp> {
  // TODO: Initialize Photon SDK with API key
  // For now, return a stub that logs messages

  const handlers: { [key: string]: (msg: PhotonMessage) => Promise<void> } = {};

  const app: PhotonApp = {
    async sendMessage(groupId: string, text: string) {
      console.log(`[PHOTON] Sending to ${groupId}: ${text}`);
      // TODO: Call Photon API to send message
    },

    on(event: string, handler: (msg: PhotonMessage) => Promise<void>) {
      handlers[event] = handler;
    },

    async close() {
      console.log("[PHOTON] Connection closed");
    },
  };

  return app;
}

export type { PhotonMessage, PhotonApp };
