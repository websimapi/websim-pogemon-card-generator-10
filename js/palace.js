import { getDB } from './db.js';

const websimSocket = new WebsimSocket();

export async function sendToPoGePalace(cardData) {
  try {
    // First fetch the image and convert it to a File object
    const response = await fetch(cardData.imageUrl);
    const blob = await response.blob();
    const file = new File([blob], `${cardData.name}-card.png`, { type: 'image/png' });
    
    // Upload image to websim storage
    const backupImageUrl = await websim.upload(file);
    
    // Update local IndexDB record with backup URL
    if (cardData.id) {
      const db = getDB();
      const transaction = db.transaction(['cards'], 'readwrite');
      const store = transaction.objectStore('cards');
      const request = store.get(cardData.id);
      
      request.onsuccess = () => {
        const record = request.result;
        if (record) {
          record.backupImageUrl = backupImageUrl;
          store.put(record);
        }
      };
    }
    
    // Create a new record in the websim palace collection
    const palaceRecord = await websimSocket.collection('pogemon').create({
      name: cardData.name,
      description: cardData.description,
      pogetype: cardData.type,
      height: cardData.height,
      weight: cardData.weight,
      imageUrl: cardData.imageUrl,
      backupImageUrl: backupImageUrl,
      userData: cardData.userData,
      creator: websimSocket.party.client.username
    });
    
    console.log('New palace record created:', palaceRecord);

    // Subscribe to changes in the palace collection
    websimSocket.collection('pogemon').subscribe((pogemon) => {
      console.log('Palace collection updated:', pogemon);
    });

    return palaceRecord;
  } catch (error) {
    console.error('Error sending to palace:', error);
    throw error;
  }
}