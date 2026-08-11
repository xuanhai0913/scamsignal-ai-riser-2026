import {parseRescueCase} from '@scamsignal/core/rescue-case';
import type {RescueCase, RescueEvidence} from '@scamsignal/core/rescue-case';

const DATABASE_NAME = 'scamsignal-rescue';
const DATABASE_VERSION = 1;
const CASE_STORE = 'case';
const EVIDENCE_STORE = 'evidence';
const ACTIVE_CASE_KEY = 'active-case';

const allowedEvidenceTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'text/plain',
]);

type StoredEvidence = RescueEvidence & {blob: Blob};

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Không thể đọc dữ liệu trên thiết bị.'));
  });
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Không thể lưu dữ liệu trên thiết bị.'));
    transaction.onabort = () => reject(transaction.error || new Error('Thao tác lưu đã bị hủy.'));
  });
}

function openDatabase() {
  if (!globalThis.indexedDB) return Promise.reject(new Error('Trình duyệt không hỗ trợ lưu hồ sơ cục bộ.'));
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(CASE_STORE)) database.createObjectStore(CASE_STORE);
      if (!database.objectStoreNames.contains(EVIDENCE_STORE)) database.createObjectStore(EVIDENCE_STORE, {keyPath: 'id'});
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Không thể mở kho hồ sơ cục bộ.'));
  });
}

export async function loadLocalRescueCase() {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(CASE_STORE, 'readonly');
    const value = await requestResult(transaction.objectStore(CASE_STORE).get(ACTIVE_CASE_KEY));
    return parseRescueCase(value) || null;
  } finally {
    database.close();
  }
}

export async function saveLocalRescueCase(rescueCase: RescueCase) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(CASE_STORE, 'readwrite');
    transaction.objectStore(CASE_STORE).put(rescueCase, ACTIVE_CASE_KEY);
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}

export async function addLocalEvidence(files: File[]): Promise<RescueEvidence[]> {
  const invalid = files.find((file) => !allowedEvidenceTypes.has(file.type) || file.size > 8 * 1024 * 1024);
  if (invalid) throw new Error(`Tệp “${invalid.name}” không đúng định dạng hoặc vượt quá 8 MB.`);

  const now = new Date().toISOString();
  const stored = files.map<StoredEvidence>((file) => ({
    id: globalThis.crypto?.randomUUID?.() || `file-${Date.now()}-${file.name}`,
    name: file.name.slice(0, 160),
    type: file.type,
    size: file.size,
    addedAt: now,
    blob: file,
  }));
  const database = await openDatabase();
  try {
    const transaction = database.transaction(EVIDENCE_STORE, 'readwrite');
    const store = transaction.objectStore(EVIDENCE_STORE);
    stored.forEach((item) => store.put(item));
    await transactionDone(transaction);
  } finally {
    database.close();
  }
  return stored.map(({blob: _blob, ...metadata}) => metadata);
}

export async function removeLocalEvidence(id: string) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(EVIDENCE_STORE, 'readwrite');
    transaction.objectStore(EVIDENCE_STORE).delete(id);
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}

export async function clearLocalRescueCase() {
  const database = await openDatabase();
  try {
    const transaction = database.transaction([CASE_STORE, EVIDENCE_STORE], 'readwrite');
    transaction.objectStore(CASE_STORE).clear();
    transaction.objectStore(EVIDENCE_STORE).clear();
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}
