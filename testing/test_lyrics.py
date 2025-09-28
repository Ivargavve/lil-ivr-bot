#!/usr/bin/env python3
"""
Test Swedish lyrics integration and Swedish language validation
"""

import sys
import re
sys.path.append('backend')

def test_swedish_lyrics():
    print("🧪 Testing Swedish Lyrics Integration")
    print("=" * 40)

    # Test 1: Lyrics file content
    print("\n1️⃣ Testing lyrics file content...")
    try:
        from main import load_song_lyrics, get_random_lyric

        lyrics = load_song_lyrics()
        print(f"✅ Loaded {len(lyrics)} lyric lines")

        # Test each lyric line
        swedish_keywords = [
            'jag', 'är', 'min', 'och', 'det', 'från', 'till', 'som', 'för', 'dom',
            'stockholm', 'göteborg', 'malmö', 'umeå', 'svenska', 'bror', 'asså'
        ]

        rapper_keywords = [
            'beats', 'flow', 'trap', 'studio', 'bars', 'mic', 'sound', 'track',
            'king', 'rapper', 'game', 'drop', 'stream', 'spotify'
        ]

        for i, lyric in enumerate(lyrics[:10], 1):  # Test first 10 lines
            print(f"  📝 Line {i}: {lyric[:60]}...")

            # Check for Swedish words
            has_swedish = any(word.lower() in lyric.lower() for word in swedish_keywords)

            # Check for rapper terms
            has_rapper = any(word.lower() in lyric.lower() for word in rapper_keywords)

            print(f"      Swedish: {'✅' if has_swedish else '⚠️'}, Rapper: {'✅' if has_rapper else '⚠️'}")

    except Exception as e:
        print(f"❌ Lyrics file error: {e}")

    # Test 2: Random lyric selection
    print("\n2️⃣ Testing random lyric selection...")
    try:
        # Test multiple random selections
        selected_lyrics = set()
        for i in range(20):
            lyric = get_random_lyric()
            selected_lyrics.add(lyric)

        print(f"✅ Generated {len(selected_lyrics)} unique lyrics from {len(lyrics)} total")

        # Show some examples
        for i, lyric in enumerate(list(selected_lyrics)[:3], 1):
            print(f"  🎵 Example {i}: {lyric}")

    except Exception as e:
        print(f"❌ Random selection error: {e}")

    # Test 3: Lyric integration probability
    print("\n3️⃣ Testing lyric integration probability...")
    try:
        from main import should_include_lyric

        # Test probability distribution
        include_count = 0
        total_tests = 1000

        for _ in range(total_tests):
            if should_include_lyric():
                include_count += 1

        probability = include_count / total_tests
        print(f"✅ Lyric inclusion rate: {probability:.1%}")
        print(f"  Expected: ~20%, Actual: {probability:.1%}")

        if 0.15 <= probability <= 0.25:
            print("  ✅ Probability within expected range")
        else:
            print("  ⚠️ Probability outside expected range")

    except Exception as e:
        print(f"❌ Probability test error: {e}")

    # Test 4: Character validation
    print("\n4️⃣ Testing Swedish character support...")
    try:
        swedish_chars = ['å', 'ä', 'ö', 'Å', 'Ä', 'Ö']
        found_chars = set()

        for lyric in lyrics:
            for char in swedish_chars:
                if char in lyric:
                    found_chars.add(char)

        print(f"✅ Found Swedish characters: {', '.join(sorted(found_chars))}")

        if len(found_chars) >= 3:
            print("  ✅ Good Swedish character usage")
        else:
            print("  ⚠️ Limited Swedish character usage")

    except Exception as e:
        print(f"❌ Character validation error: {e}")

    # Test 5: Lyric formatting in messages
    print("\n5️⃣ Testing lyric formatting in chat messages...")
    try:
        test_lyric = "Yo jag kör beats hela dagen, skibidi på repeat"
        formatted_lyric = f"Btw, från min senaste track: '{test_lyric}' 🎤"

        # Test if the format matches what's expected in the frontend
        expected_pattern = r"Btw, från min senaste track: '.*' 🎤"

        if re.match(expected_pattern, formatted_lyric):
            print("✅ Lyric formatting matches expected pattern")
            print(f"  📝 Example: {formatted_lyric}")
        else:
            print("❌ Lyric formatting doesn't match pattern")

        # Test length
        if len(formatted_lyric) <= 200:
            print("✅ Formatted lyric length acceptable")
        else:
            print("⚠️ Formatted lyric might be too long")

    except Exception as e:
        print(f"❌ Formatting test error: {e}")

    # Test 6: Goofy/slang terms validation
    print("\n6️⃣ Testing goofy slang terms...")
    try:
        goofy_terms = ['skibidi', 'bop', 'sick', 'tight', 'fly', 'glow', 'vibe']
        found_terms = []

        all_lyrics_text = ' '.join(lyrics).lower()

        for term in goofy_terms:
            if term in all_lyrics_text:
                found_terms.append(term)

        print(f"✅ Found goofy terms: {', '.join(found_terms)}")

        if len(found_terms) >= 2:
            print("  ✅ Good use of goofy slang")
        else:
            print("  ⚠️ Could use more goofy slang terms")

    except Exception as e:
        print(f"❌ Slang validation error: {e}")

    print("\n" + "=" * 40)
    print("🏁 Swedish lyrics integration testing complete!")

if __name__ == "__main__":
    test_swedish_lyrics()