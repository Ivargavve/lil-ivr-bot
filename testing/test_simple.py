#!/usr/bin/env python3
"""
Simple test for backend components
"""

import sys
import os
sys.path.append('backend')

def test_backend_components():
    print("🧪 Testing Backend Components")
    print("=" * 40)

    # Test imports
    print("\n1️⃣ Testing imports...")
    try:
        from main import app, ChatMessage, WebpageAnalysis, load_song_lyrics, get_random_lyric
        print("✅ All imports successful")
    except Exception as e:
        print(f"❌ Import error: {e}")
        return

    # Test song lyrics
    print("\n2️⃣ Testing song lyrics...")
    try:
        lyrics = load_song_lyrics()
        print(f"✅ Loaded {len(lyrics)} lyrics")

        for i in range(3):
            lyric = get_random_lyric()
            print(f"  📝 Sample lyric {i+1}: {lyric[:50]}...")

    except Exception as e:
        print(f"❌ Lyrics error: {e}")

    # Test data models
    print("\n3️⃣ Testing data models...")
    try:
        chat_msg = ChatMessage(message="Hej", webpage_context="test context")
        print(f"✅ ChatMessage: {chat_msg.message}")

        webpage = WebpageAnalysis(html_content="<html><title>Test</title></html>")
        print(f"✅ WebpageAnalysis: {len(webpage.html_content)} chars")

    except Exception as e:
        print(f"❌ Model error: {e}")

    # Test environment
    print("\n4️⃣ Testing environment...")
    try:
        if os.path.exists('.env'):
            with open('.env', 'r') as f:
                content = f.read()
                if 'OPENAI_API_KEY' in content:
                    print("✅ OpenAI API key configured")
                else:
                    print("❌ OpenAI API key missing")
        else:
            print("❌ .env file missing")

    except Exception as e:
        print(f"❌ Environment error: {e}")

    print("\n" + "=" * 40)
    print("🏁 Backend component testing complete!")

if __name__ == "__main__":
    test_backend_components()