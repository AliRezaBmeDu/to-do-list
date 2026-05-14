/**
 * fileSystem.ts — Utilities for local folder access, IndexedDB persistence,
 * and .taskflow-tree.json virtual tree hierarchy management.
 *
 * Tree JSON schema: { version: 1, nodes: TreeNode[] }
 * TreeNode: { id: string, title: string, parentId: string | null, order: number, isFolder?: boolean }
 */

/* ═══════════════════════════════════════════
   Types
   ═══════════════════════════════════════════ */

export interface TreeNode {
  id: string;
  title: string;
  parentId: string | null;
  order: number;
  isFolder?: boolean;
}

export interface TreeJson {
  version: number;
  nodes: TreeNode[];
}

/* ═══════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════ */

const TREE_JSON_FILENAME = ".taskflow-tree.json";
const DB_NAME = "taskflow-fs";
const DB_VERSION = 1;
const HANDLE_STORE = "dirHandles";

/* ═══════════════════════════════════════════
   IndexedDB — Directory Handle Persistence
   ═══════════════════════════════════════════ */

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(HANDLE_STORE)) {
        db.createObjectStore(HANDLE_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDirectoryHandle(taskId: string, handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, "readwrite");
    tx.objectStore(HANDLE_STORE).put(handle, taskId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadDirectoryHandle(taskId: string): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, "readonly");
    const req = tx.objectStore(HANDLE_STORE).get(taskId);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function removeDirectoryHandle(taskId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, "readwrite");
    tx.objectStore(HANDLE_STORE).delete(taskId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ═══════════════════════════════════════════
   Permission Helpers
   ═══════════════════════════════════════════ */

export async function requestPermission(
  handle: FileSystemDirectoryHandle,
  mode: "read" | "readwrite" = "read"
): Promise<boolean> {
  if ((handle as any).requestPermission) {
    const perm = await (handle as any).requestPermission({ mode });
    return perm === "granted";
  }
  return false;
}

export async function checkPermission(
  handle: FileSystemDirectoryHandle,
  mode: "read" | "readwrite" = "read"
): Promise<boolean> {
  if ((handle as any).queryPermission) {
    const perm = await (handle as any).queryPermission({ mode });
    return perm === "granted";
  }
  return false;
}

/* ═══════════════════════════════════════════
   File Read / Write Helpers
   ═══════════════════════════════════════════ */

export async function readFileText(
  dirHandle: FileSystemDirectoryHandle,
  filePath: string
): Promise<string | null> {
  try {
    const parts = filePath.split("/").filter(Boolean);
    let current: FileSystemDirectoryHandle = dirHandle;
    for (let i = 0; i < parts.length - 1; i++) {
      current = await current.getDirectoryHandle(parts[i]);
    }
    const fileHandle = await current.getFileHandle(parts[parts.length - 1]);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch {
    return null;
  }
}

export async function writeFileText(
  dirHandle: FileSystemDirectoryHandle,
  filePath: string,
  content: string
): Promise<boolean> {
  try {
    const parts = filePath.split("/").filter(Boolean);
    let current: FileSystemDirectoryHandle = dirHandle;
    for (let i = 0; i < parts.length - 1; i++) {
      current = await current.getDirectoryHandle(parts[i], { create: true });
    }
    const fileHandle = await current.getFileHandle(parts[parts.length - 1], { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    return true;
  } catch {
    return false;
  }
}

export async function createNewFile(
  dirHandle: FileSystemDirectoryHandle,
  name: string,
  content: string = ""
): Promise<boolean> {
  try {
    const fileHandle = await dirHandle.getFileHandle(name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    return true;
  } catch {
    return false;
  }
}

export async function createNewFolder(
  dirHandle: FileSystemDirectoryHandle,
  name: string
): Promise<boolean> {
  try {
    await dirHandle.getDirectoryHandle(name, { create: true });
    return true;
  } catch {
    return false;
  }
}

/* ═══════════════════════════════════════════
   .taskflow-tree.json — Read / Write / Generate
   ═══════════════════════════════════════════ */

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

/**
 * Read the .taskflow-tree.json from the attached folder.
 * Returns null if the file doesn't exist or is invalid.
 */
export async function readTreeJson(
  dirHandle: FileSystemDirectoryHandle
): Promise<TreeJson | null> {
  const text = await readFileText(dirHandle, TREE_JSON_FILENAME);
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    if (parsed && parsed.version === 1 && Array.isArray(parsed.nodes)) {
      return parsed as TreeJson;
    }
  } catch {
    // invalid JSON
  }
  return null;
}

/**
 * Write the tree JSON back to .taskflow-tree.json in the attached folder.
 */
export async function writeTreeJson(
  dirHandle: FileSystemDirectoryHandle,
  tree: TreeJson
): Promise<boolean> {
  const json = JSON.stringify(tree, null, 2);
  return writeFileText(dirHandle, TREE_JSON_FILENAME, json);
}

/**
 * Scan the directory and generate a default flat tree JSON.
 * Each file/subdirectory gets a TreeNode with parentId: null (root level),
 * sorted alphabetically (dirs first, then files).
 * Subdirectory children are also scanned one level deep.
 */
export async function generateDefaultTree(
  dirHandle: FileSystemDirectoryHandle
): Promise<TreeJson> {
  const nodes: TreeNode[] = [];
  let order = 0;

  const scanDir = async (
    handle: FileSystemDirectoryHandle,
    parentId: string | null
  ): Promise<void> => {
    const entries: { name: string; kind: "file" | "directory"; handle: any }[] = [];

    for await (const [name, h] of (handle as any).entries()) {
      // Skip .taskflow-tree.json itself and node_modules
      if (name === ".taskflow-tree.json") continue;
      if (name === "node_modules") continue;
      entries.push({ name, kind: h.kind, handle: h });
    }

    // Sort: directories first, then files, alphabetically
    entries.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of entries) {
      const id = generateId();
      nodes.push({
        id,
        title: entry.name,
        parentId,
        order: order++,
        isFolder: entry.kind === "directory",
      });

      if (entry.kind === "directory") {
        await scanDir(entry.handle, id);
      }
    }
  };

  await scanDir(dirHandle, null);

  return { version: 1, nodes };
}

/**
 * Ensure tree JSON exists — read it, or generate + write it if missing.
 * Also syncs with physical files: adds new files, removes deleted ones.
 */
export async function ensureTreeJson(
  dirHandle: FileSystemDirectoryHandle
): Promise<TreeJson> {
  const existing = await readTreeJson(dirHandle);
  if (existing) {
    // Sync: scan current physical files and update tree
    return syncTreeWithDisk(dirHandle, existing);
  }
  const generated = await generateDefaultTree(dirHandle);
  await writeTreeJson(dirHandle, generated);
  return generated;
}

/**
 * Sync the tree JSON with what's actually on disk.
 * - Adds new files/folders that aren't in the tree yet
 * - Removes tree nodes whose physical files no longer exist
 * - Preserves user-made hierarchy (parent-child) and order
 */
async function syncTreeWithDisk(
  dirHandle: FileSystemDirectoryHandle,
  tree: TreeJson
): Promise<TreeJson> {
  // Collect all physical file/folder names recursively
  const physicalNames = new Set<string>();

  const collectNames = async (handle: FileSystemDirectoryHandle, prefix: string = "") => {
    for await (const [name, h] of (handle as any).entries()) {
      if (name === ".taskflow-tree.json" || name === "node_modules") continue;
      const fullPath = prefix ? `${prefix}/${name}` : name;
      physicalNames.add(fullPath);
      if (h.kind === "directory") {
        const subDir = await handle.getDirectoryHandle(name);
        await collectNames(subDir, fullPath);
      }
    }
  };

  await collectNames(dirHandle);

  // Build a path map from tree nodes (we need to reconstruct paths)
  // For simplicity, we'll check by title at each level
  // Remove nodes whose files no longer exist (by title matching at root level)
  const beforeCount = tree.nodes.length;
  tree.nodes = tree.nodes.filter((node) => {
    // Root nodes — check directly
    if (node.parentId === null) {
      return physicalNames.has(node.title);
    }
    return true; // Keep child nodes for now (complex path resolution)
  });

  // Add new physical files that aren't in the tree
  const existingTitles = new Set(tree.nodes.filter(n => n.parentId === null).map(n => n.title));
  let maxOrder = tree.nodes.reduce((max, n) => Math.max(max, n.order), 0);

  for (const path of physicalNames) {
    const name = path.split("/")[0]; // root-level name only
    if (!existingTitles.has(name)) {
      const isDir = path.includes("/") || tree.nodes.some(n => n.isFolder && n.title === name);
      tree.nodes.push({
        id: generateId(),
        title: name,
        parentId: null,
        order: ++maxOrder,
        isFolder: isDir,
      });
      existingTitles.add(name);
    }
  }

  if (tree.nodes.length !== beforeCount) {
    await writeTreeJson(dirHandle, tree);
  }

  return tree;
}

/**
 * Move a node: update its parentId and order. Writes JSON to disk.
 */
export async function moveTreeNode(
  dirHandle: FileSystemDirectoryHandle,
  tree: TreeJson,
  nodeId: string,
  newParentId: string | null,
  newOrder: number
): Promise<TreeJson> {
  const node = tree.nodes.find((n) => n.id === nodeId);
  if (!node) return tree;

  node.parentId = newParentId;
  node.order = newOrder;

  // Re-order siblings
  const siblings = tree.nodes
    .filter((n) => n.parentId === newParentId && n.id !== nodeId)
    .sort((a, b) => a.order - b.order);

  // Insert at newOrder position
  siblings.splice(newOrder, 0, node);
  siblings.forEach((s, i) => {
    s.order = i;
  });

  await writeTreeJson(dirHandle, tree);
  return tree;
}

/**
 * Unchild a node — move it to root level (parentId: null) with given order.
 */
export async function unchildTreeNode(
  dirHandle: FileSystemDirectoryHandle,
  tree: TreeJson,
  nodeId: string
): Promise<TreeJson> {
  const node = tree.nodes.find((n) => n.id === nodeId);
  if (!node || node.parentId === null) return tree;

  // Also unchild all descendants to root
  const descendantIds = new Set<string>();
  const collectDescendants = (parentId: string) => {
    tree.nodes.filter(n => n.parentId === parentId).forEach(child => {
      descendantIds.add(child.id);
      collectDescendants(child.id);
    });
  };
  collectDescendants(nodeId);

  // Move node to root
  const maxRootOrder = tree.nodes
    .filter(n => n.parentId === null)
    .reduce((max, n) => Math.max(max, n.order), 0);

  node.parentId = null;
  node.order = maxRootOrder + 1;

  // Move descendants to root as well
  let nextOrder = node.order + 1;
  descendantIds.forEach(dId => {
    const desc = tree.nodes.find(n => n.id === dId);
    if (desc) {
      desc.parentId = null;
      desc.order = nextOrder++;
    }
  });

  await writeTreeJson(dirHandle, tree);
  return tree;
}

/**
 * Unchild only this node — set parentId to null but keep children attached.
 * Unlike unchildTreeNode, descendants remain as children of this node.
 */
export async function unchildOnlySelf(
  dirHandle: FileSystemDirectoryHandle,
  tree: TreeJson,
  nodeId: string
): Promise<TreeJson> {
  const node = tree.nodes.find((n) => n.id === nodeId);
  if (!node || node.parentId === null) return tree;

  const maxRootOrder = tree.nodes
    .filter(n => n.parentId === null)
    .reduce((max, n) => Math.max(max, n.order), 0);

  node.parentId = null;
  node.order = maxRootOrder + 1;

  await writeTreeJson(dirHandle, tree);
  return tree;
}

/**
 * Rename a node's title.
 */
export async function renameTreeNode(
  dirHandle: FileSystemDirectoryHandle,
  tree: TreeJson,
  nodeId: string,
  newTitle: string
): Promise<TreeJson> {
  const node = tree.nodes.find((n) => n.id === nodeId);
  if (!node) return tree;
  node.title = newTitle;
  await writeTreeJson(dirHandle, tree);
  return tree;
}

/**
 * Add a new node to the tree.
 */
export async function addTreeNode(
  dirHandle: FileSystemDirectoryHandle,
  tree: TreeJson,
  title: string,
  parentId: string | null,
  isFolder: boolean = false
): Promise<{ tree: TreeJson; newNode: TreeNode }> {
  const siblings = tree.nodes.filter(n => n.parentId === parentId);
  const maxOrder = siblings.reduce((max, n) => Math.max(max, n.order), -1);

  const newNode: TreeNode = {
    id: generateId(),
    title,
    parentId,
    order: maxOrder + 1,
    isFolder,
  };

  tree.nodes.push(newNode);
  await writeTreeJson(dirHandle, tree);
  return { tree, newNode };
}

/**
 * Delete a node and all its descendants from the tree.
 */
export async function deleteTreeNode(
  dirHandle: FileSystemDirectoryHandle,
  tree: TreeJson,
  nodeId: string
): Promise<TreeJson> {
  const toDelete = new Set<string>();
  const collectIds = (id: string) => {
    toDelete.add(id);
    tree.nodes.filter(n => n.parentId === id).forEach(child => collectIds(child.id));
  };
  collectIds(nodeId);

  tree.nodes = tree.nodes.filter(n => !toDelete.has(n.id));

  // Re-order remaining siblings
  const parentOfDeleted = tree.nodes.find(n => n.id === nodeId)?.parentId;
  if (parentOfDeleted !== undefined) {
    const siblings = tree.nodes
      .filter(n => n.parentId === parentOfDeleted)
      .sort((a, b) => a.order - b.order);
    siblings.forEach((s, i) => { s.order = i; });
  }

  await writeTreeJson(dirHandle, tree);
  return tree;
}

/* ═══════════════════════════════════════════
   Utility: Get children of a node
   ═══════════════════════════════════════════ */

export function getChildren(nodes: TreeNode[], parentId: string | null): TreeNode[] {
  return nodes
    .filter(n => n.parentId === parentId)
    .sort((a, b) => a.order - b.order);
}

export function getDescendantIds(nodes: TreeNode[], parentId: string): string[] {
  const ids: string[] = [];
  const collect = (pid: string) => {
    nodes.filter(n => n.parentId === pid).forEach(child => {
      ids.push(child.id);
      collect(child.id);
    });
  };
  collect(parentId);
  return ids;
}
