import { generateCard, generateBatchCards } from './cardGenerator.js';
import { showCollection } from './collection.js';
import { setupPrintButton } from './print.js';
import { getCurrentUserFollowData } from './api.js';
import { showToast } from './utils.js';

export function setupEventListeners() {
  // Single card generation
  document.getElementById('generateBtn').addEventListener('click', generateCard);
  
  // Add batch generate button
  const batchBtn = document.createElement('button');
  batchBtn.className = 'batch-generate';
  batchBtn.title = 'Generate Multiple Cards';
  batchBtn.innerHTML = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
      <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 16H5V5h2v3h10V5h2v14z"/>
    </svg>
  `;
  
  batchBtn.addEventListener('click', async () => {
    try {
      const users = await getCurrentUserFollowData();
      if (users.length === 0) {
        showToast('No followers or following found to generate cards from', true);
        return;
      }
      
      // Show loading state
      batchBtn.classList.add('loading');
      const loadingSpinner = document.createElement('div');
      loadingSpinner.className = 'loading-spinner';
      batchBtn.appendChild(loadingSpinner);
      
      // Generate multiple cards
      const cards = await generateBatchCards(users);
      
      // Remove loading state
      batchBtn.classList.remove('loading');
      loadingSpinner.remove();
      
      if (cards.length > 0) {
        showToast(`Generated ${cards.length} new character cards!`);
        // Open collection viewer to show new cards
        showCollection();
      } else {
        showToast('Failed to generate character cards', true);
      }
    } catch (error) {
      console.error('Error generating batch cards:', error);
      showToast('Error generating multiple cards', true);
      batchBtn.classList.remove('loading');
    }
  });
  
  document.querySelector('.container').appendChild(batchBtn);
  
  const initialCard = document.querySelector('.card');
  if (initialCard) {
    initialCard.addEventListener('click', async (e) => {
      if (initialCard.classList.contains('locating')) return;
      
      initialCard.classList.add('locating');
      const generateBtn = document.getElementById('generateBtn');
      generateBtn.classList.add('locating');
      
      try {
        await generateCard();
        
        const cardInner = document.querySelector('.card-inner');
        if (cardInner) {
          cardInner.classList.toggle('flipped');
        }
      } catch (error) {
        console.error('Error during initial card locate:', error);
      } finally {
        initialCard.classList.remove('locating');
        generateBtn.classList.remove('locating');
      }
    });
  }
  
  setupPrintButton();

  // Add collection button
  const collectionBtn = document.createElement('button');
  collectionBtn.className = 'collection-btn';
  collectionBtn.title = 'View Collection';
  collectionBtn.innerHTML = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 4v12H8V4h12m0-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7.53 12L9 10.5l1.4-1.41 2.07 2.08L17.6 6 19 7.41 12.47 14zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/>
    </svg>
  `;
  
  document.querySelector('.container').appendChild(collectionBtn);
  collectionBtn.addEventListener('click', showCollection);

  // Add share functionality
  setupShareButton();
}

function setupShareButton() {
  const shareBtn = document.createElement('button');
  shareBtn.className = 'share-btn';
  shareBtn.title = 'Share Card';
  shareBtn.innerHTML = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
    </svg>
  `;
  
  let currentCard = null;
  
  // Update share button visibility when card changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        const card = document.querySelector('.card');
        if (card && !card.classList.contains('flipped')) {
          shareBtn.style.display = 'flex';
          currentCard = card;
        } else {
          shareBtn.style.display = 'none';
          currentCard = null;
        }
      }
    });
  });
  
  observer.observe(document.getElementById('cardContainer'), {
    childList: true,
    subtree: true
  });
  
  shareBtn.addEventListener('click', async () => {
    if (!currentCard) return;
    
    try {
      const cardData = currentCard.cardData;
      if (!cardData) {
        showToast('No card data available to share', true);
        return;
      }
      
      // Create share menu
      const shareMenu = document.createElement('div');
      shareMenu.className = 'share-menu';
      shareMenu.innerHTML = `
        <button class="share-option" data-action="gallery">
          <svg viewBox="0 0 24 24">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
          </svg>
          Share to Gallery
        </button>
        <button class="share-option" data-action="download">
          <svg viewBox="0 0 24 24">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
          Download Card
        </button>
      `;
      
      document.body.appendChild(shareMenu);
      
      // Position menu near share button
      const buttonRect = shareBtn.getBoundingClientRect();
      shareMenu.style.top = `${buttonRect.bottom + 10}px`;
      shareMenu.style.left = `${buttonRect.left}px`;
      
      // Handle share options
      shareMenu.addEventListener('click', async (e) => {
        const option = e.target.closest('.share-option');
        if (!option) return;
        
        const action = option.dataset.action;
        
        if (action === 'gallery') {
          // Handle gallery share
          try {
            const websimSocket = new WebsimSocket();
            await websimSocket.collection('user-cards').create(cardData);
            showToast('Card shared to gallery successfully!');
          } catch (error) {
            console.error('Error sharing to gallery:', error);
            showToast('Failed to share card to gallery', true);
          }
        } else if (action === 'download') {
          // Handle card download
          try {
            const canvas = await html2canvas(currentCard);
            const link = document.createElement('a');
            link.download = `${cardData.name}-card.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
          } catch (error) {
            console.error('Error downloading card:', error);
            showToast('Failed to download card', true);
          }
        }
        
        shareMenu.remove();
      });
      
      // Close menu when clicking outside
      document.addEventListener('click', function closeMenu(e) {
        if (!shareMenu.contains(e.target) && e.target !== shareBtn) {
          shareMenu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
      
    } catch (error) {
      console.error('Error handling share:', error);
      showToast('Failed to share card', true);
    }
  });
  
  document.querySelector('.container').appendChild(shareBtn);
}