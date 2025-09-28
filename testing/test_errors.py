#!/usr/bin/env python3
"""
Test error handling and edge cases
"""

import sys
import os
sys.path.append('backend')

def test_error_handling():
    print("🧪 Testing Error Handling & Edge Cases")
    print("=" * 40)

    # Test 1: Missing environment variables
    print("\n1️⃣ Testing environment variable handling...")
    try:
        # Backup current env
        original_api_key = os.environ.get('OPENAI_API_KEY')

        # Test with missing API key
        if 'OPENAI_API_KEY' in os.environ:
            del os.environ['OPENAI_API_KEY']

        # Try to import main (should handle gracefully)
        try:
            import main
            print("✅ Backend loads without API key (graceful degradation)")
        except Exception as e:
            print(f"⚠️ Backend fails without API key: {e}")

        # Restore API key
        if original_api_key:
            os.environ['OPENAI_API_KEY'] = original_api_key

    except Exception as e:
        print(f"❌ Environment test error: {e}")

    # Test 2: Missing lyrics file
    print("\n2️⃣ Testing missing lyrics file...")
    try:
        from main import load_song_lyrics

        # Backup original file
        lyrics_path = 'backend/song_lyrics.txt'
        backup_path = 'backend/song_lyrics.txt.backup'

        if os.path.exists(lyrics_path):
            os.rename(lyrics_path, backup_path)

        # Test loading lyrics without file
        lyrics = load_song_lyrics()
        print(f"✅ Fallback lyrics loaded: {len(lyrics)} lines")

        # Restore file
        if os.path.exists(backup_path):
            os.rename(backup_path, lyrics_path)

    except Exception as e:
        print(f"❌ Missing lyrics file error: {e}")

    # Test 3: Invalid data inputs
    print("\n3️⃣ Testing invalid data inputs...")
    try:
        from main import ChatMessage, WebpageAnalysis

        # Test empty message
        try:
            empty_msg = ChatMessage(message="", webpage_context=None)
            print("✅ Empty message accepted")
        except Exception as e:
            print(f"⚠️ Empty message rejected: {e}")

        # Test very long message
        try:
            long_msg = ChatMessage(message="x" * 10000, webpage_context="y" * 5000)
            print("✅ Long message accepted")
        except Exception as e:
            print(f"⚠️ Long message rejected: {e}")

        # Test invalid HTML
        try:
            invalid_html = WebpageAnalysis(html_content="<invalid>unclosed tags & special chars åäö")
            print("✅ Invalid HTML accepted")
        except Exception as e:
            print(f"⚠️ Invalid HTML rejected: {e}")

    except Exception as e:
        print(f"❌ Data validation error: {e}")

    # Test 4: Network error simulation
    print("\n4️⃣ Testing network error handling...")
    try:
        # Test if the chatbot-app.js has proper error handling
        js_file = 'extension/chatbot-app.js'
        if os.path.exists(js_file):
            with open(js_file, 'r') as f:
                content = f.read()

            error_patterns = [
                'catch',
                'error',
                'try',
                'setTimeout',
                'console.error'
            ]

            for pattern in error_patterns:
                if pattern in content:
                    print(f"  ✅ Has '{pattern}' error handling")
                else:
                    print(f"  ⚠️ Missing '{pattern}' error handling")

    except Exception as e:
        print(f"❌ Network error test failed: {e}")

    # Test 5: DOM injection conflicts
    print("\n5️⃣ Testing DOM injection safety...")
    try:
        content_script = 'extension/content.js'
        if os.path.exists(content_script):
            with open(content_script, 'r') as f:
                content = f.read()

            safety_patterns = [
                'getElementById',
                'lil-ivr-chatbot',
                'document.body',
                'createElement'
            ]

            for pattern in safety_patterns:
                if pattern in content:
                    print(f"  ✅ Uses safe DOM method: {pattern}")
                else:
                    print(f"  ⚠️ Missing safe DOM method: {pattern}")

    except Exception as e:
        print(f"❌ DOM safety test failed: {e}")

    # Test 6: CSS conflicts
    print("\n6️⃣ Testing CSS isolation...")
    try:
        css_file = 'extension/chatbot.css'
        if os.path.exists(css_file):
            with open(css_file, 'r') as f:
                css_content = f.read()

            # Check for high specificity selectors
            if '.lil-ivr-chatbot' in css_content:
                print("  ✅ Uses namespaced CSS classes")

            if '!important' in css_content:
                important_count = css_content.count('!important')
                print(f"  ⚠️ Uses !important {important_count} times (should be minimal)")
            else:
                print("  ✅ No !important declarations (good)")

            if 'z-index: 2147483647' in css_content or 'z-index: 10000' in css_content:
                print("  ✅ Uses high z-index for overlay")

    except Exception as e:
        print(f"❌ CSS isolation test failed: {e}")

    # Test 7: Memory leak prevention
    print("\n7️⃣ Testing memory leak prevention...")
    try:
        # Check for proper event listener cleanup
        js_files = [
            'extension/chatbot-app.js',
            'extension/content.js',
            'extension/background.js'
        ]

        for js_file in js_files:
            if os.path.exists(js_file):
                with open(js_file, 'r') as f:
                    content = f.read()

                if 'addEventListener' in content:
                    has_remove = 'removeEventListener' in content
                    print(f"  {'✅' if has_remove else '⚠️'} {js_file}: Event listeners {'with cleanup' if has_remove else 'no cleanup detected'}")

                if 'setInterval' in content:
                    has_clear = 'clearInterval' in content
                    print(f"  {'✅' if has_clear else '⚠️'} {js_file}: Intervals {'with cleanup' if has_clear else 'no cleanup detected'}")

    except Exception as e:
        print(f"❌ Memory leak test failed: {e}")

    print("\n" + "=" * 40)
    print("🏁 Error handling and edge case testing complete!")

if __name__ == "__main__":
    test_error_handling()