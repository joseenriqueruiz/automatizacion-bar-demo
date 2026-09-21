(function () {
  "use strict";

  const DB_NAME = "mesa-clara-demo";
  const DB_VERSION = 1;
  const STORE = "snapshots";
  const SETTINGS = "settings";

  const DEMO_SNAPSHOTS = [
    {
      id: "demo-tabla-regional",
      status: "approved",
      demo: true,
      dishId: "tabla-regional",
      dishName: "Mesa de sabores",
      imageUrl: "assets/sabores-regionales.webp",
      text: "Una selección abundante para compartir y probar un poco de todo.",
      alias: "Vale",
      table: "04",
      createdAt: "2026-09-14T21:10:00.000Z",
      approvedAt: "2026-09-14T21:18:00.000Z",
      removalRequested: false,
    },
    {
      id: "demo-empanadas",
      status: "approved",
      demo: true,
      dishId: "empanada",
      dishName: "Empanada tucumana",
      imageUrl: "assets/empanadas.jpg",
      text: "Masa crocante y relleno jugoso. Pedimos otra ronda.",
      alias: "Mesa familiar",
      table: "09",
      createdAt: "2026-09-14T20:36:00.000Z",
      approvedAt: "2026-09-14T20:45:00.000Z",
      removalRequested: false,
    },
    {
      id: "demo-locro",
      status: "approved",
      demo: true,
      dishId: "locro",
      dishName: "Locro",
      imageUrl: "assets/regional.jpg",
      text: "Bien caliente y casero, ideal para esta noche fresca.",
      alias: "Sin alias",
      table: "02",
      createdAt: "2026-09-14T19:52:00.000Z",
      approvedAt: "2026-09-14T20:02:00.000Z",
      removalRequested: false,
    },
    {
      id: "demo-pending-milanesa",
      status: "pending",
      demo: true,
      dishId: "milanesa-plato",
      dishName: "Milanesa con papas",
      imageUrl: "assets/hero-food.jpg",
      text: "Porción generosa para compartir.",
      alias: "Luli",
      table: "07",
      createdAt: "2026-09-14T22:05:00.000Z",
      consent: true,
      removalRequested: false,
    },
    {
      id: "demo-rejected-limonada",
      status: "rejected",
      demo: true,
      dishId: "limonada",
      dishName: "Limonada de la casa",
      imageUrl: "assets/regional.jpg",
      text: "Foto de prueba que el bar decidió no publicar.",
      alias: "Mesa 06",
      table: "06",
      createdAt: "2026-09-14T18:25:00.000Z",
      consent: true,
      removalRequested: false,
    },
  ];

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function transactionDone(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error("La operación fue cancelada"));
    });
  }

  async function openDatabase() {
    if (!("indexedDB" in window)) throw new Error("Este navegador no permite almacenamiento local avanzado.");
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) {
        const store = database.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!database.objectStoreNames.contains(SETTINGS)) {
        database.createObjectStore(SETTINGS, { keyPath: "key" });
      }
    };
    const database = await requestResult(request);
    const seedCheck = database.transaction(SETTINGS, "readonly").objectStore(SETTINGS).get("snapshot-seed-v3");
    const seeded = await requestResult(seedCheck);
    if (!seeded) {
      const transaction = database.transaction([STORE, SETTINGS], "readwrite");
      DEMO_SNAPSHOTS.forEach((snapshot) => transaction.objectStore(STORE).put(snapshot));
      transaction.objectStore(SETTINGS).put({ key: "snapshot-seed-v3", value: true });
      await transactionDone(transaction);
    }
    return database;
  }

  async function getAll() {
    const database = await openDatabase();
    const records = await requestResult(database.transaction(STORE, "readonly").objectStore(STORE).getAll());
    database.close();
    return records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async function put(record) {
    const database = await openDatabase();
    const transaction = database.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).put(record);
    await transactionDone(transaction);
    database.close();
    return record;
  }

  async function remove(id) {
    const database = await openDatabase();
    const transaction = database.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).delete(id);
    await transactionDone(transaction);
    database.close();
  }

  async function update(id, changes) {
    const database = await openDatabase();
    const transaction = database.transaction(STORE, "readwrite");
    const store = transaction.objectStore(STORE);
    const current = await requestResult(store.get(id));
    if (!current) throw new Error("No se encontró la instantánea.");
    const next = { ...current, ...changes };
    store.put(next);
    await transactionDone(transaction);
    database.close();
    return next;
  }

  window.SnapshotsDB = { getAll, put, remove, update };
}());
