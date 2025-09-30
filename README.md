# Lil IVR Bot Chrome Extension

A Swedish chatbot Chrome extension powered by OpenAI GPT-4 mini.

## Functionality

The extension injects a chatbot interface into any webpage you visit. The bot communicates in Swedish with a rapper personality, using slang and occasionally sharing lyrics from fictional rap tracks stored in the backend.

When you open a new page, the bot automatically analyzes the webpage content and provides a contextual greeting based on what it sees. During conversations, it maintains context and can help with questions about the current page or general topics.

The interface appears as a floating icon in the bottom-right corner that can be expanded into a full chat window. After periods of inactivity, the bot proactively sends messages to re-engage the user. All conversations are processed through a FastAPI backend that handles the OpenAI API integration and manages the bot's personality traits.

## Features

- Swedish rapper personality with slang expressions
- Webpage context analysis for contextual greetings
- Interactive chat interface with conversation history
- Random Swedish rap lyrics integration
- Proactive messaging after inactivity periods
- Dark theme with transparency and blur effects
- Minimizable floating interface
