// Lil IVR Bot Content Script
console.log('Lil IVR Bot: Content script loaded!');

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
  script.onload = function() {
    console.log('Lil IVR Bot: React app loaded!');
  };
  document.head.appendChild(script);

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Lil IVR Bot: Content script received message:', request);

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

  console.log('Lil IVR Bot: Successfully injected into page!');
}