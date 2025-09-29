// Lil IVR Bot Content Script


// Check if the chatbot is already injected
if (!document.getElementById('lil-ivr-chatbot-root')) {

  // Create the root container for the React app
  const chatbotContainer = document.createElement('div');
  chatbotContainer.id = 'lil-ivr-chatbot-root';
  chatbotContainer.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    pointer-events: none !important;
    z-index: 2147483647 !important;
  `;

  // Add to page
  document.body.appendChild(chatbotContainer);

  // Load React and the chatbot app
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('chatbot-app.js');
  document.head.appendChild(script);

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'showProactiveMessage') {
      // Trigger proactive message in the React app
      window.postMessage({
        type: 'LIL_IVR_PROACTIVE_MESSAGE',
        message: request.message
      }, '*');
    } else if (request.action === 'openChat' || request.action === 'toggleChatbot') {
      // Open chat directly
      window.postMessage({
        type: 'LIL_IVR_OPEN_CHAT'
      }, '*');

      // Also try calling the global function if available
      if (window.lilIvrOpenChat) {
        window.lilIvrOpenChat();
      }
    } else if (request.action === 'popupStatusChanged') {
      // Update popup system based on popup status
      chatIsOpen = request.isOpen;
    } else if (request.action === 'disablePopups') {
      // Disable popups for this session
      popupSystemActive = false;
    }

    sendResponse({success: true});
  });

  // Function to get page context for analysis
  function getPageContext() {
    const title = document.title;
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
      .map(h => h.textContent.trim())
      .slice(0, 5)
      .join('. ');

    const paragraphs = Array.from(document.querySelectorAll('p'))
      .map(p => p.textContent.trim())
      .filter(text => text.length > 20)
      .slice(0, 3)
      .join('. ');

    const meta = document.querySelector('meta[name="description"]');
    const description = meta ? meta.getAttribute('content') : '';

    return {
      title,
      headings,
      paragraphs,
      description,
      url: window.location.href
    };
  }

  // Make page context available globally
  window.lilIvrGetPageContext = getPageContext;

  // Fallback messages if API fails
  const fallbackMessages = [
    "jag är så ensam",
    "snälla kom o chatta",
    "mår så dåligt just nu",
    "ignorera mig inte",
    "gråter till mamma snart",
    "varför pratar ingen med mig",
    "känner mig så övergiven",
    "hjälp mig då",
    "du suger för fan",
    "kom hit då losern",
    "varför svarar du inte",
    "jag blir arg nu"
  ];

  // Generate random popup message using AI
  async function generatePopupMessage() {
    try {
      const response = await fetch('http://localhost:8000/chat', {
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
      return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
    }
  }

  // Track if chat is open to avoid spam
  let chatIsOpen = false;
  let lastPopupTime = 0;
  let popupSystemActive = true;

  // Check if chat is actually visible and open (simplified - mainly for in-page chat widget)
  function checkChatStatus() {
    // Only check for expanded chatbot widget on page
    const chatWidget = document.querySelector('.lil-ivr-chatbot .chatbot-expanded');
    const pageChat = chatWidget && chatWidget.offsetParent !== null;

    return pageChat;
  }

  // Listen for chat open/close events
  window.addEventListener('message', (event) => {
    if (event.data.type === 'LIL_IVR_CHAT_STATUS') {
      chatIsOpen = event.data.isOpen;
    }
  });

  async function createRandomPopup() {
    if (!popupSystemActive) {
      return;
    }

    // Don't show if chat is open (chatIsOpen is controlled by background script for popup status)
    const actualChatOpen = checkChatStatus(); // Only check in-page widget
    if (chatIsOpen || actualChatOpen) {
      return;
    }

    // For popup spam, reduce cooldown to 3 seconds instead of 5
    const now = Date.now();
    const timeSinceLastPopup = now - lastPopupTime;

    if (timeSinceLastPopup < 3000) {
      return;
    }

    lastPopupTime = now;

    // Generate AI message or use fallback
    const message = await generatePopupMessage();

    // Create popup element with adblock-resistant naming
    const popup = document.createElement('div');
    popup.className = 'lil-ivr-chat-notification'; // Avoid "popup", "ad", "banner" etc
    popup.setAttribute('data-lil-ivr', 'true');

    // Create content with profile image and message
    const profileImageURL = chrome.runtime.getURL('assets/lilivr.jpg');
    popup.innerHTML = `
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
        <span>${message}</span>
      </div>
    `;

    // Style the popup with adblock-resistant properties (no animations, with transparency)
    popup.style.cssText = `
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

    // Completely random position within viewport with safe margins
    const margin = 40; // Keep at least 40px from edges
    const maxWidth = window.innerWidth - 280 - margin; // Account for popup max-width
    const maxHeight = window.innerHeight - 100 - margin; // Account for popup height

    // Random X position (avoid edges)
    const randomX = Math.floor(Math.random() * Math.max(maxWidth - margin, 100)) + margin;

    // Random Y position (avoid edges)
    const randomY = Math.floor(Math.random() * Math.max(maxHeight - margin, 100)) + margin;

    // Set random position
    popup.style.left = randomX + 'px';
    popup.style.top = randomY + 'px';

    // No CSS animations needed - using JS transitions to avoid adblock detection

    // Click handler to open chat
    popup.addEventListener('click', () => {
      window.postMessage({ type: 'LIL_IVR_OPEN_CHAT' }, '*');
      if (window.lilIvrOpenChat) {
        window.lilIvrOpenChat();
      }
      popup.remove();
    });

    // Hover handler to remove popup
    popup.addEventListener('mouseenter', () => {
      popup.style.opacity = '0.7';
      popup.style.transform = popup.style.transform + ' scale(0.95)';

      setTimeout(() => {
        if (popup.parentNode) {
          popup.remove();
        }
      }, 200);
    });

    // Add to page with error handling
    try {
      if (!document.body) {
        return;
      }

      document.body.appendChild(popup);

      // Popup stays until hovered - no auto-removal timeout

    } catch (error) {
    }
  }

  // Function to schedule next popup with random interval (10s to 20s for debugging)
  function scheduleNextPopup() {
    const minInterval = 10000; // 10 seconds
    const maxInterval = 20000; // 20 seconds
    const randomInterval = Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval;

    setTimeout(() => {
      createRandomPopup();
      scheduleNextPopup(); // Schedule the next one
    }, randomInterval);
  }

  // Start the random popup system
  scheduleNextPopup();

  // Show first popup after random delay (5-15 seconds)
  const initialDelay = Math.floor(Math.random() * 10000) + 5000;
  setTimeout(() => {
    createRandomPopup();
  }, initialDelay);

  // Global functions for controlling popup system
  window.lilIvrStopPopups = function() {
    popupSystemActive = false;
  };

  window.lilIvrStartPopups = function() {
    popupSystemActive = true;
  };

  window.lilIvrResetPopupTimer = function() {
    lastPopupTime = 0;
  };

  // Make popup function available globally for manual testing
  window.lilIvrTestPopup = function() {
    createRandomPopup();
  };
}