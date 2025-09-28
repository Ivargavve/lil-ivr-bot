# Deployment Guide for Lil IVR Bot

## Backend Deployment to Render

### Step 1: Prepare for Deployment
1. Create a [Render account](https://render.com) (free tier available)
2. Push your code to a GitHub repository (if not already done)

### Step 2: Deploy Backend to Render
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `lil-ivr-bot-backend` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Step 3: Set Environment Variables
In Render service settings, add:
- **Key**: `OPENAI_API_KEY`
- **Value**: Your OpenAI API key

### Step 4: Update Extension Configuration
After deployment, Render will give you a URL like: `https://lil-ivr-bot-backend.onrender.com`

Update the configuration:

**For Production Extension:**
1. Edit `extension/config.js`:
   ```javascript
   const CONFIG = {
     // Comment out localhost and use your Render URL:
     // API_BASE_URL: 'http://localhost:8000',
     API_BASE_URL: 'https://your-app-name.onrender.com',
     DEV_MODE: false
   };
   ```

2. Also update `extension/background.js`:
   ```javascript
   const API_BASE_URL = 'https://your-app-name.onrender.com';
   ```

### Step 5: Build Production Extension
```bash
npm run build
```

## Chrome Extension Distribution

### Option 1: Chrome Web Store (Recommended)
1. Create [Chrome Web Store Developer account](https://chrome.google.com/webstore/devconsole/) ($5 fee)
2. Zip the `dist/` folder
3. Upload to Chrome Web Store
4. Fill out store listing (description, screenshots, etc.)
5. Submit for review (1-7 days)

**Before submitting:**
- Add proper icon files (16x16, 48x48, 128x128 PNG) in `dist/assets/`
- Consider reducing permissions if possible (review `<all_urls>`)
- Test thoroughly with production backend

### Option 2: GitHub Releases
1. Create a GitHub release
2. Attach the `dist.zip` file
3. Users download and install manually

### Option 3: Direct Distribution
1. Zip the `dist/` folder
2. Share directly with users
3. Users install via Chrome Developer Mode

## Important Notes

### Free Tier Limitations
- Render free tier: services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- Consider upgrading for production use

### CORS Configuration
The backend is already configured with permissive CORS for extension compatibility.

### API Rate Limits
- Monitor OpenAI API usage and costs
- Consider implementing rate limiting for production

## Testing the Deployment

1. Deploy backend to Render
2. Update extension config with Render URL
3. Build extension: `npm run build`
4. Load extension in Chrome developer mode
5. Test all functionality:
   - Chat interface
   - Popup notifications
   - Badge notifications

## Troubleshooting

**Extension can't connect to backend:**
- Check the URL in config.js matches your Render deployment
- Verify CORS is enabled in backend
- Check browser console for errors

**Backend not responding:**
- Check Render logs for errors
- Verify environment variables are set
- Ensure OpenAI API key is valid

**Popup notifications not working:**
- Check content script injection
- Verify API calls in network tab
- Check extension permissions