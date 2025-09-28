#!/usr/bin/env python3
"""
Lil IVR Bot - Setup Validation Script
Checks if all components are properly configured
"""

import os
import json
import sys
from pathlib import Path

def check_file_exists(filepath, description):
    """Check if a file exists and report status"""
    if os.path.exists(filepath):
        print(f"✅ {description}: {filepath}")
        return True
    else:
        print(f"❌ {description}: {filepath} - NOT FOUND")
        return False

def check_env_file():
    """Check if .env file exists and has API key"""
    env_path = ".env"
    if not os.path.exists(env_path):
        print(f"❌ Environment file: {env_path} - NOT FOUND")
        return False

    with open(env_path, 'r') as f:
        content = f.read()
        if "OPENAI_API_KEY" in content and len(content.strip()) > 20:
            print(f"✅ Environment file: {env_path} (has API key)")
            return True
        else:
            print(f"❌ Environment file: {env_path} - Missing or invalid OPENAI_API_KEY")
            return False

def check_manifest():
    """Check if manifest.json is valid"""
    manifest_path = "extension/manifest.json"
    if not os.path.exists(manifest_path):
        print(f"❌ Extension manifest: {manifest_path} - NOT FOUND")
        return False

    try:
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)

        required_fields = ["manifest_version", "name", "version", "permissions"]
        for field in required_fields:
            if field not in manifest:
                print(f"❌ Extension manifest: Missing required field '{field}'")
                return False

        print(f"✅ Extension manifest: {manifest_path} (valid)")
        return True
    except json.JSONDecodeError:
        print(f"❌ Extension manifest: {manifest_path} - Invalid JSON")
        return False

def main():
    print("🎤 Lil IVR Bot - Setup Validation")
    print("=" * 40)

    all_good = True

    # Check backend files
    print("\n📁 Backend Files:")
    all_good &= check_file_exists("backend/main.py", "FastAPI server")
    all_good &= check_file_exists("backend/requirements.txt", "Python dependencies")
    all_good &= check_file_exists("backend/song_lyrics.txt", "Swedish rap lyrics")

    # Check extension files
    print("\n🔧 Extension Files:")
    all_good &= check_file_exists("extension/manifest.json", "Extension manifest")
    all_good &= check_file_exists("extension/content.js", "Content script")
    all_good &= check_file_exists("extension/background.js", "Background script")
    all_good &= check_file_exists("extension/chatbot-app.js", "Chatbot application")
    all_good &= check_file_exists("extension/chatbot.css", "Chatbot styles")
    all_good &= check_file_exists("extension/popup.html", "Extension popup")
    all_good &= check_file_exists("extension/popup.js", "Popup script")

    # Check frontend files
    print("\n⚛️ Frontend Files:")
    all_good &= check_file_exists("frontend/package.json", "React package config")
    all_good &= check_file_exists("frontend/src/App.js", "React main component")
    all_good &= check_file_exists("frontend/src/components/ChatBox.js", "ChatBox component")

    # Check configuration files
    print("\n⚙️ Configuration:")
    all_good &= check_env_file()
    all_good &= check_manifest()

    # Check documentation
    print("\n📚 Documentation:")
    all_good &= check_file_exists("README.md", "Main documentation")
    all_good &= check_file_exists("SETUP_GUIDE.md", "Setup guide")
    all_good &= check_file_exists("start_backend.sh", "Backend startup script")

    print("\n" + "=" * 40)

    if all_good:
        print("🎉 SUCCESS! All components are present and configured!")
        print("\n🚀 Next steps:")
        print("1. Run: ./start_backend.sh")
        print("2. Load extension from chrome://extensions/")
        print("3. Visit any website to see Lil IVR Bot!")
        return 0
    else:
        print("❌ ISSUES FOUND! Please fix the missing components above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())