'use client';

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

let _token: string | null = null;

export function setDriveToken(token: string) {
  _token = token;
  setTimeout(() => { _token = null; }, 55 * 60 * 1000);
}

export function hasDriveToken(): boolean {
  return _token !== null;
}

function requestDriveToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (_token) { resolve(_token); return; }

    const g = (window as unknown as Record<string, unknown>).google as {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (r: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    } | undefined;

    if (!g) { reject(new Error('Google SDK 로드 안됨')); return; }

    const client = g.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: DRIVE_SCOPE,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error ?? '드라이브 권한 요청 실패'));
          return;
        }
        setDriveToken(resp.access_token);
        resolve(resp.access_token);
      },
    });

    client.requestAccessToken();
  });
}

async function getToken(): Promise<string> {
  if (_token) return _token;
  return requestDriveToken();
}

export async function uploadToGoogleDrive(file: File): Promise<string> {
  const token = await getToken();

  const metadata = new Blob(
    [JSON.stringify({ name: `teamdash_${Date.now()}_${file.name}`, mimeType: file.type })],
    { type: 'application/json' },
  );

  const form = new FormData();
  form.append('metadata', metadata);
  form.append('file', file);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`업로드 실패 (${res.status}): ${text}`);
  }

  const { id } = await res.json();

  await fetch(`https://www.googleapis.com/drive/v3/files/${id}/permissions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  });

  return `https://drive.google.com/uc?export=download&id=${id}`;
}
