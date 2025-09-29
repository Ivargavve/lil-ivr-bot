// Lil IVR Bot Background Service Worker


// Configuration
// const API_BASE_URL = 'http://localhost:8000';
// For production:
const API_BASE_URL = 'https://lil-ivr-bot.onrender.com';

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
  lastChatOpened: Date.now(),   // Track when chat was last opened
  nextExclamationTime: Date.now() + getRandomExclamationInterval(), // Next exclamation check (1-10 minutes)
  lastExclamationMessage: null  // Store last message to detect new ones
};

// Generate random interval between 30 seconds - 1 minute for popups
function getRandomPopupInterval() {
  const minSeconds = 30;
  const maxSeconds = 1 * 60; // 1 minute in seconds
  const randomSeconds = Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds;
  return randomSeconds * 1000; // Convert to milliseconds
}

// Generate random interval for exclamation checks (1-3 minutes)
function getRandomExclamationInterval() {
  const minMinutes = 1;
  const maxMinutes = 3; // 3 minutes
  const randomMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
  return randomMinutes * 60 * 1000; // Convert to milliseconds
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
    broadcastToAllTabs({ action: 'popupStatusChanged', isOpen: false });
  }

  // Send popups at random intervals ONLY if there's an unread notification (exclamation mark)
  if (!userState.popupOpen && userState.isPageVisible && userState.hasUnreadNotification && (now >= userState.nextPopupTime)) {
    const nextInterval = getRandomPopupInterval();
    sendPopupNotification();
    userState.lastPopupTime = now;
    userState.nextPopupTime = now + nextInterval; // Schedule next popup
  }

  // Check for new message from lil ivr and set exclamation mark (every 1-10 minutes, only when page visible and focused)
  if (!userState.popupOpen && userState.isPageVisible && (now >= userState.nextExclamationTime)) {
    checkForNewLilIvrMessage();
    userState.nextExclamationTime = now + getRandomExclamationInterval(); // Next check in 1-10 minutes
  }
}, 1000);

// Send popup notifications (every 10 seconds)
async function sendPopupNotification() {
  try {
    const message = getRandomProactiveMessage();

    // Send popup notification to all tabs
    await broadcastToAllTabs({
      action: 'showNotification',
      message: message
    });

  } catch (error) {
  }
}

// Send chat messages with song links (every 2 minutes)
async function sendChatMessage() {
  try {
    // Get random message from backend (includes song links)
    const response = await fetch(`${API_BASE_URL}/random-message`);
    if (response.ok) {
      const data = await response.json();

      // Store the notification message for chat to show
      await chrome.storage.session.set({
        'lilIVRNotification': {
          message: data.message,
          timestamp: Date.now()
        }
      });

      userState.lastNotificationTime = Date.now();
    }
  } catch (error) {
  }
}

// New function to check for new messages from lil ivr
async function checkForNewLilIvrMessage() {
  try {
    // Get random message from backend (includes song links)
    const response = await fetch(`${API_BASE_URL}/random-message`);
    if (response.ok) {
      const data = await response.json();

      // Check if this is a new message (different from last one)
      if (userState.lastExclamationMessage !== data.message) {
        userState.lastExclamationMessage = data.message;
        userState.hasUnreadNotification = true;

        // Store the notification message for chat to show
        await chrome.storage.session.set({
          'lilIVRNotification': {
            message: data.message,
            timestamp: Date.now()
          }
        });

        updateNotificationBadge();
      } else {
      }
    }
  } catch (error) {
  }
}

function updateNotificationBadge() {
  try {
    if (userState.hasUnreadNotification) {
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' }); // Blue instead of red
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (error) {
  }
}

async function sendProactiveMessage() {
  // Keep old function for compatibility but not used in new system
}

// Handle extension icon click - open chat directly
chrome.action.onClicked.addListener(async (tab) => {
  userState.lastActiveTime = Date.now();
  userState.isActive = true;

  try {
    // Send message to content script to open chat
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'openChat'
    });
  } catch (error) {

    // If content script is not ready, try to inject it
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      // Try again after injection
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'openChat' });
        } catch (e) {
        }
      }, 500);
    } catch (injectError) {
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
  } else if (request.action === 'popupClosed') {
    userState.popupOpen = false;
  } else if (request.action === 'popupPing') {
    // Keep popup alive signal
    userState.lastPopupPing = Date.now();
    sendResponse({ status: 'ok' });
  } else if (request.action === 'pageVisibilityChanged') {
    userState.isPageVisible = request.isVisible;
  } else if (request.action === 'getNotificationState') {
    sendResponse({
      hasUnreadNotification: userState.hasUnreadNotification,
      notificationSent: userState.notificationSent
    });
  } else if (request.action === 'openExtensionPopup') {
    // Note: Cannot programmatically open extension popup in manifest v3
    // User needs to click the extension icon manually
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
  }
}

