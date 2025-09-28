// Lil IVR Bot Background Service Worker

console.log('Lil IVR Bot: Background script started!');

// Store user activity and notification state
let userState = {
  lastActiveTime: Date.now(),
  lastNotificationTime: 0,
  isActive: true,
  popupOpen: false,  // Track if popup is open
  lastPopupPing: 0,   // Track when popup last sent ping
  hasUnreadNotification: false,
  notificationSent: false,
  isPageVisible: true,
  lastPopupTime: Date.now(),   // Track when last popup was sent
  lastChatMessage: Date.now(),  // Track when last chat message was sent
  nextPopupTime: Date.now() + getRandomPopupInterval(), // Next scheduled popup time
  lastChatOpened: Date.now()   // Track when chat was last opened
};

// Generate random interval between 30 seconds - 10 minutes (in milliseconds)
function getRandomPopupInterval() {
  const minSeconds = 30;
  const maxSeconds = 10 * 60; // 10 minutes in seconds
  const randomSeconds = Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds;
  return randomSeconds * 1000; // Convert to milliseconds
}

// Proactive messages
const proactiveMessages = [
  "Yo bror, vad händer? 🎤",
  "Har du glömt bort mig eller? 😢",
  "Skibidi vibes på denna sida, behöver du beats? 🔥",
  "Asså typ, jag har nya bars att dela! 💯",
  "Studio-time över, dags att hjälpa dig bror! 🎵",
  "Heyyo, behöver du hjälp med något? Lil IVR is in the house! 🎤🔥"
];

function getRandomProactiveMessage() {
  return proactiveMessages[Math.floor(Math.random() * proactiveMessages.length)];
}

// Listen for tab updates to track user activity
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    userState.lastActiveTime = Date.now();
    userState.isActive = true;
  }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  userState.lastActiveTime = Date.now();
  userState.isActive = true;
});

// Main timer - check every second
setInterval(() => {
  const now = Date.now();

  // Check if popup has timed out (no ping for 3 seconds)
  if (userState.popupOpen && (now - userState.lastPopupPing > 3000)) {
    userState.popupOpen = false;
    console.log('🎤 [BACKGROUND] Popup timed out - enabling content script popups');
    broadcastToAllTabs({ action: 'popupStatusChanged', isOpen: false });
  }

  // Send popups at random intervals (1-20 minutes) if NOT in chat AND page is visible
  if (!userState.popupOpen && userState.isPageVisible && (now >= userState.nextPopupTime)) {
    const nextInterval = getRandomPopupInterval();
    console.log(`🎤 [BACKGROUND] Sending popup - next one in ${nextInterval / 60000} minutes`);
    sendPopupNotification();
    userState.lastPopupTime = now;
    userState.nextPopupTime = now + nextInterval; // Schedule next popup
  }

  // Send chat message with song link every 30 seconds if unread (for debugging)
  // ONLY when popup NOT open AND page visible (to save money on API calls)
  if (!userState.popupOpen && userState.isPageVisible && (now - userState.lastChatMessage > 30 * 1000)) {
    console.log('🎤 [BACKGROUND] Sending chat message after 30 seconds (page visible)');
    sendChatMessage();
    userState.lastChatMessage = now;
    userState.hasUnreadNotification = true;
    updateNotificationBadge();
  }

  // Update badge regularly to check 10-minute rule (only when page is visible)
  if (userState.isPageVisible) {
    updateNotificationBadge();
  }
}, 1000);

// Send popup notifications (every 10 seconds)
async function sendPopupNotification() {
  try {
    const message = getRandomProactiveMessage();
    console.log('🎤 [BACKGROUND] Sending popup:', message);

    // Send popup notification to all tabs
    await broadcastToAllTabs({
      action: 'showNotification',
      message: message
    });

    console.log('🎤 [BACKGROUND] Popup notification sent to all tabs');
  } catch (error) {
    console.error('🎤 [BACKGROUND] Error sending popup notification:', error);
  }
}

