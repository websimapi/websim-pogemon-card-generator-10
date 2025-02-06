let db;

export const initDB = () => {
  const request = indexedDB.open('Pogeflex', 1);
  
  request.onerror = (event) => {
    console.error('Database error:', event.target.error);
  };

  request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains('cards')) {
      const store = db.createObjectStore('cards', { keyPath: 'id', autoIncrement: true });
      store.createIndex('name', 'name', { unique: false });
      store.createIndex('timestamp', 'timestamp', { unique: false });
    }
  };

  request.onsuccess = (event) => {
    db = event.target.result;
  };
};

export const saveCard = async (cardData) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['cards'], 'readwrite');
    const store = transaction.objectStore('cards');
    
    const newCard = {
      id: cardData.id, 
      name: cardData.name,
      description: cardData.description,
      type: cardData.type,
      height: cardData.height,
      weight: cardData.weight,
      imageUrl: cardData.imageUrl,
      backupImageUrl: cardData.backupImageUrl,
      avatarUrl: cardData.avatarUrl,
      timestamp: new Date().getTime(),
      userData: {
        username: cardData.username,
        description: cardData.userDescription,
        created_at: cardData.created_at,
        avatar_url: cardData.avatar_url
      }
    };

    const request = store.put(newCard); 

    request.onsuccess = () => resolve(newCard);
    request.onerror = () => reject(request.error);
  });
};

export const getAllCards = async () => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['cards'], 'readonly');
    const store = transaction.objectStore('cards');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteCard = async (id) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['cards'], 'readwrite');
    const store = transaction.objectStore('cards');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getDB = () => db;