import { Spectrum } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";
import "dotenv/config";

export async function createApp() {
  const projectId = process.env.projid;
  const projectSecret = process.env.secret;

  if (!projectId || !projectSecret) {
    throw new Error("Missing projid or secret in environment (see apps/agent/.env.example)");
  }

  return Spectrum({
    projectId,
    projectSecret,
    providers: [imessage.config()],
  });
}

export type PhotonApp = Awaited<ReturnType<typeof createApp>>;
