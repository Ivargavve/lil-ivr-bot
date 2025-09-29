// Lil IVR Bot - Vanilla JS version for Chrome Extension
(function() {
  'use strict';

  const API_BASE_URL = 'http://localhost:8000';

  // State management
  let isVisible = true;
  let isMinimized = true; // Start minimized by default
  let messages = [];
  let isTyping = false;
  let isLoading = false;
  let lastActiveTime = Date.now();
  let chatbotContainer = null;
  let initialGreetingSent = false;
  let isPageVisible = true; // Track if page is visible/focused
  let hasUnreadNotification = false; // Track if there's an unread notification
  let notificationSent = false; // Track if notification has been sent in current cycle

  // Create the chatbot UI
  function createChatbotUI() {
    if (document.getElementById('lil-ivr-chatbot')) {
      return;
    }

    chatbotContainer = document.createElement('div');
    chatbotContainer.id = 'lil-ivr-chatbot';
    chatbotContainer.className = 'lil-ivr-chatbot';
    chatbotContainer.style.pointerEvents = 'auto';

    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('chatbot.css');
    document.head.appendChild(link);

    updateChatbotUI();

    const root = document.getElementById('lil-ivr-chatbot-root');
    if (root) {
      root.appendChild(chatbotContainer);
    }

    // Setup proactive messaging
    setupProactiveMessaging();

  }

  function updateChatbotUI() {
    if (!chatbotContainer) return;

    if (isMinimized) {
      chatbotContainer.innerHTML = `
        <div class="chatbot-minimized" onclick="window.lilIvrToggleMinimize()">
          <div class="profile-pic" style="width: 40px; height: 40px; font-size: 18px;">🎤</div>
        </div>
      `;
    } else {
      chatbotContainer.innerHTML = `
        <div class="chatbot-expanded">
          <div class="chatbot-header">
            <div class="header-info">
              <div class="header-profile-pic">🎤</div>
              <div class="header-text">
                <p class="bot-name">Lil IVR</p>
                <p class="bot-status">🎤 Rapper & AI Assistant</p>
              </div>
            </div>
            <div>
              <button class="minimize-btn" onclick="window.lilIvrToggleMinimize()">−</button>
              <button class="close-btn" onclick="window.lilIvrCloseChatbot()">×</button>
            </div>
          </div>

          <div class="chat-messages" id="chat-messages">
            ${renderMessages()}
          </div>

          <div class="chat-input-area">
            <div class="chat-input-container">
              <input
                type="text"
                id="chat-input"
                placeholder="Skriv till Lil IVR..."
                class="chat-input"
                ${isLoading ? 'disabled' : ''}
              />
              <button
                type="button"
                class="send-btn"
                onclick="window.lilIvrHandleSendMessage()"
                ${isLoading ? 'disabled' : ''}
              >➤</button>
            </div>
          </div>
        </div>
      `;

      // Add enter key listener
      const input = document.getElementById('chat-input');
      if (input) {
        input.addEventListener('keypress', function(e) {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            window.lilIvrHandleSendMessage();
          }
        });

        // Focus input when opening
        setTimeout(() => input.focus(), 100);
      }

      scrollToBottom();
    }
  }

  function renderMessages() {
    let html = '';

    for (const message of messages) {
      if (message.isBot) {
        html += `
          <div class="message bot">
            <div class="message-avatar" style="width: 25px; height: 25px; font-size: 12px;">🎤</div>
            <div class="message-bubble">
              ${formatBotMessage(message)}
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="message user">
            <div class="message-bubble">${escapeHtml(message.text)}</div>
            <div class="message-avatar user-avatar">U</div>
          </div>
        `;
      }
    }

    if (isTyping) {
      html += `
        <div class="message bot">
          <div class="message-avatar" style="width: 25px; height: 25px; font-size: 12px;">🎤</div>
          <div class="message-bubble">
            <div class="typing-indicator">
              Lil IVR skriver...
              <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return html;
  }

  function formatBotMessage(message) {
    let text = escapeHtml(message.text);

    if (message.includesLyric && message.lyricLine) {
      const lyricText = `Btw, från min senaste track: '${message.lyricLine}' 🎤`;
      text = text.replace(lyricText, `<div class="lyric-highlight">${lyricText}</div>`);
    }

    return text;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function scrollToBottom() {
    setTimeout(() => {
      const messagesContainer = document.getElementById('chat-messages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  }

  async function analyzeWebpage() {
    if (initialGreetingSent) return;

    try {
      const pageContext = window.lilIvrGetPageContext ? window.lilIvrGetPageContext() : null;
      let htmlContent = '';

      if (pageContext) {
        htmlContent = `${pageContext.title} ${pageContext.headings} ${pageContext.description}`;
      } else {
        htmlContent = document.title + ' ' + document.documentElement.innerText.substring(0, 500);
      }

      const response = await fetch(`${API_BASE_URL}/analyze-webpage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html_content: htmlContent
        })
      });

      if (response.ok) {
        const data = await response.json();
        addMessage(data.greeting, true);
        initialGreetingSent = true;
      } else {
        addMessage('Heyyo skibidi toe! Vad kan jag hjälpa dig med idag? 🎤', true);
        initialGreetingSent = true;
      }
    } catch (error) {
      addMessage('Heyyo skibidi toe! Vad kan jag hjälpa dig med idag? 🎤', true);
      initialGreetingSent = true;
    }
  }

  async function sendMessage(messageText, webpageContext = null) {
    if (!messageText.trim() && !webpageContext) return;

    // Prepare conversation history BEFORE adding current message
    const conversationHistory = messages.map(msg => ({
      role: msg.isBot ? 'assistant' : 'user',
      content: msg.text
    }));

    addMessage(messageText || "Hej!", false);
    setTyping(true);
    setLoading(true);

    try {

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText || "Hej!",
          webpage_context: webpageContext,
          conversation_history: conversationHistory
        })
      });

      if (response.ok) {
        const data = await response.json();

        setTimeout(() => {
          addMessage(data.response, true, data.includes_lyric, data.lyric_line);
          setTyping(false);
          setLoading(false);
        }, 1000 + Math.random() * 1000);
      } else {
        throw new Error('Server error');
      }
    } catch (error) {
      setTimeout(() => {
        addMessage("Asså bror, något gick fel med servern! 😅 Kan du testa igen?", true);
        setTyping(false);
        setLoading(false);
      }, 1000);
    }
  }

  function addMessage(text, isBot, includesLyric = false, lyricLine = null) {
    const message = {
      id: Date.now() + Math.random(),
      text: text,
      isBot: isBot,
      timestamp: new Date(),
      includesLyric: includesLyric,
      lyricLine: lyricLine
    };

    messages.push(message);
    updateChatbotUI();
  }

  function setTyping(typing) {
    isTyping = typing;
    updateChatbotUI();
  }

  function setLoading(loading) {
    isLoading = loading;
    updateChatbotUI();
  }

  function setMinimized(minimized) {
    isMinimized = minimized;
    updateChatbotUI();

    // Send chat status to content script
    window.postMessage({
      type: 'LIL_IVR_CHAT_STATUS',
      isOpen: !minimized && isVisible
    }, '*');

    // If opening chat, reset timer and clear notifications
    if (!minimized) {
      lastActiveTime = Date.now();
      notificationSent = false;
      hasUnreadNotification = false;
      updateNotificationBadge();
    }

    // If opening chat for first time, send greeting
    if (!minimized && !initialGreetingSent) {
      setTimeout(() => analyzeWebpage(), 500);
    }
  }

  function setVisible(visible) {
    isVisible = visible;
    if (chatbotContainer) {
      chatbotContainer.style.display = visible ? 'block' : 'none';
    }

    // Send chat status to content script
    window.postMessage({
      type: 'LIL_IVR_CHAT_STATUS',
      isOpen: !isMinimized && visible
    }, '*');
  }

  function setupProactiveMessaging() {
    // Track user activity
    const updateActivity = () => {
      lastActiveTime = Date.now();
      chrome.runtime.sendMessage({ action: 'updateActivity' });
    };

    // Track page visibility to prevent popups when alt-tabbed
    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
    };

    document.addEventListener('click', updateActivity);
    document.addEventListener('keypress', updateActivity);
    document.addEventListener('scroll', updateActivity);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listen for proactive messages and direct open commands
    window.addEventListener('message', (event) => {
      if (event.data.type === 'LIL_IVR_PROACTIVE_MESSAGE') {
        addMessage(event.data.message, true);
        setMinimized(false);
        setVisible(true);
      } else if (event.data.type === 'LIL_IVR_OPEN_CHAT') {
        setVisible(true);
        setMinimized(false);
      }
    });

    // Check for inactivity and send notifications
    const inactivityInterval = setInterval(() => {
      const now = Date.now();
      const inactiveTime = now - lastActiveTime;

      // Send notification after 10 minutes of inactivity (only once per cycle)
      if (inactiveTime > 10 * 60 * 1000 && isMinimized && isPageVisible && !notificationSent) {
        showRandomMessage();
        notificationSent = true;
        hasUnreadNotification = true;
        updateNotificationBadge();
      }
    }, 60000); // Check every minute

    // Show popup messages at random intervals (30-90 seconds) if there's an unread notification
    let popupTimer = null;

    function scheduleNextPopup() {
      if (popupTimer) {
        clearTimeout(popupTimer);
        popupTimer = null;
      }

      if (hasUnreadNotification && isMinimized && isPageVisible) {
        const randomDelay = (30 + Math.random() * 60) * 1000; // 30-90 seconds

        popupTimer = setTimeout(() => {
          if (hasUnreadNotification && isMinimized && isPageVisible) {
            showRandomMessage();
            scheduleNextPopup(); // Schedule the next one
          }
        }, randomDelay);
      }
    }

    // Start the popup cycle
    scheduleNextPopup();

    // Reschedule when conditions change
    const popupInterval = setInterval(() => {
      if (hasUnreadNotification && isMinimized && isPageVisible && !popupTimer) {
        scheduleNextPopup();
      } else if ((!hasUnreadNotification || !isMinimized || !isPageVisible) && popupTimer) {
        clearTimeout(popupTimer);
        popupTimer = null;
      }
    }, 5000); // Check every 5 seconds

    // Cleanup function for when chatbot is closed
    window.lilIvrCleanup = function() {
      clearInterval(inactivityInterval);
      clearInterval(popupInterval);
      if (popupTimer) {
        clearTimeout(popupTimer);
        popupTimer = null;
      }
      document.removeEventListener('click', updateActivity);
      document.removeEventListener('keypress', updateActivity);
      document.removeEventListener('scroll', updateActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }

  function updateNotificationBadge() {
    try {
      if (hasUnreadNotification) {
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
      } else {
        chrome.action.setBadgeText({ text: '' });
      }
    } catch (error) {
    }
  }

  async function showRandomMessage() {
    try {
      const response = await fetch(`${API_BASE_URL}/random-message`);
      if (response.ok) {
        const data = await response.json();
        addMessage(data.message, true);
        setMinimized(false);
        setVisible(true);
      }
    } catch (error) {
    }
  }

  // Global functions for UI interactions
  window.lilIvrToggleMinimize = function() {
    setMinimized(!isMinimized);
    lastActiveTime = Date.now();
  };

  window.lilIvrCloseChatbot = function() {
    setVisible(false);
    // Cleanup resources when closing
    if (window.lilIvrCleanup) {
      window.lilIvrCleanup();
    }
  };

  window.lilIvrHandleSendMessage = function() {
    const input = document.getElementById('chat-input');
    if (input && input.value.trim() && !isLoading) {
      sendMessage(input.value);
      input.value = '';
    }
  };

  window.lilIvrOpenChat = function() {
    setVisible(true);
    setMinimized(false);
  };

  // Listen for messages from content script and background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.action === 'toggleChatbot' || request.action === 'openChat') {
      setVisible(true);
      setMinimized(false);
    } else if (request.action === 'showProactiveMessage') {
      addMessage(request.message, true);
      setMinimized(false);
      setVisible(true);
    }

    sendResponse({success: true});
  });

  // Initialize the chatbot
  createChatbotUI();

  // Fallback: Make sure chatbot is created after a delay
  setTimeout(() => {
    if (!document.getElementById('lil-ivr-chatbot')) {
      createChatbotUI();
    }
  }, 1000);

})();