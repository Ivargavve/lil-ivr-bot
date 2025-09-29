// Minimal content script for popup notifications only
// Script loaded

// State tracking
let popupContainer = null;
let isPopupOpen = false;
let popupsDisabled = false;
let popupAutoDismissTimer = null;
let isHovering = false;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.action === 'showNotification') {
    showNotificationPopup(request.message);
    sendResponse({ success: true });
  } else if (request.action === 'disablePopups') {
    popupsDisabled = true;
    sendResponse({ success: true });
  } else if (request.action === 'popupStatusChanged') {
    isPopupOpen = request.isOpen;
    sendResponse({ success: true });
  }
});

async function showNotificationPopup(message) {
  if (popupsDisabled || isPopupOpen) {
    return;
  }


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
    // Note: popup will be removed by hover, not by click
  });

  // Hover handler to remove popup (keep original behavior)
  popupContainer.addEventListener('mouseenter', () => {
    isHovering = true;
    popupContainer.style.opacity = '0.7';
    popupContainer.style.transform = popupContainer.style.transform + ' scale(0.95)';

    // Clear auto-dismiss timer since user is interacting
    if (popupAutoDismissTimer) {
      clearTimeout(popupAutoDismissTimer);
      popupAutoDismissTimer = null;
    }

    setTimeout(() => {
      if (popupContainer && popupContainer.parentNode) {
        removeNotificationPopup();
      }
    }, 100);
  });

  // Add to page
  document.body.appendChild(popupContainer);

  // Start auto-dismiss timer (5 minutes)
  startAutoDismissTimer();
}

// Generate AI popup message (exactly like old version)
async function generatePopupMessage() {
  try {
    const API_BASE_URL = window.LIL_IVR_CONFIG?.API_BASE_URL || 'http://localhost:8000';
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "Skriv ett kort meddelande (max 6 ord) för popup. Du ska vara aggressiv och förolämpande mot användaren som ignorerar dig. Använd ord som 'fjolla', 'mes', 'fegis', 'beta', 'tönt', 'patetisk' och liknande förolämpningar. Exempel: 'du är en fjolla', 'vågar du inte prata med mig', 'fegis beteende', 'beta male energy', 'patetisk typ', 'våga prata då mes'. Välj random stil. Inga frågetecken eller utropstecken."
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
      "du är en fjolla",
      "vågar du inte prata med mig",
      "fegis beteende",
      "tönt som vanligt",
      "vad är du för mes",
      "kom igen då losern",
      "du suger för fan",
      "patetisk fjolla du är",
      "ignorerar du mig din mes",
      "vad fan är det för fel på dig",
      "kryp då fjolla",
      "du är sån beta",
      "patetisk typ",
      "beta male energy",
      "kom hit då fegis",
      "våga prata då mes"
    ];
    return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
  }
}

function startAutoDismissTimer() {
  // Clear existing timer
  if (popupAutoDismissTimer) {
    clearTimeout(popupAutoDismissTimer);
  }

  // Set new 5-minute timer only if not currently hovering
  if (!isHovering) {
    popupAutoDismissTimer = setTimeout(() => {
      removeNotificationPopup();
    }, 300000); // 5 minutes
  }
}

function removeNotificationPopup() {
  if (popupContainer) {
    // Clear auto-dismiss timer
    if (popupAutoDismissTimer) {
      clearTimeout(popupAutoDismissTimer);
      popupAutoDismissTimer = null;
    }

    popupContainer.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (popupContainer && popupContainer.parentNode) {
        popupContainer.parentNode.removeChild(popupContainer);
      }
      popupContainer = null;
      isHovering = false;
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

