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
 * Rename a physical file or folder on disk.
 * The File System Access API has no native rename, so we:
 * 1. Read the old file's content (or enumerate folder entries)
 * 2. Create a new file/folder with the new name
 * 3. Write the content to the new file
 * 4. Delete the old entry
 */
export async function renamePhysicalFile(
  dirHandle: FileSystemDirectoryHandle,
  oldName: string,
  newName: string
): Promise<boolean> {
  try {
    // Skip if names are the same
    if (oldName === newName) return true;

    // Check if old entry exists
    let isDirectory = false;
    try {
      await dirHandle.getDirectoryHandle(oldName);
      isDirectory = true;
    } catch {
      // Not a directory, try as file
    }

    if (isDirectory) {
      // For a directory: create new dir, copy all entries, then remove old
      const newDirHandle = await dirHandle.getDirectoryHandle(newName, { create: true });
      const oldDirHandle = await dirHandle.getDirectoryHandle(oldName);

      // Copy all entries from old to new directory
      for await (const [name, entry] of (oldDirHandle as any).entries()) {
        if (entry.kind === "file") {
          const oldFileHandle = await oldDirHandle.getFileHandle(name);
          const file = await oldFileHandle.getFile();
          const content = await file.text();
          const newFileHandle = await newDirHandle.getFileHandle(name, { create: true });
          const writable = await newFileHandle.createWritable();
          await writable.write(content);
          await writable.close();
        } else if (entry.kind === "directory") {
          // Recursively copy subdirectories
          await copyDirectoryRecursive(oldDirHandle, newDirHandle, name);
        }
      }

      // Remove old directory
      await dirHandle.removeEntry(oldName, { recursive: true });
    } else {
      // For a file: read content, create new, write, delete old
      const oldFileHandle = await dirHandle.getFileHandle(oldName);
      const file = await oldFileHandle.getFile();
      const content = await file.text();

      const newFileHandle = await dirHandle.getFileHandle(newName, { create: true });
      const writable = await newFileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      // Delete the old file
      await dirHandle.removeEntry(oldName);
    }

    return true;
  } catch (err) {
    console.error("renamePhysicalFile error:", err);
    return false;
  }
}

/**
 * Helper: recursively copy a subdirectory from one parent to another.
 */
async function copyDirectoryRecursive(
  srcParent: FileSystemDirectoryHandle,
  destParent: FileSystemDirectoryHandle,
  dirName: string
): Promise<void> {
  const srcDir = await srcParent.getDirectoryHandle(dirName);
  const destDir = await destParent.getDirectoryHandle(dirName, { create: true });

  for await (const [name, entry] of (srcDir as any).entries()) {
    if (entry.kind === "file") {
      const fileHandle = await srcDir.getFileHandle(name);
      const file = await fileHandle.getFile();
      const content = await file.text();
      const newHandle = await destDir.getFileHandle(name, { create: true });
      const writable = await newHandle.createWritable();
      await writable.write(content);
      await writable.close();
    } else if (entry.kind === "directory") {
      await copyDirectoryRecursive(srcDir, destDir, name);
    }
  }
}

/**
 * Delete a physical file or folder from disk.
 */
export async function deletePhysicalFile(
  dirHandle: FileSystemDirectoryHandle,
  name: string
): Promise<boolean> {
  try {
    // Determine if it's a file or directory
    let isDirectory = false;
    try {
      await dirHandle.getDirectoryHandle(name);
      isDirectory = true;
    } catch {
      // Not a directory
    }

    await dirHandle.removeEntry(name, { recursive: isDirectory });
    return true;
  } catch (err) {
    console.error("deletePhysicalFile error:", err);
    return false;
  }
}

/**
 * Rename a node's title — also renames the physical file/folder on disk.
 */
export async function renameTreeNode(
  dirHandle: FileSystemDirectoryHandle,
  tree: TreeJson,
  nodeId: string,
  newTitle: string
): Promise<TreeJson> {
  const node = tree.nodes.find((n) => n.id === nodeId);
  if (!node) return tree;

  const oldTitle = node.title;
  if (oldTitle === newTitle) return tree;

  // Rename the physical file/folder on disk first
  const diskOk = await renamePhysicalFile(dirHandle, oldTitle, newTitle);
  if (!diskOk) {
    // If disk rename fails, still update the virtual tree
    // (the file might not exist on disk if it's a virtual-only node)
    console.warn(`Failed to rename physical file "${oldTitle}" → "${newTitle}"`);
  }

  // Update the virtual tree node
  node.title = newTitle;

  // Update any children's paths (no-op for virtual tree since we use IDs not paths)
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
 * Also deletes the physical files/folders from disk.
 */
export async function deleteTreeNode(
  dirHandle: FileSystemDirectoryHandle,
  tree: TreeJson,
  nodeId: string
): Promise<TreeJson> {
  // Collect all node IDs to delete (node + descendants)
  const toDelete = new Set<string>();
  const collectIds = (id: string) => {
    toDelete.add(id);
    tree.nodes.filter(n => n.parentId === id).forEach(child => collectIds(child.id));
  };
  collectIds(nodeId);

  // Delete physical files for each node being removed
  // Only delete the root-level physical entries (descendants are inside their parent directories)
  const deletedParentIds = new Set<string>();
  for (const id of toDelete) {
    const node = tree.nodes.find(n => n.id === id);
    if (!node) continue;

    // Only delete physical files for root nodes or nodes whose parent is NOT being deleted
    // (because if a parent folder is deleted, all its contents are already gone)
    if (node.parentId === null || !toDelete.has(node.parentId)) {
      await deletePhysicalFile(dirHandle, node.title);
    }
  }

  // Remove nodes from the virtual tree
  tree.nodes = tree.nodes.filter(n => !toDelete.has(n.id));

  // Re-order remaining siblings
  const deletedNode = tree.nodes.find(n => n.id === nodeId); // won't exist anymore
  // Find parent of deleted node (if it still exists)
  const parentOfDeleted = toDelete.size > 0 ? null : null; // parent was already removed
  // Actually, let's re-order all remaining siblings properly
  const parentIds = new Set<string | null>();
  tree.nodes.forEach(n => parentIds.add(n.parentId));
  for (const pid of parentIds) {
    const siblings = tree.nodes
      .filter(n => n.parentId === pid)
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
