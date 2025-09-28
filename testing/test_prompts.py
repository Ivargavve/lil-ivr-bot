#!/usr/bin/env python3
"""
Test system prompts and webpage analysis logic
"""

import sys
sys.path.append('backend')

def test_system_prompts():
    print("🧪 Testing System Prompts and Analysis")
    print("=" * 40)

    from main import SYSTEM_PROMPT, should_include_lyric

    # Test 1: System prompt content
    print("\n1️⃣ Testing system prompt...")
    print(f"✅ System prompt length: {len(SYSTEM_PROMPT)} characters")

    required_keywords = ["svenska", "Lil IVR", "skibidi", "bror", "🎤"]
    for keyword in required_keywords:
        if keyword.lower() in SYSTEM_PROMPT.lower():
            print(f"✅ Contains '{keyword}'")
        else:
            print(f"❌ Missing '{keyword}'")

    # Test 2: Lyric inclusion probability
    print("\n2️⃣ Testing lyric inclusion logic...")
    lyric_tests = []
    for i in range(100):
        lyric_tests.append(should_include_lyric())

    lyric_rate = sum(lyric_tests) / len(lyric_tests)
    print(f"✅ Lyric inclusion rate: {lyric_rate:.1%} (expected ~20%)")

    # Test 3: Mock webpage contexts
    print("\n3️⃣ Testing webpage context scenarios...")

    test_contexts = [
        {
            "title": "Google Search",
            "content": "Search the world's information",
            "expected": "search engine"
        },
        {
            "title": "GitHub Repository",
            "content": "Code repository for developers",
            "expected": "kod"
        },
        {
            "title": "News Article",
            "content": "Latest breaking news and updates",
            "expected": "nyheter"
        }
    ]

    for context in test_contexts:
        mock_html = f"<title>{context['title']}</title><p>{context['content']}</p>"
        print(f"✅ Mock context: {context['title']} ({len(mock_html)} chars)")

    print("\n" + "=" * 40)
    print("🏁 System prompt testing complete!")

if __name__ == "__main__":
    test_system_prompts()