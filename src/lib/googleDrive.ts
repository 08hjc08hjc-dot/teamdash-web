declare const google: {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: { access_token?: string; error?: string }) => void;
      }) => { requestAccessToken: () => void };
    };
  };
};

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

let _token: string | null = null;

function requestDriveToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (_token) {
      resolve(_token);
      return;
    }

    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: DRIVE_SCOPE,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error ?? '드라이브 권한 요청 실패'));
          return;
        }
        _token = resp.access_token;
        setTimeout(() => { _token = null; }, 3500 * 1000);
        resolve(resp.access_token);
      },
    });

    client.requestAccessToken();
  });
}

export async function uploadToGoogleDrive(file: File): Promise<string> {
  const token = await requestDriveToken();

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

  if (!res.ok) throw new Error(`업로드 실패: ${res.status}`);
  const { id } = await res.json();

  // 누구나 링크로 접근 가능하게 설정
  await fetch(`https://www.googleapis.com/drive/v3/files/${id}/permissions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  });

  return `https://drive.google.com/uc?export=download&id=${id}`;
}