// Send chat messages with song links (every 2 minutes)
async function sendChatMessage() {
  try {
    // Get random message from backend (includes song links)
    const response = await fetch('http://localhost:8000/random-message');
    if (response.ok) {
      const data = await response.json();
      console.log('🎤 [BACKGROUND] Got chat message:', data.message);

      // Store the notification message for chat to show
      await chrome.storage.session.set({
        'lilIVRNotification': {
          message: data.message,
          timestamp: Date.now()
        }
      });

      userState.lastNotificationTime = Date.now();
      console.log('🎤 [BACKGROUND] Chat message stored');
    }
  } catch (error) {
    console.error('🎤 [BACKGROUND] Error getting chat message:', error);
  }
}

function updateNotificationBadge() {
  try {
    const now = Date.now();
    const timeSinceLastChatOpened = now - userState.lastChatOpened;
    const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds

    // Show exclamation mark if chat hasn't been opened for 10+ minutes
    if (timeSinceLastChatOpened >= tenMinutes) {
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' }); // Blue instead of red
      console.log('🎤 [BACKGROUND] Set exclamation badge (10+ minutes without chat)');
    } else if (userState.hasUnreadNotification) {
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' }); // Blue instead of red
      console.log('🎤 [BACKGROUND] Set notification badge');
    } else {
      chrome.action.setBadgeText({ text: '' });
      console.log('🎤 [BACKGROUND] Cleared notification badge');
    }
  } catch (error) {
    console.error('🎤 [BACKGROUND] Error updating badge:', error);
  }
}

async function sendProactiveMessage() {
  // Keep old function for compatibility but not used in new system
  console.log('🎤 [BACKGROUND] Legacy sendProactiveMessage called');
}

// Handle extension icon click - open chat directly
chrome.action.onClicked.addListener(async (tab) => {
  console.log('🎤 Extension icon clicked for tab:', tab.id);
  userState.lastActiveTime = Date.now();
  userState.isActive = true;

  try {
    // Send message to content script to open chat
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'openChat'
    });
    console.log('🎤 Sent openChat message to tab:', tab.id, 'Response:', response);
  } catch (error) {
    console.error('🎤 Error opening chat:', error);

    // If content script is not ready, try to inject it
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      console.log('🎤 Content script injected manually');

      // Try again after injection
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'openChat' });
          console.log('🎤 Second attempt successful');
        } catch (e) {
          console.error('🎤 Second attempt failed:', e);
        }
      }, 500);
    } catch (injectError) {
      console.error('🎤 Failed to inject content script:', injectError);
    }
  }
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateActivity') {
    userState.lastActiveTime = Date.now();
    userState.isActive = true;
  } else if (request.action === 'popupOpened') {
    userState.popupOpen = true;
    userState.lastPopupPing = Date.now();
    // Reset notification state when popup opens
    userState.lastActiveTime = Date.now();
    userState.notificationSent = false;
    userState.hasUnreadNotification = false;
    userState.lastChatMessage = Date.now(); // Reset chat message timer
    userState.lastChatOpened = Date.now(); // Reset chat opened timer
    updateNotificationBadge();
    console.log('🎤 [BACKGROUND] Popup opened - reset timers and cleared notifications');
  } else if (request.action === 'popupClosed') {
    userState.popupOpen = false;
    console.log('🎤 [BACKGROUND] Popup closed');
  } else if (request.action === 'popupPing') {
    // Keep popup alive signal
    userState.lastPopupPing = Date.now();
    sendResponse({ status: 'ok' });
  } else if (request.action === 'pageVisibilityChanged') {
    userState.isPageVisible = request.isVisible;
    console.log('🎤 [BACKGROUND] Page visibility:', request.isVisible ? 'visible' : 'hidden');
  } else if (request.action === 'getNotificationState') {
    sendResponse({
      hasUnreadNotification: userState.hasUnreadNotification,
      notificationSent: userState.notificationSent
    });
  } else if (request.action === 'openExtensionPopup') {
    // Note: Cannot programmatically open extension popup in manifest v3
    // User needs to click the extension icon manually
    console.log('🎤 [BACKGROUND] Request to open extension popup received');
    sendResponse({ success: true });
  }
});

// Helper function to broadcast messages to all tabs
async function broadcastToAllTabs(message) {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, message);
      } catch (error) {
        // Ignore errors for tabs without content script
      }
    }
  } catch (error) {
    console.error('🎤 [BACKGROUND] Error broadcasting to tabs:', error);
  }
}

console.log('Lil IVR Bot: Background script ready!');