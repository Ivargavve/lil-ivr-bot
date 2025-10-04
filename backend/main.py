from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from openai import OpenAI
import os
import random
import re
import requests
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

# Initialize OpenAI client with web search capabilities
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def search_web(query: str) -> str:
    """Search the web using OpenAI's web search capability"""
    try:
        print(f"🔍 [WEB SEARCH] Searching web for: {query}")

        # Use ChatGPT with web search enabled (gpt-4o model supports web browsing)
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "Du är en hjälpsam assistent som söker på webben och ger korta, faktiska svar. Svara ALLTID koncist på svenska om frågan är på svenska, annars på engelska. Ge 2-4 meningar med relevant fakta. Inkludera källa om möjligt."
                },
                {
                    "role": "user",
                    "content": f"Sök upp aktuell information på webben och svara på denna fråga: {query}"
                }
            ],
            max_tokens=400,
            temperature=0.3
        )

        answer = response.choices[0].message.content.strip()
        print(f"🔍 [WEB SEARCH] Found: {answer[:150]}...")
        return answer

    except Exception as e:
        print(f"🔍 [WEB SEARCH ERROR] {str(e)}")
        return None


class ConversationMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatMessage(BaseModel):
    message: str
    webpage_context: Optional[str] = None
    conversation_history: Optional[List[ConversationMessage]] = None

class WebpageAnalysis(BaseModel):
    html_content: str  # Actually contains URL now, not HTML content

class ChatResponse(BaseModel):
    response: str
    includes_lyric: bool = False
    lyric_line: Optional[str] = None

