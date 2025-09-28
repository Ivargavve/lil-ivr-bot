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

  // Create the chatbot UI
  function createChatbotUI() {
    if (document.getElementById('lil-ivr-chatbot')) {
      console.log('🎤 Chatbot already exists');
      return;
    }

    console.log('🎤 Creating chatbot UI...');
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

    console.log('🎤 Lil IVR Bot: Chatbot UI created');
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
      console.error('Error analyzing webpage:', error);
      addMessage('Heyyo skibidi toe! Vad kan jag hjälpa dig med idag? 🎤', true);
      initialGreetingSent = true;
    }
  }

  async function sendMessage(messageText, webpageContext = null) {
    if (!messageText.trim() && !webpageContext) return;

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
          webpage_context: webpageContext
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
      console.error('Error sending message:', error);
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
  }

  function setupProactiveMessaging() {
    // Track user activity
    const updateActivity = () => {
      lastActiveTime = Date.now();
      chrome.runtime.sendMessage({ action: 'updateActivity' });
    };

    document.addEventListener('click', updateActivity);
    document.addEventListener('keypress', updateActivity);
    document.addEventListener('scroll', updateActivity);

    // Listen for proactive messages and direct open commands
    window.addEventListener('message', (event) => {
      if (event.data.type === 'LIL_IVR_PROACTIVE_MESSAGE') {
        addMessage(event.data.message, true);
        setMinimized(false);
        setVisible(true);
      } else if (event.data.type === 'LIL_IVR_OPEN_CHAT') {
        console.log('🎤 Received open chat message');
        setVisible(true);
        setMinimized(false);
      }
    });

    // Check for inactivity
    const inactivityInterval = setInterval(() => {
      const now = Date.now();
      const inactiveTime = now - lastActiveTime;

      if (inactiveTime > 10 * 60 * 1000 && isMinimized) {
        showRandomMessage();
      }
    }, 60000);

    // Cleanup function for when chatbot is closed
    window.lilIvrCleanup = function() {
      clearInterval(inactivityInterval);
      document.removeEventListener('click', updateActivity);
      document.removeEventListener('keypress', updateActivity);
      document.removeEventListener('scroll', updateActivity);
    };
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
      console.error('Error getting random message:', error);
    }
  }

  // Global functions for UI interactions
  window.lilIvrToggleMinimize = function() {
    setMinimized(!isMinimized);
    lastActiveTime = Date.now();
    console.log('🎤 Toggled chat, minimized:', isMinimized);
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
    console.log('🎤 Chat opened directly');
  };

  // Listen for messages from content script and background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('🎤 Received message:', request);

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
      console.log('🎤 Chatbot not found, creating fallback...');
      createChatbotUI();
    }
  }, 1000);

  console.log('🎤 Lil IVR Bot: Chatbot app initialized!');
})();