// Lil IVR Bot Background Service Worker

console.log('Lil IVR Bot: Background script started!');

// Store user activity and proactive message state
let userState = {
  lastActiveTime: Date.now(),
  lastProactiveMessage: 0,
  isActive: true
};

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

// Check for inactivity and send proactive messages
setInterval(() => {
  const now = Date.now();
  const inactiveTime = now - userState.lastActiveTime;
  const timeSinceLastProactive = now - userState.lastProactiveMessage;

  // 10 minutes of inactivity and at least 1 hour since last proactive message
  if (inactiveTime > 10 * 60 * 1000 && timeSinceLastProactive > 60 * 60 * 1000) {
    sendProactiveMessage();
  }
}, 60000); // Check every minute

async function sendProactiveMessage() {
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab) {
      const message = getRandomProactiveMessage();

      // Send message to content script
      chrome.tabs.sendMessage(tab.id, {
        action: 'showProactiveMessage',
        message: message
      });

      userState.lastProactiveMessage = Date.now();
      console.log('Lil IVR Bot: Sent proactive message:', message);
    }
  } catch (error) {
    console.error('Lil IVR Bot: Error sending proactive message:', error);
  }
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

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateActivity') {
    userState.lastActiveTime = Date.now();
    userState.isActive = true;
  }
});

console.log('Lil IVR Bot: Background script ready!');