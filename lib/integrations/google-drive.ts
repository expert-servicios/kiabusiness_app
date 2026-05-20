import { Readable } from 'stream';

function getDriveAuth() {
  const email = process.env.GOOGLE_DRIVE_SA_EMAIL;
  const rawKey = process.env.GOOGLE_DRIVE_SA_PRIVATE_KEY;
  if (!email || !rawKey) return null;
  const privateKey = rawKey.replace(/\\n/g, '\n');
  return { email, key: privateKey, scopes: ['https://www.googleapis.com/auth/drive'] };
}

async function getDriveClient() {
  const creds = getDriveAuth();
  if (!creds) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { google } = (await import('googleapis')) as any;
  const auth = new google.auth.JWT(creds);
  return google.drive({ version: 'v3', auth });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findOrCreateFolder(drive: any, name: string, parentId: string): Promise<string> {
  const safeName = name.replace(/['"\\]/g, '_').slice(0, 100);
  const res = await drive.files.list({
    q: `name='${safeName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
    pageSize: 1,
  });
  if (res.data.files?.length) return res.data.files[0].id as string;

  const folder = await drive.files.create({
    requestBody: { name: safeName, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
    fields: 'id',
  });
  return folder.data.id as string;
}

export interface DriveSyncResult {
  fileId: string;
  webViewLink: string;
}

export async function syncDocumentToDrive({
  fileBuffer,
  fileName,
  mimeType,
  clientName,
  serviceName,
}: {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  clientName: string;
  serviceName: string;
}): Promise<DriveSyncResult | null> {
  const rootFolderId = process.env.GOOGLE_DRIVE_CLIENTS_FOLDER_ID;
  if (!rootFolderId) {
    console.warn('[Drive] GOOGLE_DRIVE_CLIENTS_FOLDER_ID not set — skipping sync');
    return null;
  }

  const drive = await getDriveClient();
  if (!drive) {
    console.warn('[Drive] credentials not configured — skipping sync');
    return null;
  }

  const clientFolderId = await findOrCreateFolder(drive, clientName, rootFolderId);
  const serviceFolderId = await findOrCreateFolder(drive, serviceName, clientFolderId);

  const stream = Readable.from(fileBuffer);
  const file = await drive.files.create({
    requestBody: { name: fileName, parents: [serviceFolderId] },
    media: { mimeType, body: stream },
    fields: 'id,webViewLink',
  });

  return {
    fileId: file.data.id as string,
    webViewLink: file.data.webViewLink as string,
  };
}
