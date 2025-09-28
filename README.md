# Lil IVR Bot Chrome Extension

A goofy Swedish SoundCloud rapper chatbot Chrome extension that helps users on any webpage with a fun, musical personality!

## Features

- 🎤 **Swedish Rapper Personality**: Lil IVR speaks only Swedish with rapper slang and goofy expressions
- 🌐 **Webpage Context Analysis**: Automatically analyzes the current page and greets users contextually
- 💬 **Interactive Chat**: Full conversation capabilities powered by OpenAI GPT-4 mini
- 🎵 **Random Song Lyrics**: Occasionally shares lines from fake Swedish rap tracks
- ⏰ **Proactive Messaging**: Auto-messages after periods of inactivity
- 🎨 **Modern Dark Theme**: Sleek dark mode with transparency and blur effects
- 📱 **Minimizable Interface**: Floats in bottom-right corner, minimizes to icon

## Project Structure

```
lil-ivr-bot/
├── backend/                 # FastAPI server
│   ├── main.py             # Main API server
│   ├── requirements.txt    # Python dependencies
│   └── song_lyrics.txt     # Mock Swedish rap lyrics
├── extension/              # Chrome extension files
│   ├── manifest.json       # Extension manifest (Manifest V3)
│   ├── background.js       # Service worker for proactive messaging
│   ├── content.js          # Content script for webpage injection
│   ├── chatbot-app.js      # Main chatbot application (vanilla JS)
│   ├── chatbot.css         # Dark mode styling with transparency
│   ├── popup.html          # Extension popup interface
│   ├── popup.js            # Popup functionality
│   └── assets/             # Extension icons (add manually)
├── testing/                # Test files and validation scripts
├── .env                    # OpenAI API key
├── .gitignore              # Git ignore file
└── CLAUDE.md               # Claude Code configuration
```

## Setup Instructions

### 1. Backend Setup (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

### 2. Chrome Extension Installation

First build the extension:
```bash
npm run build
```

Then load in Chrome:
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist/` directory (created by build)
5. The extension will be loaded and active on all websites

### 3. Testing (Optional)

To run validation tests:

```bash
npm test
```

## API Endpoints

- `POST /chat` - Send message to Lil IVR
- `POST /analyze-webpage` - Analyze webpage content for context
- `GET /random-message` - Get random proactive message

## Character Personality

Lil IVR has these characteristics:
- Only speaks Swedish
- Uses expressions like "Heyyo skibidi toe", "bror", "asså", "typ"
- Mixes Swedish with English rapper terms
- Always helpful but goofy
- References fake music career and studio time
- Uses emojis: 🎤🔥💯

## Usage

1. **Direct Activation**: Click the Lil IVR Bot extension icon in Chrome toolbar to open chat instantly
2. **Floating Icon**: The bot appears as a minimized icon in bottom-right corner on all websites
3. **Chat Interface**: Click the floating icon or extension icon to open full chat
4. **Minimize/Maximize**: Use the minimize button (-) to shrink to icon
5. **Close**: Use the X button to hide completely
6. **Proactive Messages**: After 10 minutes of inactivity, Lil IVR will message you

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### Swedish Rap Lyrics

Edit `backend/song_lyrics.txt` to customize the rap lyrics that Lil IVR occasionally shares.

## Troubleshooting

### Common Issues

1. **Chatbot not appearing**: Check if the extension is enabled and backend is running
2. **API errors**: Verify OpenAI API key in `.env` file
3. **CORS issues**: Backend includes CORS middleware for Chrome extensions
4. **Styling issues**: Ensure `chatbot.css` is loaded properly

### Backend Connection

The extension expects the backend at `http://localhost:8000`. If you run it elsewhere, update the `API_BASE_URL` in:
- `extension/chatbot-app.js`

## Development Tips

- Test the extension on different websites to ensure compatibility
- Monitor browser console for errors
- Use Chrome DevTools to debug the extension
- Backend logs are visible in the terminal running uvicorn

## Character Examples

Typical Lil IVR responses:
- "Heyyo skibidi toe, behöver du hjälp med denna sida? 🎤"
- "Asså bror, det där är en bra fråga! 🔥"
- "Btw, från min senaste track: 'Studio sessions, jag lever för beats' 🎤"

## Extension Permissions

The extension requires:
- `activeTab`: To access current webpage content
- `storage`: To save chat history and preferences
- `scripting`: To inject the chatbot into webpages

## License

This is a demonstration project. Feel free to modify and extend!

---

🎤 Built with love by the Lil IVR Bot team! Skibidi vibes! 🔥💯