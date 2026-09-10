export type MotusUpload = {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
  createdAt: string;
};
const DB_NAME = 'motus-uploads';
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore('uploads', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function transaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('uploads', mode);
    const request = operation(tx.objectStore('uploads'));
    tx.oncomplete = () => {
      db.close();
      resolve(request.result);
    };
    tx.onerror = tx.onabort = () => {
      db.close();
      reject(tx.error ?? request.error);
    };
  });
}
export async function listUploads() {
  const uploads = (await transaction('readonly', (store) =>
    store.getAll(),
  )) as MotusUpload[];
  return uploads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function saveUpload(input: Omit<MotusUpload, 'id' | 'createdAt'>) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(input.src),
  );
  const id = [...new Uint8Array(digest)]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('');
  const upload = { ...input, id, createdAt: new Date().toISOString() };
  await transaction('readwrite', (store) => store.put(upload));
  return upload;
}
export async function removeUpload(id: string) {
  await transaction('readwrite', (store) => store.delete(id));
}
