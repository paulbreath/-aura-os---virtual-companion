# CLAUDE.md - Project Configuration

This file contains project-specific configuration for AI assistants.

## Project: Aura OS - Virtual Companion

A React-based virtual companion app with Live2D character, AI chat, and media generation.

## Commands

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production
npm run start        # Start production server (port 5174)
npm run lint         # TypeScript type checking
```

## Tech Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS 4
- **Backend**: Express.js (server.js)
- **AI**: X.AI Grok 4.1 Fast, ModelsLab
- **Deployment**: Zeabur (Docker)
- **Real-time**: Live2D character display

## Project Structure

```
src/
├── App.tsx           # Main app component
├── components/       # React components
│   ├── AvatarCreator.tsx    # Character creation
│   ├── Live2DCharacter.tsx  # Live2D display
│   ├── VoiceChat.tsx        # Voice chat
│   └── CharacterAlbum.tsx   # Character album
├── services/         # Business logic
│   ├── aiService.ts        # AI service (Grok, ModelsLab)
│   ├── memoryService.ts    # User memory
│   └── live2dService.ts    # Live2D control
└── types/            # TypeScript types
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/modelslab` | POST | ModelsLab image generation proxy |
| `/api/modelslab/video` | POST | ModelsLab video generation proxy |
| `/api/xai/image` | POST | X.AI image generation proxy |

## gstack Skills

Use these skills for structured development:

### Planning
- `/office-hours` - YC-style product diagnostic
- `/plan` - Technical design

### Quality
- `/review` - Code review
- `/qa` - Automated browser testing
- `/security` - Security audit

### Deployment
- `/ship` - Build, test, commit, push
- `/deploy` - Deploy to Zeabur

## Development Principles

1. **Search Before Building** - Check for existing solutions first
2. **Completeness Principle** - Don't cut corners when complete is achievable
3. **Security First** - Never hardcode API keys, validate all input

## Environment Variables

Required:
- `XAI_API_KEY` or `VITE_XAI_API_KEY` - X.AI API key
- `MODELSLAB_API_KEY` or `VITE_MODELSLAB_API_KEY` - ModelsLab API key

Optional:
- `SPICY_API_KEY` - SpicyAPI for adult content
- `FAL_API_KEY` - FAL.AI for image generation

## Commit Style

```
feat: New feature
fix: Bug fix
refactor: Code refactoring
docs: Documentation update
style: Style adjustment
test: Test related
chore: Build/toolchain
```

## Troubleshooting

### Video generation fails?
Check if ModelsLab API is configured and has credits.

### Live2D not showing?
Verify model files exist in `live2d/` directory.

### API 404 after deployment?
Check Zeabur environment variables are set correctly.
