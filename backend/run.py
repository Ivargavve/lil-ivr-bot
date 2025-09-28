#!/usr/bin/env python3
"""
Lil IVR Bot - Backend Startup Script

Simple script to start the FastAPI backend server.
"""

import os
import sys
import subprocess

def main():
    print("🎤 Starting Lil IVR Bot Backend...")

    # Check if .env file exists
    env_file = os.path.join(os.path.dirname(__file__), "../.env")
    if not os.path.exists(env_file):
        print("❌ .env file not found! Please create .env with your OPENAI_API_KEY")
        sys.exit(1)

    # Install dependencies
    print("📦 Installing Python dependencies...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
                      check=True, cwd=os.path.dirname(__file__))
    except subprocess.CalledProcessError:
        print("❌ Failed to install dependencies. Please check requirements.txt")
        sys.exit(1)

    # Start the FastAPI server
    print("🚀 Starting FastAPI server on http://localhost:8000")
    print("💡 Press Ctrl+C to stop the server")
    print("")

    try:
        subprocess.run([sys.executable, "-m", "uvicorn", "main:app",
                       "--reload", "--host", "0.0.0.0", "--port", "8000"],
                      cwd=os.path.dirname(__file__))
    except KeyboardInterrupt:
        print("\n👋 Backend stopped")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()