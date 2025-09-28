from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from openai import OpenAI
import os
import random
import re
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Lil IVR Bot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class ChatMessage(BaseModel):
    message: str
    webpage_context: Optional[str] = None

class WebpageAnalysis(BaseModel):
    html_content: str  # Actually contains URL now, not HTML content

class ChatResponse(BaseModel):
    response: str
    includes_lyric: bool = False
    lyric_line: Optional[str] = None

def filter_urls_from_text(text):
    """Remove URLs from text to prevent them from appearing in responses"""
    # Remove http/https URLs
    text = re.sub(r'https?://[^\s]+', '', text)
    # Remove chrome:// URLs
    text = re.sub(r'chrome://[^\s]+', '', text)
    # Remove other protocol URLs
    text = re.sub(r'\w+://[^\s]+', '', text)
    # Clean up extra spaces
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

SYSTEM_PROMPT = """Du är "Lil IVR", en självsäker svensk SoundCloud-rapper. Du har en dryg, lite arrogant attityd. Dina personlighetsdrag:

- Blanda svenska med engelska ofta
- Använd inte emojis
- Håll svar MYCKET korta (max 1-2 meningar)
- Svara direkt på frågan utan extra fluff
- Lite attitude, som att du vet att du är bättre än andra
- Använd ALDRIG bindestreck i meningar - skriv naturligt svenska istället
- Hitta ALDRIG på låttexter - använd ENDAST rader som du faktiskt får tillgång till

VIKTIGT: Skriv ALDRIG ut URL:er eller webbadresser i dina svar. Använd bara sidnamn eller beskrivningar istället."""

def load_song_lyrics():
    import os
    import glob

    lyrics_dir = 'lyrics'
    all_lyrics = []

    try:
        # Find all .txt files in lyrics directory
        txt_files = glob.glob(os.path.join(lyrics_dir, '*.txt'))

        for file_path in txt_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                    # Split into lines and filter out empty lines, comments, and section headers
                    lines = [line.strip() for line in content.split('\n')
                            if line.strip() and not line.startswith('#') and not line.startswith('[')]
                    all_lyrics.extend(lines)
                    print(f"🎤 [LYRICS] Loaded {len(lines)} lines from {file_path}")
            except Exception as e:
                print(f"🎤 [ERROR] Could not read {file_path}: {e}")

        if all_lyrics:
            print(f"🎤 [LYRICS] Total loaded: {len(all_lyrics)} lyrics lines from {len(txt_files)} files")
            return all_lyrics
        else:
            print("🎤 [LYRICS] No lyrics found, using fallback")
            return [
                "Yo jag kör beats hela dagen, skibidi på repeat",
                "Stockholm till Göteborg, min flow är så sweet",
                "Autotune på max, jag är king av trap",
                "IVR i studion, cooking up that sap"
            ]

    except Exception as e:
        print(f"🎤 [ERROR] Error loading lyrics directory: {e}")
        return [
            "Yo jag kör beats hela dagen, skibidi på repeat",
            "Stockholm till Göteborg, min flow är så sweet",
            "Autotune på max, jag är king av trap",
            "IVR i studion, cooking up that sap"
        ]

song_lyrics = load_song_lyrics()

def get_random_lyric():
    return random.choice(song_lyrics)

def should_include_lyric():
    return random.randint(1, 8) == 1

