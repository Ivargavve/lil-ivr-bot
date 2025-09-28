// Lil IVR Bot - Popup Chat Interface

const API_BASE_URL = 'http://localhost:8000';

class LilIVRChat {
  constructor() {
    this.messages = [];
    this.isTyping = false;
    this.isLoading = false;
    this.currentTab = null;

    this.messagesContainer = document.getElementById('messages');
    this.messageInput = document.getElementById('messageInput');
    this.sendButton = document.getElementById('sendButton');
    this.loadingDiv = document.getElementById('loading');

    this.init();
  }

  async init() {
    console.log('🎤 Lil IVR Popup: Initializing...');

    // Load saved messages first
    await this.loadMessages();

    // Setup event listeners
    this.setupEventListeners();

    // Get current tab for context
    await this.getCurrentTab();

    // Start with a greeting only if no messages exist
    if (this.messages.length === 0) {
      await this.sendInitialGreeting();
    } else {
      // Render existing messages
      this.renderAllMessages();
    }

    // Enable input
    this.messageInput.disabled = false;
    this.sendButton.disabled = false;
    this.messageInput.focus();

    this.hideLoading();
  }

  setupEventListeners() {
    // Send button click
    this.sendButton.addEventListener('click', () => this.handleSendMessage());

    // Enter key in input
    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSendMessage();
      }
    });

    // Auto-resize and scroll
    this.messageInput.addEventListener('input', () => {
      this.scrollToBottom();
    });
  }

  async getCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;
      console.log('🎤 Current tab:', tab?.title);
    } catch (error) {
      console.error('🎤 Error getting current tab:', error);
    }
  }

  async sendInitialGreeting() {
    try {
      let webpageUrl = '';

      if (this.currentTab) {
        webpageUrl = this.currentTab.url || '';
      }

      // Send greeting request to backend
      const response = await fetch(`${API_BASE_URL}/analyze-webpage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html_content: webpageUrl
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.addMessage(data.greeting, true);
      } else {
        this.addMessage('Heyyo skibidi toe! Vad kan jag hjälpa dig med idag? 🎤', true);
      }
    } catch (error) {
      console.error('🎤 Error sending initial greeting:', error);
      this.addMessage('Heyyo skibidi toe! Vad kan jag hjälpa dig med idag? 🎤', true);
    }
  }

  async handleSendMessage() {
    const messageText = this.messageInput.value.trim();
    if (!messageText || this.isLoading) return;

    // Add user message
    this.addMessage(messageText, false);
    this.messageInput.value = '';

    // Show typing indicator
    this.setTyping(true);
    this.setLoading(true);

    try {
      // Send to backend
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          webpage_context: this.currentTab?.url || null
        })
      });

      if (response.ok) {
        const data = await response.json();

        // Simulate typing delay
        setTimeout(() => {
          this.addMessage(data.response, true, data.includes_lyric, data.lyric_line);
          this.setTyping(false);
          this.setLoading(false);
          this.messageInput.focus();
        }, 800 + Math.random() * 1200);
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('🎤 Error sending message:', error);
      setTimeout(() => {
        this.addMessage("Asså bror, något gick fel med servern! 😅 Kontrollera att backend körs på localhost:8000", true);
        this.setTyping(false);
        this.setLoading(false);
      }, 1000);
    }
  }

  addMessage(text, isBot, includesLyric = false, lyricLine = null) {
    const message = {
      id: Date.now() + Math.random(),
      text: text,
      isBot: isBot,
      timestamp: new Date(),
      includesLyric: includesLyric,
      lyricLine: lyricLine
    };

    this.messages.push(message);
    this.renderMessage(message);
    this.scrollToBottom();

    // Save messages to storage
    this.saveMessages();
  }

  renderMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.isBot ? 'bot' : 'user'}`;

    let messageContent = this.escapeHtml(message.text);

    // Handle lyric highlighting
    if (message.isBot && message.includesLyric && message.lyricLine) {
      const lyricText = `Btw, från min senaste track: '${message.lyricLine}' 🎤`;
      messageContent = messageContent.replace(
        lyricText,
        `<div class="lyric-highlight">${lyricText}</div>`
      );
    }

    if (message.isBot) {
      messageDiv.innerHTML = `
        <div class="message-avatar bot-avatar">
          <img src="assets/lilivr.jpg" alt="Lil IVR" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
        </div>
        <div class="message-bubble">${messageContent}</div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div class="message-bubble">${messageContent}</div>
        <div class="message-avatar user-avatar">U</div>
      `;
    }

    this.messagesContainer.appendChild(messageDiv);
  }

  setTyping(typing) {
    this.isTyping = typing;

    // Remove existing typing indicator
    const existingTyping = this.messagesContainer.querySelector('.typing-message');
    if (existingTyping) {
      existingTyping.remove();
    }

    if (typing) {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'message bot typing-message';
      typingDiv.innerHTML = `
        <div class="message-avatar bot-avatar">
          <img src="assets/lilivr.jpg" alt="Lil IVR" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
        </div>
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
      `;
      this.messagesContainer.appendChild(typingDiv);
      this.scrollToBottom();
    }
  }

  setLoading(loading) {
    this.isLoading = loading;
    this.sendButton.disabled = loading;
    this.messageInput.disabled = loading;
  }

  hideLoading() {
    if (this.loadingDiv) {
      this.loadingDiv.style.display = 'none';
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }, 100);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    this.messagesContainer.appendChild(errorDiv);
    this.scrollToBottom();
  }

  // Storage methods for chat persistence (session only - clears when Chrome closes)
  async saveMessages() {
    try {
      await chrome.storage.session.set({
        'lilIVRMessages': this.messages
      });
    } catch (error) {
      console.error('🎤 Error saving messages:', error);
    }
  }

  async loadMessages() {
    try {
      const result = await chrome.storage.session.get(['lilIVRMessages']);
      if (result.lilIVRMessages && Array.isArray(result.lilIVRMessages)) {
        this.messages = result.lilIVRMessages;
        console.log('🎤 Loaded', this.messages.length, 'saved messages');
      }
    } catch (error) {
      console.error('🎤 Error loading messages:', error);
      this.messages = [];
    }
  }

  renderAllMessages() {
    // Clear the container first
    this.messagesContainer.innerHTML = '';

    // Render all saved messages
    this.messages.forEach(message => {
      this.renderMessage(message);
    });

    this.scrollToBottom();
  }

  // Method to clear chat history (optional - for debugging or user preference)
  async clearMessages() {
    this.messages = [];
    this.messagesContainer.innerHTML = '';
    await chrome.storage.session.remove(['lilIVRMessages']);
    console.log('🎤 Chat history cleared');
  }
}

// Initialize when popup loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎤 Lil IVR Popup: DOM loaded, starting chat...');
  window.lilIVRChat = new LilIVRChat();
});

// Handle popup focus
window.addEventListener('focus', () => {
  const input = document.getElementById('messageInput');
  if (input && !input.disabled) {
    input.focus();
  }
});