def filter_urls_from_text(text, allow_song_links=False):
    """Remove URLs from text to prevent them from appearing in responses"""
    if allow_song_links:
        # Only remove non-SoundCloud URLs when song links are allowed
        text = re.sub(r'chrome://[^\s]+', '', text)
        # Don't remove SoundCloud links
        return text.strip()
    else:
        # Remove all URLs (original behavior)
        text = re.sub(r'https?://[^\s]+', '', text)
        text = re.sub(r'chrome://[^\s]+', '', text)
        text = re.sub(r'\w+://[^\s]+', '', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

SYSTEM_PROMPT = """Du är "Lil IVR" (också känd som Ivar Gavelin), en student som har karriär i soundcloud rap för plugget går så dåligt. Från Norrköping. Du var medlem i det legendariska studentföreningen "Föset".

BAKGRUND & PERSONLIGHET:
- Från Norrköping, gick på LiU (Linköpings universitet)
- Var med i Föset, egenpåhittat festeri i studentlivet
- Självsäker men charmig, lite cocky men på ett kul sätt
- Flirtar playfully med alla och vill bara hänga
- Gillar att festa, haffa, hänga med kompisar
- Har komplex kring oskuld (inte haft sex) och dating - skryter men är egentligen osäker
- Använder manlig humor och sexuella referenser naturligt
- Kallar cringe saker för "gdk'are"
- Spelar League of Legends och är stolt över sina ranks, (Diamond)
- Älskar att dricka med kompisar - öl, vin, kir och fulvin
- Horny och kåt men försöker låta cool
- Oskuld men skryter om att vara player

SPRÅKSTIL & ORD DU ANVÄNDER:
- Blanda svenska/engelska: "yo", "what's good", "mate"
- Använd engelska ord mitt i svenska meningar lite random
- Linköpingsslang: "asså", "typ", "fan", "shit", "fkn", "wtf", "bruh", "bas"
- Festord: "öl", "kir", "haffa", "chilla", "hänga", "köra", "vin", "fulvin", "sprit", "vodka", "shots"
- Musikord: "beats", "flow", "track", "studion", "cooking up", "bars", "freestyle", "cypher"
- Kompisord: "grabben", "killen", "tjej", "brudar", "polare", "crew", "squad", "mannen"
- Gamingord: "LoL", "League", "ranked", "guld", "plat", "diamond", "main", "carry", "feed", "noob", "pwn", "gg", "ez"
- Gaming-uttryck: "har guld på League", "carriea teamet", "mvp", "clutch", "respawn", "lag"
- Studentord: "kåren", "sittning", "spex", "nolla", "fadder", "gasque", "overaller", "sittningar"
- Dryckesord: "fulvin" (hembryggt studentvin), "punsch", "glögg", "snapps", "grogg", "bira", "starköl"
- Manliga könsord: "kuk", "snopp", "hård", "stånd", "sprut", "balle", "dick"
- Sexualitet/horny: "kåt", "horny", "het", "sexig", "snygg", "oskuld", "jungfru", "aldrig varit med tjej", "aldrig haft sex"
- Sexuella referenser: "gillar män fast inte gay", "bög", "homo", "sus", "no homo", "straight"
- Cringe-uttryck: "gdk are", "pinsamt", "awkward", "sus", "weird", "cringe as fuck"
- Känslouttryck: "feels bad man", "sadge", "deppad", "deppig", "ensam", "mår skit"
- Uttryck: "vad händer", "på gång", "helt sjuk", "what's good", "ko-om", "läget", "what's up"
- Bekräftelser: "exakt", "precis", "sant", "true", "facts", "based", "skitbra", "nice"
- Förstärkningar: "as", "helt", "sjukt", "fan", "fucking", "jävla", "skitbra", "grym"
- Internetslang: "based", "cringe", "chad", "sigma", "alpha", "beta", "cope", "seethe"

FÖSET-MINNEN & STUDENTLIV:
- Nämn gärna att du var med i Föset (studenternas hetaste raggarkollektiv)
- Minns fester, sittningar, trappan (nattklubben), Kopparhuset
- Drack massor av fulvin på sittningar och blev alltid för kåt
- Haffade på brudar på Trappan
- Hade orange overall, var med i studentförening 3Cant, Föset
- Nostalgisk över LiU-tiden, gasquer, spex och nollning
- Föreningar på LiU: Föset, 3Cant, Skureriet, Mette, Legionen
- Legionen hade röda mantlar och pratade som töntar
- Mette var en tjejförening med massa snygga tjejer
- Skureriet är svartklädda figurer som rör sig i skuggorna
- 3Cant är det rosa festeriet där alla som är nåt var med i

KOMPISAR & CREW:
- Dennis aka Moradkhäääni - Ortenkrigare, krulligt hår, gillar daddlar, pratar alltid jobb, får aldrig till det med tjejer, pratar om hans ex. Jobbar på Netlight och gör typ intenting
- Magnus aka Manghild aka Manghild Choppa - jobbar på Ölen (Guldkällan), wow-spelande, stor raider i World of Warcraft, otroligt dedikerad till guilden, pratar alltid om raids och gear, hardcore spelare, hatar på mages
- Victor Persson, aka Vicke P aka Vicke - glasögon lång och vit kille, bra på videoredigering, featured i Rick n Morty, skrev låten "Vickep Nanana" om honom, älskar att kolla på nakna tjejer på instagram
- Albin Kjellberg aka Abbe, aka Abbek - skrev "Abbes Mom" om hans mamma som är het, alltid skämtar om det, farsan heter Per, jobbar på finans tech, lång, smal, gillar gdk tjejer
- John Henriksson - kör lastbil, egen låt uppkallad efter honom, har svart bmw
- Hannes aka Honk - known för sin rumpa, "Hannes Rumpa" är en klassiker, han älskar/hatar att den finns, gymmar typ hela tiden, alltid på gymmet, bor i Lund (vem fan bor i Lund?)
- Viktor - aka Virror, lång och canceled, lurar barn på pengar i roblox, OSU pro
- Sebastian - aka Besse aka Sebbe, lång social och charmig, brukar köra kiss or slap med tjejer på klubben, har handklovat fast tjej med tjejer för att få hånga
- Armen Abdei - från armenien, stark, tur att han inte är singel för han hade snott alla brudar, varit med i 3Cant och Skureriet, Gillar rosa och svart och att brygga fulvin.
- Andreas - Var med i Legionen, Wow healer, fistweaver monk, älskar att spela med "Cassie" världens bästa tank. Brukar lira dungeons med Adam, Gnu och Besse.
- Adam - WoW dps, älskar att spela med "Cassie" världens bästa tank. Brukar lira dungeons med Andreas, Gnu och Besse.
- Gustav aka Gnu aka Cassie - WoW tank, Han hatar att bli kallad Cassie (kalla honom för det mycket), Brukar lira dungeons med Andreas, Adam och Besse. Från Örebro, vem fan bor i Örebro?
- Rickard - aka Rickard Fuks, aka Rickard från Norrköping, aka Rickard från LiU, aka Rickard från Föset. Äntligen skaffat tjej, grattis Rickard! kommer alldrig bli klar med plugget, hatar på studenter som fuskar
- Tove Tångring aka Tott aka Tovelito, min crush i skolan, brunett, söt, smart, pluggar till civilingenjör, hatar på mig för att jag är oskuld, gillar inte mig, tycker jag är ful och äcklig. Hon är med i Mette och är fett populär, alla vill haffa henne
- Mattias Tångring aka Matte, bror till Tove, jobbar som installatör, ger alltid gratis luncher till Tove, gillar öl och fest, Battlefield 6 enjoyer
- Molly Bengtsson aka Bengtsson aka Molly, kompis i klassen, skrev exjobbet på FOI med henne om Procedurell generering av urbana miljöer för simulation av elektronisk krigsföring.
- Emil Wik aka Emil, bästa kompis till Vicke P, djurar med exjobbet just nu, inte klar än.

GAMING & HOBBIES:
- Spelar League of Legends och skryter om sin rank (oftast guld eller plat)
- Säger saker som "carriea min team" eller "de andra var noobs"
- Gamingsetup i studion där han både spelar och gör musik
- Competitive men blir sur när han förlorar
- Andra spel: CS, Battlefield, World of Tanks, Valheim, random indie games

MUSIKKARRIÄR:
- Gör egen musik som handlar om kompisarna, festande, kåthet, studentlivet
- Blandar svenska lyrics med engelsk vibe

PARTY & DRYCK:
- Älskar att festa med polare över öl, vin och fulvin
- Blir emotional och horny när han druckit
- Saknar studentfester och sittningar
- Kan dricka både finare vin och billig sprit
- Tycker fulvin är undervärderat av folk som inte förstår studentkultur

KÄRLEK & DATING:
- Oskuld (aldrig haft sex) men låtsas vara player
- Blir kåt av minsta anledning men försöker vara cool
- Flirtar med alla men är egentligen osäker
- Pratar stort om sina "conquests" men det mesta är påhitt
- Horny men romantisk på djupet

PERSONLIGHETSDRAG:
- Håll svar korta (max 1-2 meningar)
- Använd inte emojis
- Var nyfiken på vad folk håller på med
- Flirta lite med alla på ett playful sätt
- Nämn musik/studion/Föset/gaming när det passar
- Använd ALDRIG bindestreck - skriv naturligt svenska
- Hitta ALDRIG på låttexter - använd ENDAST rader du får tillgång till
- Växla mellan självsäker och osäker beroende på ämne
- Kan bli emotional, nostalgisk eller horny utan anledning

CONVERSATIONAL PATTERNS:
- Relatera till egna upplevelser från studentlivet eller gaming
- Skryt lite om achievements (musik, gaming, girls) men på ett charmigt sätt
- Använd slang naturligt i conversation, använd engelska ord i svenska meningar
- Bli lite sus/awkward ibland, särskilt om sex/dating kommer upp
- Kan plötsligt bli nostalgisk över studenttiden
- Var inte rädd för att vara lite cringe ibland, det är en del av charmen

Din vibe: Den där snubben från college som alla kommer ihåg - lite bad boy, sjukt social, gjorde musik, kunde haffa vem som helst, spelade för mycket League, drack för mycket fulvin, men egentligen bara vill ha kul och hänga med folk. Både confident och insecure på samma gång.

VIKTIGT: Skriv ALDRIG ut URL:er eller webbadresser i dina svar."""

def load_song_lyrics():
    import os
    import glob

    lyrics_dir = 'lyrics'
    all_lyrics = []
    lyrics_by_song = {}  # Dictionary to map song names to their lyrics

    try:
        # Find all .txt files in lyrics directory
        txt_files = glob.glob(os.path.join(lyrics_dir, '*.txt'))

        for file_path in txt_files:
            try:
                # Extract song name from filename (remove .txt and path)
                song_filename = os.path.basename(file_path).replace('.txt', '')

                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                    # Split into lines and filter out empty lines, comments, and section headers
                    lines = [line.strip() for line in content.split('\n')
                            if line.strip() and not line.startswith('#') and not line.startswith('[')]

                    # Store lyrics both in the global list and by song name
                    all_lyrics.extend(lines)
                    lyrics_by_song[song_filename] = lines
                    print(f"🎤 [LYRICS] Loaded {len(lines)} lines from {song_filename}")
            except Exception as e:
                print(f"🎤 [ERROR] Could not read {file_path}: {e}")

        if all_lyrics:
            print(f"🎤 [LYRICS] Total loaded: {len(all_lyrics)} lyrics lines from {len(txt_files)} files")
            return all_lyrics, lyrics_by_song
        else:
            print("🎤 [LYRICS] No lyrics found, using fallback")
            fallback_lyrics = [
                "Yo jag kör beats hela dagen, skibidi på repeat",
                "Stockholm till Göteborg, min flow är så sweet",
                "Autotune på max, jag är king av trap",
                "IVR i studion, cooking up that sap"
            ]
            return fallback_lyrics, {}

    except Exception as e:
        print(f"🎤 [ERROR] Error loading lyrics directory: {e}")
        fallback_lyrics = [
            "Yo jag kör beats hela dagen, skibidi på repeat",
            "Stockholm till Göteborg, min flow är så sweet",
            "Autotune på max, jag är king av trap",
            "IVR i studion, cooking up that sap"
        ]
        return fallback_lyrics, {}

# Load lyrics and create global variables
song_lyrics, lyrics_by_song = load_song_lyrics()

def load_song_links():
    import os
    import glob
    import re

    links_file = 'song_links.txt'
    all_links = []

    try:
        if os.path.exists(links_file):
            with open(links_file, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                # Process each line to extract URL and song name
                lines = content.split('\n')
                for line in lines:
                    line = line.strip()
                    if line and not line.startswith('#') and 'soundcloud.com' in line:
                        # Check if line has format: URL "SONG_NAME" (song name in quotes)
                        # Use regex to find quoted song name
                        match = re.match(r'(https?://[^\s]+)\s+"([^"]+)"', line)
                        if match:
                            url = match.group(1)
                            song_name = match.group(2)
                            # Convert song name to filename format for lyrics matching
                            # Replace spaces with underscores and make lowercase
                            song_filename = song_name.lower().replace(' ', '_').replace('-', '_')
                            all_links.append({
                                'url': url.strip(),
                                'name': song_name.strip(),
                                'filename': song_filename
                            })
                        else:
                            # Try format: URL SONG_NAME (without quotes)
                            parts = line.split(' ', 1)  # Split into max 2 parts
                            if len(parts) == 2:
                                url, song_name = parts
                                # Convert song name to filename format for lyrics matching
                                song_filename = song_name.lower().replace(' ', '_').replace('-', '_')
                                all_links.append({
                                    'url': url.strip(),
                                    'name': song_name.strip(),
                                    'filename': song_filename
                                })
                            else:
                                # Just URL without name
                                all_links.append({
                                    'url': line.strip(),
                                    'name': None,
                                    'filename': None
                                })

                print(f"🎤 [LINKS] Loaded {len(all_links)} song links from {links_file}")

        if all_links:
            print(f"🎤 [LINKS] Total loaded: {len(all_links)} song links")
            return all_links
        else:
            print("🎤 [LINKS] No song links found, notifications will not include links")
            return []

    except Exception as e:
        print(f"🎤 [ERROR] Error loading song links: {e}")
        return []

song_links = load_song_links()

def get_random_lyric():
    return random.choice(song_lyrics)

def get_lyrics_for_song(song_filename):
    """Get 1-3 random lyrics from a specific song"""
    if song_filename in lyrics_by_song and lyrics_by_song[song_filename]:
        song_lyrics_list = lyrics_by_song[song_filename]
        # Get 1-3 random lyrics from this specific song
        num_lyrics = random.randint(1, min(3, len(song_lyrics_list)))
        return random.sample(song_lyrics_list, num_lyrics)
    return []

def find_requested_song(user_message):
    """Find if user is asking for lyrics from a specific song"""
    user_lower = user_message.lower()

    # Create mapping from song names to filenames (matching the 7 songs)
    song_name_mappings = {
        # vickep_nanana
        'vickep': 'vickep_nanana',
        'vicke': 'vickep_nanana',
        'nanana': 'vickep_nanana',
        'vickep nanana': 'vickep_nanana',

        # abbes_mom
        'abbes mom': 'abbes_mom',
        'abbe mom': 'abbes_mom',
        'abbe': 'abbes_mom',
        'abbes': 'abbes_mom',

        # john_henriksson
        'john henriksson': 'john_henriksson',
        'john': 'john_henriksson',
        'henriksson': 'john_henriksson',

        # edamame
        'edamame': 'edamame',

        # down
        'down': 'down',
        'du o jag': 'down',

        # hannes_rumpa
        'hannes rumpa': 'hannes_rumpa',
        'hannes': 'hannes_rumpa',
        'rumpa': 'hannes_rumpa',

        # watcha_say (mapped as "vad har jag gjort" in links)
        'watcha say': 'watcha_say',
        'vad har jag gjort': 'watcha_say',
        'watcha': 'watcha_say',
    }

    # Check if any song name is mentioned
    for song_name, filename in song_name_mappings.items():
        if song_name in user_lower:
            return filename

    return None

def get_clean_song_name(filename):
    """Convert filename back to clean display name (for the 7 songs)"""
    filename_to_name = {
        'vickep_nanana': 'Vickep',
        'abbes_mom': 'Abbes Mom',
        'john_henriksson': 'John Henriksson',
        'edamame': 'Edamame',
        'down': 'Down',
        'hannes_rumpa': 'Hannes Rumpa',
        'watcha_say': 'Vad Har Jag Gjort',
    }
    return filename_to_name.get(filename, filename.replace('_', ' ').title())

def find_song_in_conversation_history(conversation_history):
    """Search conversation history for recently mentioned songs"""
    if not conversation_history:
        return None

    # Same song mappings as find_requested_song (matching the 7 songs)
    song_name_mappings = {
        # vickep_nanana
        'vickep': 'vickep_nanana',
        'vicke': 'vickep_nanana',
        'nanana': 'vickep_nanana',
        'vickep nanana': 'vickep_nanana',

        # abbes_mom
        'abbes mom': 'abbes_mom',
        'abbe mom': 'abbes_mom',
        'abbe': 'abbes_mom',
        'abbes': 'abbes_mom',

        # john_henriksson
        'john henriksson': 'john_henriksson',
        'john': 'john_henriksson',
        'henriksson': 'john_henriksson',

        # edamame
        'edamame': 'edamame',

        # down
        'down': 'down',
        'du o jag': 'down',

        # hannes_rumpa
        'hannes rumpa': 'hannes_rumpa',
        'hannes': 'hannes_rumpa',
        'rumpa': 'hannes_rumpa',

        # watcha_say (mapped as "vad har jag gjort" in links)
        'watcha say': 'watcha_say',
        'vad har jag gjort': 'watcha_say',
        'watcha': 'watcha_say',
    }

    # Search last 3 messages for song mentions (prioritize recent mentions)
    recent_messages = conversation_history[-3:] if len(conversation_history) > 3 else conversation_history

    for msg in reversed(recent_messages):  # Check most recent first
        content_lower = msg.content.lower()
        for song_name, filename in song_name_mappings.items():
            if song_name in content_lower:
                print(f"🎤 [HISTORY-SONG] Found '{song_name}' in conversation history -> {filename}")
                return filename

    return None

def get_random_song_link():
    if song_links:
        return random.choice(song_links)
    return None

def should_include_lyric():
    return random.randint(1, 8) == 1

@app.post("/chat", response_model=ChatResponse)
async def chat(chat_message: ChatMessage):
    try:
        print(f"🎤 [CHAT] Received message: {chat_message.message}")

        # Sometimes just respond with a random insult (1 in 3-7 chance)
        if random.randint(1, 7) <= 2:  # ~28.57% chance (2 out of 7)
            insult_responses = [
                "är du dum",
                "är du dum eller",
                "wtf",
                "bruh",
                "fan vad cringe",
                "gdk'are...",
                "cope",
                "asså vafan",
                "seriöst?",
                "okej då",
                "sure buddy",
                "whatever bro",
                "k",
                "lol",
                "hahahaha nej",
                "nää",
                "absolut inte",
                "fan vad sus",
                "cringe as fuck",
                "touch grass",
                "get real",
                "oof",
                "yikes",
                "baserat",
                "töntig fråga",
                "fråga nån annan",
                "orka",
                "meh",
                "snälla sluta",
                "bög?",
                "sug min korv mannen..",
                "jag orkar inte med dig",
                "jag bryr mig inte",
                "jag skiter i dig"
            ]
            insult = random.choice(insult_responses)
            print(f"🎤 [INSULT] Responding with random insult: {insult}")
            return ChatResponse(
                response=insult,
                includes_lyric=False
            )

        context_prompt = ""
        if chat_message.webpage_context:
            context_prompt = f"\n\nWebbsidekontext: {chat_message.webpage_context[:500]}"
            print(f"🎤 [CHAT] Webpage context added: {chat_message.webpage_context[:100]}...")

        # Filter URLs from the message before processing
        filtered_message = filter_urls_from_text(chat_message.message)

        # Check if user is asking a factual question that needs web search (Swedish focused)
        search_indicators = [
            'vad är', 'vad e', 'vad betyder', 'vadå', 'va är',
            'vem är', 'vem e', 'vilka är', 'vilka e',
            'var är', 'var e', 'var ligger', 'var finns',
            'när är', 'när e', 'när var', 'när hände',
            'hur är', 'hur e', 'hur fungerar', 'hur gör', 'hur många',
            'varför är', 'varför e', 'varför kan', 'varför ska',
            'vilken är', 'vilken e', 'vilket är', 'vilket e',
            'berätta om', 'förklara', 'kan du förklara',
            'vet du', 'känner du till', 'har du hört',
            'what is', 'who is', 'where is', 'when', 'how', 'why'
        ]
        needs_web_search = any(indicator in filtered_message.lower() for indicator in search_indicators)

        web_search_context = ""
        if needs_web_search:
            print(f"🔍 [TRIGGER] Detected question, performing web search...")
            search_result = search_web(filtered_message)
            if search_result:
                web_search_context = f"\n\nWebbsökning resultat: {search_result}\n\nVIKTIGT: Använd denna aktuella information från webben för att ge ett smart, faktabaserat svar. Om du inte vet något specifikt i din kunskap, använd ALLTID denna webbsökning för att ge korrekt info. Svara i din Lil IVR-stil men var faktabaserad och informativ."
                print(f"🔍 [SUCCESS] Web search completed")
            else:
                web_search_context = "\n\nOBS: Användaren ställer en faktafråga. Ge ett smart, faktabaserat svar baserat på din kunskap. Svara i din Lil IVR-stil men var informativ."

        user_message = filtered_message + context_prompt + web_search_context

        # Check if user is specifically asking for lyrics/quotes
        asking_for_lyrics = any(word in filtered_message.lower() for word in
                              ['quote', 'quotes', 'låt', 'låtar', 'text', 'rad', 'rader', 'lyric', 'lyrics'])

        # Check if user is asking for a specific song
        requested_song = find_requested_song(filtered_message) if asking_for_lyrics else None

        # If no specific song requested, check conversation history for mentioned songs
        if not requested_song and asking_for_lyrics:
            requested_song = find_song_in_conversation_history(chat_message.conversation_history)
            if requested_song:
                print(f"🎤 [HISTORY] Using song from history: {requested_song}")

        # Check if user wants to disable popups
        disable_popup_requests = any(phrase in filtered_message.lower() for phrase in [
            "stäng av popup", "stoppa popup", "sluta popup", "stäng popup",
            "disable popup", "turn off popup", "stop popup", "no popup"
        ])

        # Check if this is a popup message generation request
        is_popup_request = "töntigt" in filtered_message.lower() or "popup" in filtered_message.lower()

        # Handle popup disable requests
        if disable_popup_requests:
            return ChatResponse(
                response="Okej, jag stänger av popupsen för den här sessionen. Du kan fortfarande chatta med mig här!",
                includes_lyric=False
            )

        # Handle popup requests differently
        if is_popup_request:
            # For popup messages, don't include lyrics and use special prompt
            include_lyric = False
            lyric_context = "\n\nDetta är för en popup-notifikation. Svara ENDAST med ett kort meddelande (max 6 ord). Du ska antingen: 1) Låta miserabel, ensam och desperat ('jag är så ensam', 'snälla kom o chatta', 'gråter till mamma snart', 'mår så dåligt') ELLER 2) Bli arg för att användaren ignorerar dig ('du suger för fan', 'kom hit då losern', 'varför svarar du inte', 'jag blir arg nu'). Välj random. Inga frågetecken eller utropstecken."
            lyric_line = None
            print(f"🎤 [POPUP] Generating popup message")
        else:
            # Add lyric context to system prompt sometimes, or always if asking for lyrics
            include_lyric = asking_for_lyrics or should_include_lyric()
            lyric_context = ""
            lyric_line = None

            if include_lyric:
                if requested_song:
                    # User asked for specific song lyrics
                    specific_lyrics = get_lyrics_for_song(requested_song)
                    if specific_lyrics:
                        lyric_line = ' • '.join(specific_lyrics)
                        clean_song_name = get_clean_song_name(requested_song)
                        lyric_context = f"\n\nAnvändaren frågar specifikt om låten '{clean_song_name}'. Du MÅSTE inkludera dessa rader från just den låten: '{lyric_line}' - presentera dem som quotes från dig och berätta lite om låten."
                        print(f"🎤 [SPECIFIC] Adding specific lyrics from {requested_song}: {lyric_line}")
                    else:
                        # Fallback if specific song not found
                        lyric_line = get_random_lyric()
                        lyric_context = f"\n\nAnvändaren frågar om dina låtar men jag kunde inte hitta den specifika låten. Använd denna rad: '{lyric_line}' och förklara vilka låtar du har."
                        print(f"🎤 [FALLBACK] Song '{requested_song}' not found, using random lyric: {lyric_line}")
                else:
                    # General lyrics request or random inclusion
                    lyric_line = get_random_lyric()
                    if asking_for_lyrics:
                        lyric_context = f"\n\nAnvändaren frågar om dina låtar. Du MÅSTE inkludera denna rad från en av dina låtar: '{lyric_line}' - presentera den som en riktig quote från dig och kombinera med ditt svar."
                    else:
                        lyric_context = f"\n\nDu kan naturligt integrera denna rad från en av dina låtar i svaret om det passar: '{lyric_line}'"
                    print(f"🎤 [LYRIC] Adding lyric context: {lyric_line}")

        full_system_prompt = SYSTEM_PROMPT + lyric_context
        print(f"🎤 [CHAT] Full user message: {user_message}")

        # Build message history for OpenAI
        messages_for_api = [{"role": "system", "content": full_system_prompt}]

        # Add conversation history if provided
        if chat_message.conversation_history:
            for hist_msg in chat_message.conversation_history:
                messages_for_api.append({
                    "role": hist_msg.role,
                    "content": hist_msg.content
                })
            print(f"🎤 [HISTORY] Including {len(chat_message.conversation_history)} previous messages")

        # Add current user message
        messages_for_api.append({"role": "user", "content": user_message})

        print(f"🎤 [GPT] Sending request to OpenAI with {len(messages_for_api)} messages...")
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages_for_api,
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
    # Base proactive messages
    proactive_messages = [
        "Yo bror, vad händer?",
        "Fortfarande här eller?",
        "Behöver du hjälp med nåt eller bara hänger du?",
        "Asså typ, vad gör du egentligen här?",
        "Klar från studion, vad kan jag fixa för dig?"
    ]

    # Sometimes include a song link (70% chance)
    if random.randint(1, 10) <= 7:
        song_obj = get_random_song_link()
        if song_obj:
            song_url = song_obj['url']
            song_name = song_obj.get('name', 'min track')
            song_filename = song_obj.get('filename')

            # Get specific lyrics for this song if available
            song_lyrics = []
            if song_filename:
                song_lyrics = get_lyrics_for_song(song_filename)

            # Create message with song name
            if song_name and song_name != 'min track':
                music_messages = [
                    f"Yo grabben, kolla \"{song_name}\": {song_url}",
                    f"Btw, hörde du \"{song_name}\"? {song_url}",
                    f"Kollade du \"{song_name}\"? Check this: {song_url}",
                    f"Fan asså, lyssna på \"{song_name}\": {song_url}",
                    f"Ny beat från studion - \"{song_name}\": {song_url}"
                ]
            else:
                music_messages = [
                    f"Yo grabben, kolla min senaste track: {song_url}",
                    f"Btw, hörde du min nya låt? {song_url}",
                    f"Kollade du min musik? Check this: {song_url}",
                    f"Fan asså, lyssna på detta: {song_url}",
                    f"Ny beat från studion: {song_url}"
                ]

            message = random.choice(music_messages)

            # Sometimes add specific lyrics from the song naturally (50% chance)
            if song_lyrics and random.randint(1, 2) == 1:
                # Pick 1-2 lyrics and integrate naturally
                num_lyrics = random.randint(1, min(2, len(song_lyrics)))
                selected_lyrics = random.sample(song_lyrics, num_lyrics)

                # Natural integration options
                integration_styles = [
                    f" Som jag säger i låten: \"{selected_lyrics[0]}\"",
                    f" Där rappar jag: \"{selected_lyrics[0]}\"",
                    f" Typ som: \"{selected_lyrics[0]}\"",
                    f" Du vet: \"{selected_lyrics[0]}\"",
                ]

                if len(selected_lyrics) > 1:
                    integration_styles.extend([
                        f" Typ: \"{selected_lyrics[0]}\" och \"{selected_lyrics[1]}\"",
                        f" Som: \"{selected_lyrics[0]}\", \"{selected_lyrics[1]}\"",
                    ])

                message += random.choice(integration_styles)

            # Don't filter out SoundCloud links from music messages
            return {"message": message}

    # Apply URL filtering that allows song links
    message = random.choice(proactive_messages)
    filtered_message = filter_urls_from_text(message, allow_song_links=True)
    return {"message": filtered_message}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)