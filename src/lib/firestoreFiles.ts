import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'teamdash-files';
const CHUNK_SIZE = 800 * 1024; // ~800KB per chunk (fits in 1MB document)

function generateFileId(): string {
  return `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadFileToFirestore(file: File): Promise<string> {
  const fileId = generateFileId();
  const base64 = await fileToBase64(file);

  const chunks: string[] = [];
  for (let i = 0; i < base64.length; i += CHUNK_SIZE) {
    chunks.push(base64.slice(i, i + CHUNK_SIZE));
  }

  await Promise.all(
    chunks.map((chunk, i) =>
      setDoc(doc(db, COLLECTION, `${fileId}_${i}`), {
        fileId,
        idx: i,
        total: chunks.length,
        data: chunk,
        name: file.name,
        ts: Date.now(),
      }),
    ),
  );

  return `fs://${fileId}`;
}

export async function downloadFileFromFirestore(fsUrl: string): Promise<string> {
  const fileId = fsUrl.replace('fs://', '');

  const firstSnap = await getDoc(doc(db, COLLECTION, `${fileId}_0`));
  if (!firstSnap.exists()) throw new Error('File not found');

  const { total, data: firstData } = firstSnap.data();
  if (total === 1) return firstData;

  const remaining = await Promise.all(
    Array.from({ length: total - 1 }, (_, i) =>
      getDoc(doc(db, COLLECTION, `${fileId}_${i + 1}`)),
    ),
  );

  return firstData + remaining.map((s) => s.data()?.data ?? '').join('');
}
