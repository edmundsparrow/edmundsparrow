/**
 * Gnoke CMS — data adapter (IndexedDB implementation).
 *
 * This file is a swappable ADAPTER. Every page — public site and admin
 * alike — talks only to the `GnokeDB` namespace below, never to
 * IndexedDB directly. That means this file can later be replaced with
 * a different adapter (e.g. one backed by gnoke-database) without
 * touching site.js, article.js, dashboard.js, or editor.js — as long
 * as the replacement exposes the same six methods with the same
 * signatures and return shapes:
 *
 *   getAllPosts()        -> Promise<Post[]>            all posts, newest first
 *   getPublishedPosts()  -> Promise<Post[]>             status === 'published' only
 *   getPost(id)          -> Promise<Post|null>
 *   savePost(post)        -> Promise<Post>               insert or update (by post.id)
 *   deletePost(id)         -> Promise<void>
 *   seedIfEmpty(posts[])   -> Promise<boolean>            first-run demo content only
 *
 * To swap adapters later: point the <script src="js/db.js"> tag at the
 * new file (e.g. js/db-gnoke.js) on every page that loads it — nothing
 * else needs to change.
 *
 * Currently: everything is stored in the browser via IndexedDB, so the
 * admin panel and the public site read/write the same local database
 * as long as they're opened from the same origin. Loaded as a plain
 * <script> (not a module).
 */
const GnokeDB = (() => {
  const DB_NAME = 'GnokeCMSDB';
  const DB_VERSION = 1;
  const STORE_NAME = 'posts';

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };

      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async function getAllPosts() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () =>
        resolve(request.result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
      request.onerror = () => reject(request.error);
    });
  }

  async function getPublishedPosts() {
    const all = await getAllPosts();
    return all.filter((p) => p.status === 'published');
  }

  async function getPost(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async function savePost(post) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(post);
      tx.oncomplete = () => resolve(post);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function deletePost(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /** Inserts the given posts only if the store is currently empty. Handy for first-run demo content. */
  async function seedIfEmpty(seedPosts) {
    const all = await getAllPosts();
    if (all.length > 0) return false;
    for (const post of seedPosts) {
      await savePost(post);
    }
    return true;
  }

  return { getAllPosts, getPublishedPosts, getPost, savePost, deletePost, seedIfEmpty };
})();
