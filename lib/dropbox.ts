import "server-only";
import { Dropbox } from "dropbox";

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

let client: Dropbox | null = null;

function getClient(): Dropbox {
  if (client) return client;

  const clientId = process.env.DROPBOX_APP_KEY;
  const clientSecret = process.env.DROPBOX_APP_SECRET;
  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Dropbox אינו מוגדר: יש להגדיר DROPBOX_APP_KEY, DROPBOX_APP_SECRET, DROPBOX_REFRESH_TOKEN",
    );
  }

  client = new Dropbox({ clientId, clientSecret, refreshToken, fetch });
  return client;
}

/**
 * Uploads a receipt/reference-document copy to Dropbox (decision #6 — a
 * mandatory third backup destination for every receipt, alongside the
 * structured expenses row and the rich accountant archive). No-ops in demo
 * mode: the integration layer is mocked so demo runs never make a real
 * Dropbox API call.
 */
export async function uploadToDropbox(folderPath: string, fileName: string, content: Buffer): Promise<string> {
  const dropboxPath = `/${folderPath}/${fileName}`;

  if (isDemo) {
    return dropboxPath;
  }

  const dbx = getClient();
  await dbx.filesUpload({
    path: dropboxPath,
    contents: content,
    mode: { ".tag": "overwrite" },
    autorename: true,
    mute: true,
  });

  return dropboxPath;
}
