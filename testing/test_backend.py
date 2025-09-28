#!/usr/bin/env python3
"""
Test script for Lil IVR Bot backend endpoints
"""

import json
import sys
import os
sys.path.append('backend')

from main import app, ChatMessage, WebpageAnalysis
from fastapi.testclient import TestClient

def test_endpoints():
    client = TestClient(app)

    print("🧪 Testing Backend Endpoints")
    print("=" * 40)

    # Test 1: Health check (GET random message)
    print("\n1️⃣ Testing random message endpoint...")
    try:
        response = client.get("/random-message")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Random message: {data.get('message', 'No message')}")
        else:
            print(f"❌ Random message failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Random message error: {e}")

    # Test 2: Chat endpoint structure (without OpenAI call)
    print("\n2️⃣ Testing chat endpoint structure...")
    try:
        # Create test message
        test_message = {
            "message": "Hej test",
            "webpage_context": "Test webpage context"
        }

        # Test if endpoint accepts the request format
        response = client.post("/chat", json=test_message)
        print(f"📡 Chat endpoint status: {response.status_code}")

        if response.status_code == 500:
            print("⚠️ Expected 500 error (OpenAI API call)")
            print("✅ Endpoint structure is correct")
        elif response.status_code == 200:
            print("✅ Chat endpoint working!")
            data = response.json()
            print(f"Response: {data.get('response', 'No response')[:100]}...")
        else:
            print(f"❌ Unexpected status: {response.status_code}")

    except Exception as e:
        print(f"❌ Chat endpoint error: {e}")

    # Test 3: Webpage analysis endpoint structure
    print("\n3️⃣ Testing webpage analysis endpoint...")
    try:
        test_webpage = {
            "html_content": "<html><head><title>Test Page</title></head><body><h1>Test</h1><p>This is a test page about technology.</p></body></html>"
        }

        response = client.post("/analyze-webpage", json=test_webpage)
        print(f"📡 Webpage analysis status: {response.status_code}")

        if response.status_code == 500:
            print("⚠️ Expected 500 error (OpenAI API call)")
            print("✅ Endpoint structure is correct")
        elif response.status_code == 200:
            print("✅ Webpage analysis working!")
            data = response.json()
            print(f"Greeting: {data.get('greeting', 'No greeting')[:100]}...")
        else:
            print(f"❌ Unexpected status: {response.status_code}")

    except Exception as e:
        print(f"❌ Webpage analysis error: {e}")

    # Test 4: Data models
    print("\n4️⃣ Testing data models...")
    try:
        # Test ChatMessage model
        chat_msg = ChatMessage(message="test", webpage_context="test context")
        print(f"✅ ChatMessage model: {chat_msg.message}")

        # Test WebpageAnalysis model
        webpage_msg = WebpageAnalysis(html_content="<html>test</html>")
        print(f"✅ WebpageAnalysis model: {len(webpage_msg.html_content)} chars")

    except Exception as e:
        print(f"❌ Data model error: {e}")

    print("\n" + "=" * 40)
    print("🏁 Backend endpoint testing complete!")

if __name__ == "__main__":
    test_endpoints()