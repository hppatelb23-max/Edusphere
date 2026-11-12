/**
 * Proctor Recording Storage using browser IndexedDB
 * Allows storing student webcam video recordings locally without quota limits of localStorage.
 * Only accessible by educators viewing submissions.
 */

const DB_NAME = "EdusphereProctorDB";
const STORE_NAME = "proctor_recordings";
const DB_VERSION = 1;

// In-memory fallback if IndexedDB is restricted
const memoryCache = new Map();

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      resolve(null);
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "recording_id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.warn("IndexedDB open error:", request.error);
      resolve(null);
    };
  });
};

/**
 * Save a video recording blob with metadata
 */
export const saveProctorRecording = async (recordingId, videoBlob, metadata = {}) => {
  if (!recordingId || !videoBlob) return null;

  const record = {
    recording_id: recordingId,
    blob: videoBlob,
    size: videoBlob.size,
    type: videoBlob.type || "video/webm",
    created_at: new Date().toISOString(),
    ...metadata
  };

  // Cache in memory for instant playback
  memoryCache.set(recordingId, record);

  try {
    const db = await openDB();
    if (!db) return record;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve(record);
      req.onerror = () => {
        console.warn("Failed to put recording in IndexedDB:", req.error);
        resolve(record);
      };
    });
  } catch (err) {
    console.warn("saveProctorRecording error:", err);
    return record;
  }
};

/**
 * Retrieve a recording record by ID
 */
export const getProctorRecording = async (recordingId) => {
  if (!recordingId) return null;

  // Check memory cache first
  if (memoryCache.has(recordingId)) {
    return memoryCache.get(recordingId);
  }

  try {
    const db = await openDB();
    if (!db) return null;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(recordingId);
      req.onsuccess = () => {
        if (req.result) {
          memoryCache.set(recordingId, req.result);
          resolve(req.result);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn("getProctorRecording error:", err);
    return null;
  }
};

/**
 * Delete a specific proctor recording
 */
export const deleteProctorRecording = async (recordingId) => {
  if (!recordingId) return true;
  memoryCache.delete(recordingId);
  try {
    const db = await openDB();
    if (!db) return true;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(recordingId);
      req.onsuccess = () => resolve(true);
      req.onerror = () => {
        console.warn("Failed to delete recording:", req.error);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn("deleteProctorRecording error:", err);
    return false;
  }
};

/**
 * Clear all proctor recordings from local storage/IndexedDB
 */
export const clearAllProctorRecordings = async () => {
  memoryCache.clear();
  try {
    const db = await openDB();
    if (!db) return true;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn("clearAllProctorRecordings error:", err);
    return false;
  }
};

