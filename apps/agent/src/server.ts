import http from "http";
import { text } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";

type SpectrumApp = Awaited<ReturnType<typeof import("./photon/app.js")["createApp"]>>;

export const PORT = 3001;

export function startHttpServer(app: SpectrumApp): http.Server {
  const im = imessage(app);

  const server = http.createServer(async (req, res) => {
    if (req.method !== "POST") {
      res.writeHead(405).end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    let body = "";
    for await (const chunk of req) body += chunk;

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(body);
    } catch {
      res.writeHead(400).end(JSON.stringify({ error: "Invalid JSON" }));
      return;
    }

    res.setHeader("Content-Type", "application/json");

    try {
      if (req.url === "/send") {
        const { to, message } = payload as { to: string; message: string };
        if (!to || !message) {
          res.writeHead(400).end(JSON.stringify({ error: "to and message are required" }));
          return;
        }
        const user = await im.user(to);
        const space = await im.space(user);
        await space.send(text(message));
        res.writeHead(200).end(JSON.stringify({ ok: true }));

      } else if (req.url === "/send-group") {
        const { participants, message } = payload as { participants: string[]; message: string };
        if (!participants?.length || !message) {
          res.writeHead(400).end(JSON.stringify({ error: "participants and message are required" }));
          return;
        }
        const users = await Promise.all(participants.map((p) => im.user(p)));
        const space = await im.space(...(users as [typeof users[0], ...typeof users]));
        await space.send(text(message));
        res.writeHead(200).end(JSON.stringify({ ok: true }));

      } else {
        res.writeHead(404).end(JSON.stringify({ error: "Not found" }));
      }
    } catch (err) {
      console.error("Send error:", err);
      res.writeHead(500).end(JSON.stringify({ error: String(err) }));
    }
  });

  server.listen(PORT, () => {
    console.log(`Agent HTTP server listening on port ${PORT}`);
  });

  return server;
}
