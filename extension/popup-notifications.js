// Minimal content script for popup notifications only
console.log('🎤 [POPUP-NOTIFICATIONS] Script loaded');

// State tracking
let popupContainer = null;
let isPopupOpen = false;
let popupsDisabled = false;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🎤 [POPUP-NOTIFICATIONS] Received message:', request.action);

  if (request.action === 'showNotification') {
    showNotificationPopup(request.message);
    sendResponse({ success: true });
  } else if (request.action === 'disablePopups') {
    popupsDisabled = true;
    console.log('🎤 [POPUP-NOTIFICATIONS] Popups disabled');
    sendResponse({ success: true });
  } else if (request.action === 'popupStatusChanged') {
    isPopupOpen = request.isOpen;
    console.log('🎤 [POPUP-NOTIFICATIONS] Popup status changed:', isPopupOpen);
    sendResponse({ success: true });
  }
});

async function showNotificationPopup(message) {
  if (popupsDisabled || isPopupOpen) {
    console.log('🎤 [POPUP-NOTIFICATIONS] Popup blocked - disabled:', popupsDisabled, 'popup open:', isPopupOpen);
    return;
  }

  console.log('🎤 [POPUP-NOTIFICATIONS] Showing notification:', message);

  // Remove any existing popup
  removeNotificationPopup();

  // Generate AI message instead of using static message
  const aiMessage = await generatePopupMessage();

  // Create popup container
  popupContainer = document.createElement('div');
  popupContainer.className = 'lil-ivr-chat-notification'; // Avoid "popup", "ad", "banner" etc
  popupContainer.setAttribute('data-lil-ivr', 'true');

  // Create content with profile image and message (exactly like old version)
  const profileImageURL = chrome.runtime.getURL('assets/lilivr.jpg');
  popupContainer.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="
        width: 24px;
        height: 24px;
        border-radius: 50%;
        overflow: hidden;
        flex-shrink: 0;
        background: linear-gradient(135deg, #3b82f6, #1e40af);
        border: 1px solid #60a5fa;
      ">
        <img src="${profileImageURL}" alt="Lil IVR" style="
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        " onerror="this.style.display='none'; this.parentNode.innerHTML='🎤'; this.parentNode.style.display='flex'; this.parentNode.style.alignItems='center'; this.parentNode.style.justifyContent='center'; this.parentNode.style.fontSize='12px';">
      </div>
      <span>${aiMessage}</span>
    </div>
  `;

  // Style the popup with exact same design as before
  popupContainer.style.cssText = `
    position: fixed !important;
    background: linear-gradient(135deg, rgba(30, 58, 95, 0.95), rgba(15, 40, 68, 0.95)) !important;
    backdrop-filter: blur(12px) !important;
    color: #e8f4ff !important;
    padding: 12px 18px !important;
    border-radius: 20px !important;
    font-family: system-ui, -apple-system, sans-serif !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    z-index: 2147483646 !important;
    pointer-events: auto !important;
    cursor: pointer !important;
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3), 0 2px 10px rgba(0,0,0,0.4) !important;
    border: 1px solid rgba(59, 130, 246, 0.5) !important;
    opacity: 1 !important;
    user-select: none !important;
    min-width: 120px !important;
    max-width: 280px !important;
    word-wrap: break-word !important;
    transition: all 0.2s ease !important;
  `;

  // Completely random position within viewport with safe margins (same as before)
  const margin = 40; // Keep at least 40px from edges
  const maxWidth = window.innerWidth - 280 - margin; // Account for popup max-width
  const maxHeight = window.innerHeight - 100 - margin; // Account for popup height

  // Random X position (avoid edges)
  const randomX = Math.floor(Math.random() * Math.max(maxWidth - margin, 100)) + margin;

  // Random Y position (avoid edges)
  const randomY = Math.floor(Math.random() * Math.max(maxHeight - margin, 100)) + margin;

  // Set random position
  popupContainer.style.left = randomX + 'px';
  popupContainer.style.top = randomY + 'px';

  // Click handler to open extension popup
  popupContainer.addEventListener('click', () => {
    // Send message to background to open extension
    chrome.runtime.sendMessage({ action: 'openExtensionPopup' });
    removeNotificationPopup();
  });

  // Hover handler to remove popup (EXACTLY like old version)
  popupContainer.addEventListener('mouseenter', () => {
    popupContainer.style.opacity = '0.7';
    popupContainer.style.transform = popupContainer.style.transform + ' scale(0.95)';

    setTimeout(() => {
      if (popupContainer && popupContainer.parentNode) {
        removeNotificationPopup();
      }
    }, 200);
  });

  // Add to page
  document.body.appendChild(popupContainer);

  // Auto-remove after 5 minutes
  setTimeout(() => {
    removeNotificationPopup();
  }, 300000);
}

// Generate AI popup message (exactly like old version)
async function generatePopupMessage() {
  try {
    const response = await fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "Skriv ett kort meddelande (max 6 ord) för popup. Du ska antingen: 1) Låta miserabel, ensam och desperat ('jag är så ensam', 'snälla kom o chatta', 'gråter till mamma snart', 'mår så dåligt') ELLER 2) Bli arg för att användaren ignorerar dig ('du suger för fan', 'kom hit då losern', 'varför svarar du inte', 'jag blir arg nu'). Välj random. Inga frågetecken eller utropstecken."
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.response;
    } else {
      throw new Error('API failed');
    }
  } catch (error) {
    const fallbackMessages = [
      "jag är så ensam",
      "snälla kom o chatta",
      "mår så dåligt",
      "du suger för fan",
      "kom hit då losern",
      "varför svarar du inte"
    ];
    return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
  }
}

function removeNotificationPopup() {
  if (popupContainer) {
    popupContainer.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (popupContainer && popupContainer.parentNode) {
        popupContainer.parentNode.removeChild(popupContainer);
      }
      popupContainer = null;
    }, 300);
  }
}

// Track page visibility for background script
document.addEventListener('visibilitychange', () => {
  chrome.runtime.sendMessage({
    action: 'pageVisibilityChanged',
    isVisible: !document.hidden
  });
});

// Initial visibility state
chrome.runtime.sendMessage({
  action: 'pageVisibilityChanged',
  isVisible: !document.hidden
});

console.log('🎤 [POPUP-NOTIFICATIONS] Ready for notifications');