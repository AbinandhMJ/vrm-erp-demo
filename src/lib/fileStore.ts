// Uploaded files (learning materials) are kept in the browser's IndexedDB, which holds large
// files that would not fit in localStorage. Metadata lives in the app state as usual.
const DB_NAME = 'vrm_erp_files';
const STORE = 'files';

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const run = async <T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
};

export const saveFile = async (id: string, blob: Blob): Promise<void> => {
  await run('readwrite', s => s.put(blob, id));
};
export const getFile = (id: string): Promise<Blob | undefined> => run<Blob | undefined>('readonly', s => s.get(id) as IDBRequest<Blob | undefined>);
export const deleteFile = async (id: string): Promise<void> => {
  await run('readwrite', s => s.delete(id));
};
export const clearFiles = async (): Promise<void> => {
  try {
    await run('readwrite', s => s.clear());
  } catch {
    /* IndexedDB unavailable */
  }
};

export const formatBytes = (n: number): string =>
  n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / (1024 * 1024)).toFixed(1)} MB`;

/** Opens a stored file in a new tab (PDFs, images) or downloads it. */
export const openStoredFile = async (id: string, fileName: string, download = false): Promise<boolean> => {
  const blob = await getFile(id);
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  if (download) {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } else window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
};
