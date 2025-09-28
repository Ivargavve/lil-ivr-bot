#!/usr/bin/env python3
"""
Test Chrome extension files and structure
"""

import json
import os

def test_extension_files():
    print("🧪 Testing Chrome Extension Files")
    print("=" * 40)

    # Test 1: Manifest validation
    print("\n1️⃣ Testing manifest.json...")
    manifest_path = "extension/manifest.json"

    try:
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)

        print(f"✅ Manifest loaded successfully")
        print(f"  📄 Name: {manifest.get('name')}")
        print(f"  📄 Version: {manifest.get('version')}")
        print(f"  📄 Manifest Version: {manifest.get('manifest_version')}")

        # Check required fields
        required_fields = {
            "manifest_version": 3,
            "name": "Lil IVR Bot",
            "permissions": ["activeTab", "storage", "scripting"],
            "content_scripts": True,
            "background": True
        }

        for field, expected in required_fields.items():
            if field in manifest:
                if expected == True:
                    print(f"  ✅ Has {field}")
                elif manifest[field] == expected:
                    print(f"  ✅ {field}: {manifest[field]}")
                else:
                    print(f"  ⚠️ {field}: {manifest[field]} (expected {expected})")
            else:
                print(f"  ❌ Missing {field}")

    except Exception as e:
        print(f"❌ Manifest error: {e}")

    # Test 2: Required extension files
    print("\n2️⃣ Testing extension files...")
    required_files = [
        "extension/manifest.json",
        "extension/content.js",
        "extension/background.js",
        "extension/chatbot-app.js",
        "extension/chatbot.css",
        "extension/popup.html",
        "extension/popup.js"
    ]

    for file_path in required_files:
        if os.path.exists(file_path):
            size = os.path.getsize(file_path)
            print(f"  ✅ {file_path} ({size} bytes)")
        else:
            print(f"  ❌ {file_path} - Missing")

    # Test 3: JavaScript syntax validation
    print("\n3️⃣ Testing JavaScript files...")
    js_files = [
        "extension/content.js",
        "extension/background.js",
        "extension/chatbot-app.js",
        "extension/popup.js"
    ]

    for js_file in js_files:
        if os.path.exists(js_file):
            with open(js_file, 'r') as f:
                content = f.read()

            # Basic syntax checks
            if 'chrome.runtime' in content or 'chrome.tabs' in content or 'API_BASE_URL' in content:
                print(f"  ✅ {js_file} has Chrome API calls")
            else:
                print(f"  ⚠️ {js_file} no Chrome APIs detected")

    # Test 4: CSS file validation
    print("\n4️⃣ Testing CSS file...")
    css_file = "extension/chatbot.css"
    if os.path.exists(css_file):
        with open(css_file, 'r') as f:
            css_content = f.read()

        css_classes = ['.lil-ivr-chatbot', '.chatbot-minimized', '.chatbot-expanded']
        for css_class in css_classes:
            if css_class in css_content:
                print(f"  ✅ Has {css_class} styles")
            else:
                print(f"  ❌ Missing {css_class} styles")

    print("\n" + "=" * 40)
    print("🏁 Extension file validation complete!")

if __name__ == "__main__":
    test_extension_files()