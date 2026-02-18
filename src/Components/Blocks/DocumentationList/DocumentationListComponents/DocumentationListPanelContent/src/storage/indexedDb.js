const DB_NAME = 'novel-sandbox'
const DB_VERSION = 1

function openDb() {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = () => {
        const db = request.result

        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'id' })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    } catch (err) {
      reject(err)
    }
  })
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export async function idbGet(storeName, key) {
  const db = await openDb()
  const tx = db.transaction(storeName, 'readonly')
  const store = tx.objectStore(storeName)

  const value = await new Promise((resolve, reject) => {
    const request = store.get(key)
    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error)
  })

  await txDone(tx)
  db.close()
  return value
}

export async function idbPut(storeName, value) {
  const db = await openDb()
  const tx = db.transaction(storeName, 'readwrite')
  tx.objectStore(storeName).put(value)
  await txDone(tx)
  db.close()
}

export async function idbDelete(storeName, key) {
  const db = await openDb()
  const tx = db.transaction(storeName, 'readwrite')
  tx.objectStore(storeName).delete(key)
  await txDone(tx)
  db.close()
}

