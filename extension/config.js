// Configuration for Lil IVR Bot
const CONFIG = {
  // Backend API URL - change this when deploying to production
  // API_BASE_URL: 'http://localhost:8000',

  // For production deployment, uncomment the line below and comment out the localhost line:
  API_BASE_URL: 'https://lil-ivr-bot.onrender.com',

  // Development mode flag
  DEV_MODE: false
};

// Make config available globally
window.LIL_IVR_CONFIG = CONFIG;