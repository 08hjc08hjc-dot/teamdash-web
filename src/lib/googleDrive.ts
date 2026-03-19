'use client';

let _token: string | null = null;
let _currentXhr: XMLHttpRequest | null = null;
let _abortCtrl: AbortController | null = null;

export function setDriveToken(token: string) {
  _token = token;
  setTimeout(() => { _token = null; }, 55 * 60 * 1000);
}

export function hasDriveToken(): boolean {
  return _token !== null;
}

export function clearDriveToken() {
  _token = null;
}

export function cancelUpload() {
  if (_currentXhr) {
    _currentXhr.abort();
    _currentXhr = null;
  }
  if (_abortCtrl) {
    _abortCtrl.abort();
    _abortCtrl = null;
  }
}

export async function uploadToGoogleDrive(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  if (!_token) throw new Error('드라이브 권한이 필요합니다. 다시 시도해주세요.');

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
    xhr.setRequestHeader('Authorization', `Bearer ${_token}`);

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

  _abortCtrl = new AbortController();
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${id}/permissions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
      signal: _abortCtrl.signal,
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new Error('cancelled');
    throw e;
  } finally {
    _abortCtrl = null;
  }

  return `https://drive.google.com/uc?export=download&id=${id}`;
}
