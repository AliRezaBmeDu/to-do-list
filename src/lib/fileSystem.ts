/**
 * File System Access API utilities for persisting directory handles
 * in IndexedDB so users don't need to re-attach folders on every visit.
 *
 * Flow:
 *  1. User picks a folder → handle stored in IndexedDB keyed by taskId
 *  2. On page load, we try to retrieve the handle from IndexedDB
 *  3. We call handle.requestPermission() — user clicks "Allow" once per session
 *  4. If granted, we can read the directory without re-picking
 */

const DB_NAME = "TaskFlowFS";
const STORE_NAME = "dirHandles";
const DB_VERSION = 1;

// ─── IndexedDB helpers ────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a FileSystemDirectoryHandle in IndexedDB, keyed by taskId.
 */
export async function saveDirHandle(
  taskId: string,
  handle: FileSystemDirectoryHandle
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(handle, taskId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Retrieve a previously-saved FileSystemDirectoryHandle from IndexedDB.
 */
export async function getDirHandle(
  taskId: string
): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(taskId);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Remove a stored directory handle (e.g. when user detaches folder).
 */
export async function removeDirHandle(taskId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(taskId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Permission helpers ───────────────────────────────────────────────

/**
 * Check if we already have read permission on a handle.
 */
export async function checkReadPermission(
  handle: FileSystemDirectoryHandle
): Promise<PermissionState> {
  return handle.queryPermission({ mode: "read" });
}

/**
 * Request read permission on a handle (shows browser prompt).
 * Returns "granted" | "denied" | "prompt".
 */
export async function requestReadPermission(
  handle: FileSystemDirectoryHandle
): Promise<PermissionState> {
  return handle.requestPermission({ mode: "read" });
}

/**
 * Request read-write permission on a handle (shows browser prompt).
 * Required for file editing and new file creation.
 */
export async function requestReadWritePermission(
  handle: FileSystemDirectoryHandle
): Promise<PermissionState> {
  return handle.requestPermission({ mode: "readwrite" });
}

/**
 * Check if we already have read-write permission on a handle.
 */
export async function checkReadWritePermission(
  handle: FileSystemDirectoryHandle
): Promise<PermissionState> {
  return handle.queryPermission({ mode: "readwrite" });
}

/**
 * Try to restore a previously-saved directory handle.
 *  - If permission is already granted → returns handle
 *  - If permission is "prompt" → returns "needs-permission" so the UI can show a button
 *  - If permission is "denied" or handle not found → returns null
 */
export async function restoreDirHandle(
  taskId: string
): Promise<FileSystemDirectoryHandle | "needs-permission" | null> {
  try {
    const handle = await getDirHandle(taskId);
    if (!handle) return null;

    const perm = await checkReadPermission(handle);
    if (perm === "granted") return handle;
    if (perm === "prompt") return "needs-permission";

    return null; // denied
  } catch {
    return null;
  }
}

// ─── File read/write helpers ──────────────────────────────────────────

/**
 * Read a text file from a FileSystemFileHandle.
 */
export async function readFileText(
  handle: FileSystemFileHandle
): Promise<string> {
  const file = await handle.getFile();
  return file.text();
}

/**
 * Write text content to a file via FileSystemFileHandle.
 * Uses the File System Access API's createWritable() method.
 */
export async function writeFileText(
  handle: FileSystemFileHandle,
  content: string
): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

/**
 * Create a new file in a directory and write initial content.
 * Returns the FileSystemFileHandle for the new file.
 */
export async function createFileInDir(
  dirHandle: FileSystemDirectoryHandle,
  fileName: string,
  content: string = ""
): Promise<FileSystemFileHandle> {
  const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
  if (content) {
    await writeFileText(fileHandle, content);
  }
  return fileHandle;
}

/**
 * Create a new subdirectory in a directory.
 * Returns the FileSystemDirectoryHandle for the new directory.
 */
export async function createDirInDir(
  dirHandle: FileSystemDirectoryHandle,
  dirName: string
): Promise<FileSystemDirectoryHandle> {
  return dirHandle.getDirectoryHandle(dirName, { create: true });
}
