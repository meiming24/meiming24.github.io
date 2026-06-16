const DB_NAME = 'homepage-tamagotchi-v3';
const STORE_NAME = 'states';
const STATE_KEY = 'cpu';

const SLOT_COUNT = 3;

function slotKey(index) {
  return `save-slot-${index}`;
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
  });
}

export async function saveTamagotchiState(state) {
  const db = await openDatabase();

  await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(state, STATE_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB write failed'));
  });

  db.close();
}

export async function loadTamagotchiState() {
  const db = await openDatabase();

  const state = await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(STATE_KEY);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed'));
  });

  db.close();
  return state;
}

export async function saveToSlot(slotIndex, state) {
  const db = await openDatabase();

  await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put({ state, savedAt: Date.now() }, slotKey(slotIndex));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB write failed'));
  });

  db.close();
}

export async function loadFromSlot(slotIndex) {
  const db = await openDatabase();

  const record = await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(slotKey(slotIndex));
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed'));
  });

  db.close();
  return record; // { state, savedAt } | null
}

export async function getSlotsInfo() {
  const db = await openDatabase();

  const records = await Promise.all(
    Array.from({ length: SLOT_COUNT }, (_, i) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(slotKey(i + 1));
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error ?? new Error('IndexedDB read failed'));
      }),
    ),
  );

  db.close();

  return records.map((record, i) => ({
    index: i + 1,
    hasData: record != null,
    savedAt: record?.savedAt ?? null,
  }));
}

export async function clearTamagotchiState() {
  const db = await openDatabase();

  await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(STATE_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB delete failed'));
  });

  db.close();
}
