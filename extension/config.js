// Configuration for Lil IVR Bot
const CONFIG = {
  // Backend API URL - change this when deploying to production
  API_BASE_URL: 'http://localhost:8000',

  // For production deployment, uncomment the line below and comment out the localhost line:
  // API_BASE_URL: 'https://your-app-name.onrender.com',

  // Development mode flag
  DEV_MODE: true
};

// Make config available globally
window.LIL_IVR_CONFIG = CONFIG;