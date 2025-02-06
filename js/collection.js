import { createMiniCard } from './components/miniCard.js';
import { createCollectionViewer } from './ui.js';
import { getTypeIcon } from './utils.js';
import { getAllCards } from './db.js';

const websimSocket = new WebsimSocket();

export function displayFilteredCards(cards, selectedTypes, filterMode, isGalleryView = false) {
  const grid = document.querySelector('.collection-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  let filteredCards;
  
  if (selectedTypes.length === 0 || (selectedTypes.length === 1 && selectedTypes[0] === 'all')) {
    filteredCards = cards;
  } else if (filterMode === 'and') {
    filteredCards = cards.filter(card => 
      selectedTypes.every(type => 
        card.type
        .split('/')
        .map(t => t.trim())
        .includes(type)
      )
    );
  } else { // 'single' or 'or'
    filteredCards = cards.filter(card => 
      selectedTypes.some(type => 
        card.type
        .split('/')
        .map(t => t.trim())
        .includes(type)
      )
    );
  }
  
  if (filteredCards.length === 0) {
    grid.innerHTML = `
      <div class="no-cards-message">
        No character cards found matching the selected filters
      </div>
    `;
    return;
  }
  
  filteredCards.forEach(card => {
    const miniCard = createMiniCard(card, isGalleryView);
    grid.appendChild(miniCard);
  });
}

export async function showCollection() {
  let viewer = document.querySelector('.collection-viewer');
  
  if (!viewer) {
    viewer = await createCollectionViewer();
  }
  
  const grid = viewer.querySelector('.collection-grid');
  const tabsContainer = viewer.querySelector('.collection-tabs');
  
  if (!grid || !tabsContainer) {
    console.error('Required collection elements not found');
    return;
  }

  try {
    const isShowingGallery = viewer.querySelector('h2').textContent.includes('Gallery');
    let cards;
    if (isShowingGallery) {
      cards = await websimSocket.collection('user-cards').getList();
    } else {
      cards = await getAllCards();
      cards.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    const allTypes = new Set();
    cards.forEach(card => {
      card.type.split('/').forEach(type => {
        allTypes.add(type.trim());
      });
    });
    
    // Sort types logically: Elements first, then Classes
    const elementTypes = ['Light', 'Dark', 'Fire', 'Water', 'Earth', 'Air', 'Nature'];
    const sortedTypes = Array.from(allTypes).sort((a, b) => {
      const aIsElement = elementTypes.includes(a);
      const bIsElement = elementTypes.includes(b);
      if (aIsElement && !bIsElement) return -1;
      if (!aIsElement && bIsElement) return 1;
      return a.localeCompare(b);
    });
    
    tabsContainer.innerHTML = `
      <button class="type-tab" data-type="all">
        <span>ALL</span>
      </button>
      ${sortedTypes.map(type => `
        <button class="type-tab" data-type="${type}">
          <div class="type-icon ${type.toLowerCase()}">${getTypeIcon(type)}</div>
          <span>${type}</span>
        </button>
      `).join('')}
    `;

    let selectedTypes = new Set();
    let filterMode = 'single'; 
    
    const tabs = tabsContainer.querySelectorAll('.type-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', async (e) => {
        const type = tab.dataset.type;
        
        if (e.ctrlKey || e.metaKey) {
          if (filterMode !== 'and') {
            selectedTypes.clear(); 
            filterMode = 'and';
          }
          
          if (selectedTypes.has(type)) {
            selectedTypes.delete(type);
          } else if (selectedTypes.size < 2) {
            selectedTypes.add(type);
          }
          
        } else if (e.shiftKey) {
          filterMode = 'or';
          if (selectedTypes.has(type)) {
            selectedTypes.delete(type);
          } else {
            selectedTypes.add(type);
          }
          
        } else {
          filterMode = 'single';
          selectedTypes.clear();
          selectedTypes.add(type);
        }

        tabs.forEach(t => {
          t.classList.remove('selected-single', 'selected-or', 'selected-and');
          if (selectedTypes.has(t.dataset.type)) {
            t.classList.add(`selected-${filterMode}`);
          }
        });
        
        const isShowingGallery = viewer.querySelector('h2').textContent.includes('Gallery');
        let currentCards;
        
        if (isShowingGallery) {
          currentCards = await websimSocket.collection('user-cards').getList();
        } else {
          currentCards = await getAllCards();
          currentCards.sort((a, b) => b.timestamp - a.timestamp);
        }
        
        if (type === 'all' && filterMode === 'single') {
          selectedTypes.clear();
        }
        
        displayFilteredCards(currentCards, Array.from(selectedTypes), filterMode, isShowingGallery);
      });
    });
    
    displayFilteredCards(cards, [], 'single', isShowingGallery);
    
    // Add real-time updates for gallery view
    if (isShowingGallery) {
      websimSocket.collection('user-cards').subscribe((updatedCards) => {
        if (viewer && !viewer.classList.contains('hidden') && isShowingGallery) {
          displayFilteredCards(updatedCards, Array.from(selectedTypes), filterMode, true);
        }
      });
    }
    
    viewer.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading collection:', error);
  }
}

// Add new function to handle batch card generation
export async function generateBatchCards(users, maxCards = 5) {
  const generatedCards = [];
  const usersToProcess = users.slice(0, maxCards);
  
  for (const user of usersToProcess) {
    try {
      const cardData = await generateUserCard(user);
      if (cardData) {
        generatedCards.push(cardData);
      }
    } catch (error) {
      console.error(`Error generating card for user ${user.username}:`, error);
    }
  }
  
  return generatedCards;
}