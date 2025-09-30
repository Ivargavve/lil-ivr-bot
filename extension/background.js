const API_BASE_URL = 'https://lil-ivr-bot.onrender.com';

let userState = {
  lastActiveTime: Date.now(),
  lastNotificationTime: 0,
  isActive: true,
  popupOpen: false,
  lastPopupPing: 0,
  hasUnreadNotification: false,
  notificationSent: false,
  isPageVisible: true,
  lastPopupTime: Date.now(),
  lastChatMessage: Date.now(),
  nextPopupTime: Date.now() + getRandomPopupInterval(),
  lastChatOpened: Date.now(),
  nextExclamationTime: Date.now() + getRandomExclamationInterval(),
  lastExclamationMessage: null
};

function getRandomPopupInterval() {
  return (Math.random() * 35 + 5) * 1000; // 5-40 seconds
}

function getRandomExclamationInterval() {
  return (Math.random() * 240 + 60) * 1000; // 60-300 seconds (1-5 minutes)
}

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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    userState.lastActiveTime = Date.now();
    userState.isActive = true;
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  userState.lastActiveTime = Date.now();
  userState.isActive = true;
});

setInterval(() => {
  const now = Date.now();

  if (userState.popupOpen && (now - userState.lastPopupPing > 3000)) {
    userState.popupOpen = false;
    broadcastToAllTabs({ action: 'popupStatusChanged', isOpen: false });
  }

  if (!userState.popupOpen && userState.isPageVisible && userState.hasUnreadNotification && (now >= userState.nextPopupTime)) {
    const nextInterval = getRandomPopupInterval();
    sendPopupNotification();
    userState.lastPopupTime = now;
    userState.nextPopupTime = now + nextInterval;
  }

  if (!userState.popupOpen && userState.isPageVisible && (now >= userState.nextExclamationTime)) {
    checkForNewLilIvrMessage();
    userState.nextExclamationTime = now + getRandomExclamationInterval();
  }
}, 1000);

async function sendPopupNotification() {
  try {
    const message = getRandomProactiveMessage();
    await broadcastToAllTabs({
      action: 'showNotification',
      message: message
    });
  } catch (error) {
  }
}

async function sendChatMessage() {
  try {
    const response = await fetch(`${API_BASE_URL}/random-message`);
    if (response.ok) {
      const data = await response.json();
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

async function checkForNewLilIvrMessage() {
  try {
    const response = await fetch(`${API_BASE_URL}/random-message`);
    if (response.ok) {
      const data = await response.json();
      userState.lastExclamationMessage = data.message;
      userState.hasUnreadNotification = true;
      await chrome.storage.session.set({
        'lilIVRNotification': {
          message: data.message,
          timestamp: Date.now()
        }
      });
      updateNotificationBadge();
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

