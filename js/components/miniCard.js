import { showGalleryDialog, handleRegisterToCollection, setShowingGallery } from '../ui.js';
import { loadCardToMain } from './card.js';
import { getTypeIcon, getTypeColor } from '../utils.js';

export function createMiniCard(cardData, isGalleryView = false) {
  const miniCard = document.createElement('div');
  miniCard.className = 'mini-card';
  miniCard.dataset.cardId = cardData.id;
  miniCard.cardData = cardData;
  
  const types = cardData.type.split('/');
  const primaryType = types[0].toLowerCase().trim();
  const secondaryType = types[1] ? types[1].toLowerCase().trim() : primaryType;
  const primaryColor = getTypeColor(primaryType);
  const secondaryColor = getTypeColor(secondaryType);
  
  // Different icons for Gallery vs Collection
  const buttonIcon = isGalleryView ? `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z"/>
    </svg>
  ` : `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-10h2v2h-2zm0 4h2v2h-2z"/>
    </svg>
  `;
  
  miniCard.innerHTML = `
    <div class="mini-card-inner" style="background: linear-gradient(135deg, ${primaryColor}26, ${secondaryColor}26 70%)">
      <div class="delete-overlay">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z"/>
        </svg>
      </div>
      <div class="share-button" title="${isGalleryView ? 'Add to Collection' : 'Share to Gallery'}">
        ${buttonIcon}
      </div>
      <div class="user-avatar ${cardData.avatarUrl ? 'has-avatar' : ''}">
        ${cardData.avatarUrl ? `<img src="${cardData.avatarUrl}" alt="${cardData.name}'s avatar">` : ''}
      </div>
      <h3 class="character-name">${cardData.name}</h3>
      <div class="mini-card-stats">
        <div class="mini-card-type">
          ${types.map(type => `
            <div class="type-icon ${type.toLowerCase().trim()}" title="${type.trim()}">
              ${getTypeIcon(type.trim())}
            </div>
          `).join('')}
        </div>
        <span class="mini-card-stats-text">${cardData.height} | ${cardData.weight}</span>
      </div>
      <div class="mini-card-image" style="background-image: url('${cardData.backupImageUrl || cardData.imageUrl}')"></div>
      <div class="mini-card-description">${cardData.description}</div>
    </div>
  `;

  miniCard.addEventListener('click', async (e) => {
    const shareButton = e.target.closest('.share-button');
    
    if (shareButton) {
      e.stopPropagation(); // Prevent card load
      try {
        if (isGalleryView) {
          await handleRegisterToCollection(miniCard.cardData);
        } else {
          await showGalleryDialog(miniCard.cardData);
        }
      } catch (error) {
        console.error('Failed to handle share action:', error);
      }
      return;
    }

    // Regular card click behavior
    if (!e.target.closest('.delete-overlay')) {
      // Reset gallery state when viewing a card
      setShowingGallery(false); 
      
      // Load the card
      loadCardToMain(miniCard.cardData);
      
      // Hide collection viewer
      const viewer = document.querySelector('.collection-viewer');
      if (viewer) {
        // Reset UI elements
        const galleryToggleBtn = viewer.querySelector('.gallery-toggle-btn');
        if (galleryToggleBtn) {
          galleryToggleBtn.classList.remove('active');
        }
        
        const deleteToggle = viewer.querySelector('.delete-mode-toggle');
        const importBtn = viewer.querySelector('.import-btn');
        const exportBtn = viewer.querySelector('.export-btn');
        
        if (deleteToggle) deleteToggle.style.display = '';
        if (importBtn) importBtn.style.display = '';
        if (exportBtn) exportBtn.style.display = '';
        
        // Update title
        const title = viewer.querySelector('h2');
        if (title) {
          title.textContent = 'Your Collection';
        }
        
        // Hide viewer
        viewer.classList.add('hidden');
      }
    }
  });

  return miniCard;
}