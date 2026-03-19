'use client';

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

let _token: string | null = null;
let _cancelled = false;
let _currentXhr: XMLHttpRequest | null = null;

export function setDriveToken(token: string) {
  _token = token;
  setTimeout(() => { _token = null; }, 55 * 60 * 1000);
}

export function cancelUpload() {
  _cancelled = true;
  if (_currentXhr) {
    _currentXhr.abort();
    _currentXhr = null;
  }
}

function requestDriveToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (_token) { resolve(_token); return; }
    if (_cancelled) { reject(new Error('cancelled')); return; }

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
        if (_cancelled) { reject(new Error('cancelled')); return; }
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

export async function uploadToGoogleDrive(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  _cancelled = false;

  const token = await requestDriveToken();
  if (_cancelled) throw new Error('cancelled');

  const metadata = new Blob(
    [JSON.stringify({ name: `teamdash_${Date.now()}_${file.name}`, mimeType: file.type })],
    { type: 'application/json' },
  );

  const form = new FormData();
  form.append('metadata', metadata);
  form.append('file', file);

  const id = await new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    _currentXhr = xhr;
    xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      _currentXhr = null;
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText).id);
      } else {
        reject(new Error(`업로드 실패 (${xhr.status}): ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => { _currentXhr = null; reject(new Error('네트워크 오류')); };
    xhr.onabort = () => { _currentXhr = null; reject(new Error('cancelled')); };
    xhr.send(form);
  });

  if (_cancelled) throw new Error('cancelled');

  await fetch(`https://www.googleapis.com/drive/v3/files/${id}/permissions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  });

  return `https://drive.google.com/uc?export=download&id=${id}`;
}
