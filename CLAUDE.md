# Claude Code Configuration

## Search Tools
- Use `rg` (ripgrep) instead of `grep` for all search operations
- ripgrep is faster and more feature-rich than traditional grep

## Development Methodology
- Follow Test-Driven Development (TDD) practices
- Write tests before implementing features
- Red-Green-Refactor cycle: write failing test, make it pass, then refactor

## Commands
- Search: `rg <pattern>` instead of `grep <pattern>`
- Test: `npm test` - runs validation and compatibility tests
- Build: `npm run build` - builds the Chrome extension to dist/
- Backend: `npm run start:backend` - starts the FastAPI server
- Clean: `npm run clean` - removes the dist folder

## Project Guidelines
- Only use the extension folder (frontend folder has been removed)
- Follow dark mode design with transparency and blur effects
- Use grey color scheme instead of purple/pink theme
- Maintain rounded corners throughout the UI (25px for containers, 20px for bubbles)
- Extension files are copied to dist/ folder during build process

## File Structure
- `/extension/` - Main Chrome extension source files
- `/backend/` - FastAPI server for chat functionality
- `/testing/` - Test scripts and validation
- `/dist/` - Built extension files (generated, not committed)

## API Configuration
- Backend runs on `http://localhost:8000`
- OpenAI API key stored in `.env` file
- Extension communicates with backend via REST API