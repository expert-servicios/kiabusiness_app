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

export interface DriveFileSummary {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  size: string | null;
  createdTime: string | null;
}

export async function listDriveFilesForClient(
  clientName: string,
  serviceName?: string
): Promise<DriveFileSummary[]> {
  const rootFolderId = process.env.GOOGLE_DRIVE_CLIENTS_FOLDER_ID;
  const drive = await getDriveClient();
  if (!drive || !rootFolderId) return [];

  try {
    const safeName = (n: string) => n.replace(/['"\\]/g, '_').slice(0, 100);

    // Find client folder
    const clientRes = await drive.files.list({
      q: `name='${safeName(clientName)}' and mimeType='application/vnd.google-apps.folder' and '${rootFolderId}' in parents and trashed=false`,
      fields: 'files(id)',
      spaces: 'drive',
      pageSize: 1,
    });
    const clientFolderId: string | undefined = clientRes.data.files?.[0]?.id;
    if (!clientFolderId) return [];

    let searchParentId = clientFolderId;

    // Optionally drill into service subfolder
    if (serviceName) {
      const svcRes = await drive.files.list({
        q: `name='${safeName(serviceName)}' and mimeType='application/vnd.google-apps.folder' and '${clientFolderId}' in parents and trashed=false`,
        fields: 'files(id)',
        spaces: 'drive',
        pageSize: 1,
      });
      const svcFolderId: string | undefined = svcRes.data.files?.[0]?.id;
      if (svcFolderId) searchParentId = svcFolderId;
    }

    // List files
    const filesRes = await drive.files.list({
      q: `'${searchParentId}' in parents and trashed=false and mimeType != 'application/vnd.google-apps.folder'`,
      fields: 'files(id,name,mimeType,webViewLink,size,createdTime)',
      orderBy: 'createdTime desc',
      pageSize: 50,
      spaces: 'drive',
    });

    return (filesRes.data.files ?? []) as DriveFileSummary[];
  } catch (err) {
    console.error('[Drive] listDriveFilesForClient error:', err);
    return [];
  }
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
