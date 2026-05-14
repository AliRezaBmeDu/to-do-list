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

// ─── Virtual Tree JSON helpers (.taskflow-tree.json) ─────────────────

export const TREE_JSON_FILE = ".taskflow-tree.json";

export interface TreeNode {
  id: string;       // filename without extension (e.g. "A" for "A.md")
  title: string;    // display title (usually same as id)
  parentId: string | null;
  order: number;
}

/**
 * Read the .taskflow-tree.json file from the attached folder.
 * Returns null if the file doesn't exist.
 */
export async function readTreeJson(
  dirHandle: FileSystemDirectoryHandle
): Promise<TreeNode[] | null> {
  try {
    const fileHandle = await dirHandle.getFileHandle(TREE_JSON_FILE);
    const file = await fileHandle.getFile();
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    return null;
  } catch {
    return null;
  }
}

/**
 * Write the tree JSON back to the .taskflow-tree.json file in the folder.
 */
export async function writeTreeJson(
  dirHandle: FileSystemDirectoryHandle,
  nodes: TreeNode[]
): Promise<void> {
  const fileHandle = await dirHandle.getFileHandle(TREE_JSON_FILE, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(nodes, null, 2));
  await writable.close();
}

/**
 * Generate a default flat tree from the physical files in the directory.
 * All nodes get parentId: null and are ordered alphabetically.
 * Only includes files (not subdirectories), skips hidden files except .taskflow-tree.json.
 */
export async function generateDefaultTree(
  dirHandle: FileSystemDirectoryHandle
): Promise<TreeNode[]> {
  const entries: string[] = [];
  for await (const [name, handle] of (dirHandle as any).entries()) {
    if (name === TREE_JSON_FILE) continue; // skip the tree file itself
    if (name.startsWith(".")) continue;    // skip other hidden files
    if (handle.kind === "file") {
      // Store id as filename without extension
      const id = name.includes(".") ? name.substring(0, name.lastIndexOf(".")) : name;
      entries.push(id);
    }
  }
  entries.sort((a, b) => a.localeCompare(b));
  return entries.map((id, index) => ({
    id,
    title: id,
    parentId: null,
    order: index,
  }));
}

/**
 * Build a lookup map of physical files in the directory.
 * Key = id (filename without extension), Value = FileSystemFileHandle
 */
export async function buildFileHandleMap(
  dirHandle: FileSystemDirectoryHandle
): Promise<Map<string, FileSystemFileHandle>> {
  const map = new Map<string, FileSystemFileHandle>();
  for await (const [name, handle] of (dirHandle as any).entries()) {
    if (name === TREE_JSON_FILE) continue;
    if (name.startsWith(".")) continue;
    if (handle.kind === "file") {
      const id = name.includes(".") ? name.substring(0, name.lastIndexOf(".")) : name;
      map.set(id, handle);
    }
  }
  return map;
}

/**
 * Get the full filename for a node id by finding the matching file in the directory.
 * Returns the first file that matches the id (with any extension).
 */
export function findFileNameForId(fileMap: Map<string, string>, id: string): string | null {
  return fileMap.get(id) || null;
}

/**
 * Sync tree nodes with physical files:
 * - Add nodes for files that don't have one
 * - Remove nodes for files that no longer exist
 * - Preserve existing hierarchy
 */
export async function syncTreeWithFiles(
  dirHandle: FileSystemDirectoryHandle,
  existingNodes: TreeNode[]
): Promise<{ nodes: TreeNode[]; fileMap: Map<string, FileSystemFileHandle> }> {
  const fileHandles = await buildFileHandleMap(dirHandle);
  const existingIds = new Set(existingNodes.map((n) => n.id));

  // Build a map of id -> full filename for display
  // (fileHandles already has the correct ids)

  // Find new files that need nodes
  const newNodes: TreeNode[] = [];
  let maxOrder = existingNodes.reduce((max, n) => (n.parentId === null ? Math.max(max, n.order) : max), -1);

  for (const [id] of fileHandles) {
    if (!existingIds.has(id)) {
      maxOrder++;
      newNodes.push({
        id,
        title: id,
        parentId: null,
        order: maxOrder,
      });
    }
  }

  // Remove nodes for files that no longer exist
  // Also remove children of deleted nodes (cascade)
  const validIds = new Set(fileHandles.keys());
  const deletedIds = new Set(existingIds);

  // Find all ids that should be removed (not in validIds)
  for (const id of validIds) {
    deletedIds.delete(id);
  }

  // Also cascade: if a parent is deleted, its children become root-level
  const survivingNodes = existingNodes.filter((n) => validIds.has(n.id));
  const survivingIds = new Set(survivingNodes.map((n) => n.id));

  // Re-parent orphaned children to root
  const reParented = survivingNodes.map((n) => {
    if (n.parentId && !survivingIds.has(n.parentId)) {
      return { ...n, parentId: null };
    }
    return n;
  });

  return {
    nodes: [...reParented, ...newNodes],
    fileMap: fileHandles,
  };
}