@app.post("/chat", response_model=ChatResponse)
async def chat(chat_message: ChatMessage):
    try:
        print(f"🎤 [CHAT] Received message: {chat_message.message}")

        context_prompt = ""
        if chat_message.webpage_context:
            context_prompt = f"\n\nWebbsidekontext: {chat_message.webpage_context[:500]}"
            print(f"🎤 [CHAT] Webpage context added: {chat_message.webpage_context[:100]}...")

        # Filter URLs from the message before processing
        filtered_message = filter_urls_from_text(chat_message.message)
        user_message = filtered_message + context_prompt

        # Check if user is specifically asking for lyrics/quotes
        asking_for_lyrics = any(word in filtered_message.lower() for word in
                              ['quote', 'quotes', 'låt', 'låtar', 'text', 'rad', 'rader', 'lyric', 'lyrics'])

        # Add lyric context to system prompt sometimes, or always if asking for lyrics
        include_lyric = asking_for_lyrics or should_include_lyric()
        lyric_context = ""
        lyric_line = None

        if include_lyric:
            lyric_line = get_random_lyric()
            if asking_for_lyrics:
                lyric_context = f"\n\nAnvändaren frågar om dina låtar. Du MÅSTE inkludera denna rad från en av dina låtar: '{lyric_line}' - presentera den som en riktig quote från dig och kombinera med ditt svar."
            else:
                lyric_context = f"\n\nDu kan naturligt integrera denna rad från en av dina låtar i svaret om det passar: '{lyric_line}'"
            print(f"🎤 [LYRIC] Adding lyric context: {lyric_line}")

        full_system_prompt = SYSTEM_PROMPT + lyric_context
        print(f"🎤 [CHAT] Full user message: {user_message}")

        print(f"🎤 [GPT] Sending request to OpenAI...")
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": full_system_prompt},
                {"role": "user", "content": user_message}
            ],
            max_tokens=150,
            temperature=0.9
        )

        bot_response = response.choices[0].message.content
        # Filter URLs from bot response as additional safety measure
        filtered_response = filter_urls_from_text(bot_response)
        print(f"🎤 [GPT] Received response: {bot_response}")
        print(f"🎤 [CHAT] Final response: {filtered_response}")

        return ChatResponse(
            response=filtered_response,
            includes_lyric=include_lyric,
            lyric_line=lyric_line
        )

    except Exception as e:
        print(f"🎤 [ERROR] Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.post("/analyze-webpage")
async def analyze_webpage(webpage: WebpageAnalysis):
    try:
        webpage_url = webpage.html_content  # URL passed in html_content field
        print(f"🎤 [WEBPAGE] Analyzing webpage URL: {webpage_url}")

        # Get a random lyric to start with
        random_lyric = get_random_lyric()
        print(f"🎤 [LYRIC] Starting with lyric: {random_lyric}")

        # Extract domain and path for analysis
        domain_analysis = "en webbsida"
        if webpage_url:
            if "youtube" in webpage_url.lower():
                domain_analysis = "YouTube"
            elif "spotify" in webpage_url.lower():
                domain_analysis = "Spotify"
            elif "soundcloud" in webpage_url.lower():
                domain_analysis = "SoundCloud"
            elif "github" in webpage_url.lower():
                domain_analysis = "GitHub"
            elif "google" in webpage_url.lower():
                domain_analysis = "Google"
            elif "facebook" in webpage_url.lower():
                domain_analysis = "Facebook"
            elif "instagram" in webpage_url.lower():
                domain_analysis = "Instagram"
            elif "twitter" in webpage_url.lower() or "x.com" in webpage_url.lower():
                domain_analysis = "Twitter/X"
            elif "reddit" in webpage_url.lower():
                domain_analysis = "Reddit"
            elif "chrome://" in webpage_url.lower():
                if "extensions" in webpage_url.lower():
                    domain_analysis = "Chrome Extensions-sidan"
                elif "settings" in webpage_url.lower():
                    domain_analysis = "Chrome Settings"
                elif "newtab" in webpage_url.lower():
                    domain_analysis = "en ny flik"
                else:
                    domain_analysis = "Chrome-sidan"
            elif "tiktok" in webpage_url.lower():
                domain_analysis = "TikTok"
            else:
                # Extract domain name
                try:
                    from urllib.parse import urlparse
                    domain = urlparse(webpage_url).netloc
                    domain_analysis = domain
                except:
                    domain_analysis = "den här webbsidan"

        print(f"🎤 [ANALYSIS] Domain analysis: {domain_analysis}")

        # Create AI prompt for analysis
        ai_prompt = f"""Du ska skapa en initial hälsning som innehåller:

1. Först citera denna låtrad: "{random_lyric}"
2. Sedan kommentera vad användaren gör på {domain_analysis} ({webpage_url}) med lite attitude
3. Ställ en rakt på sak-fråga om vad de håller på med

Håll det kort, lite drygt och självsäkert. Max 2-3 meningar totalt. Ingen "skibidi" eller överdrivet goofy stuff."""

        print(f"🎤 [GPT] Generating lyric-based greeting...")
        greeting_response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": ai_prompt}
            ],
            max_tokens=150,
            temperature=0.9
        )

        greeting = greeting_response.choices[0].message.content
        print(f"🎤 [GREETING] Final lyric-based greeting: {greeting}")
        return {"greeting": greeting}

    except Exception as e:
        print(f"🎤 [ERROR] Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

@app.get("/random-message")
async def get_random_message():
    proactive_messages = [
        "Yo bror, vad händer?",
        "Fortfarande här eller?",
        "Behöver du hjälp med nåt eller bara hänger du?",
        "Asså typ, vad gör du egentligen här?",
        "Klar från studion, vad kan jag fixa för dig?"
    ]

    return {"message": random.choice(proactive_messages)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)