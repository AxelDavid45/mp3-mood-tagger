---
inclusion: auto
---

# Tech Stack

## Runtime & Package Manager

- **Node.js**: >=22 (ES modules only, `"type": "module"`)
- **Package Manager**: pnpm 10.29.1
- **License**: GPL-3.0

## Core Dependencies

| Package | Purpose |
|---------|---------|
| `music-metadata` | Read ID3/Vorbis tags from audio files (MP3, FLAC, M4A, etc.) |
| `flac-tagger` | Write Vorbis comments to FLAC files |
| `ai` + `@ai-sdk/anthropic` | Claude 3.5 Sonnet integration for AI analysis |
| `glob` | File pattern matching for batch processing |
| `pino` + `pino-pretty` | Structured logging with file and console output |
| `dotenv` | Environment variable management |

## Development Tools

- **Prettier**: Code formatting (config: `.prettierrc`, ignore: `.prettierignore`)
- **Format command**: `pnpm format` (runs Prettier on all files)

## Common Commands

```bash
# Install dependencies
pnpm install

# Format code
pnpm format

# Run CLI (after setup)
music-tagger --folder ./music
music-tagger --file song.flac
music-tagger --folder ./music --force
music-tagger --folder ./music --status
```

## Environment Setup

Required environment variables in `.env`:
```env
ANTHROPIC_API_KEY=your_key_here
LOG_LEVEL=info  # Optional: debug, info, warn, error
```

## File Format Support

- **Read**: MP3, FLAC, M4A, WAV (via `music-metadata`)
- **Write**: FLAC only (via `flac-tagger`)
- MP3 write support is planned but not yet implemented

## Logging Configuration

- **File logs**: `./logs/app.log` (all levels, structured JSON)
- **Console logs**: Errors only by default (colorized, human-readable)
- **Log level**: Controlled via `LOG_LEVEL` env var
- **Format**: Pino structured logging with pretty printing

## AI Model

- **Model**: Claude 3 Haiku (`claude-3-haiku-20240307`)
- **Max tokens**: 800 per request
- **Cost**: ~$0.00037 per track (~$3.70 per 10,000 tracks)
- **Capabilities**: Web search enabled for metadata verification
