---
inclusion: auto
---

# Project Structure

## Directory Layout

```
music-tagger-cli/
├── src/                    # Source code
│   ├── cli.js             # CLI entry point, arg parsing, user interaction
│   ├── analyzer.js        # Claude AI integration for track analysis
│   ├── tagger.js          # ID3/Vorbis tag read/write operations
│   └── logger.js          # Pino logger configuration
├── logs/                   # Log files (gitignored)
│   └── app.log            # Structured application logs
├── music/                  # Test music files (gitignored)
├── .env                    # Environment variables (gitignored)
├── .env.example           # Environment template
├── package.json           # Dependencies and scripts
└── README.md              # Documentation

```

## Module Responsibilities

### `src/cli.js`
- CLI argument parsing using Node.js `parseArgs`
- User interaction (confirmation prompts, retry logic)
- File/folder processing orchestration
- Status reporting
- Styled console output using `styleText`
- Entry point: `music-tagger` binary

### `src/analyzer.js`
- Claude AI integration via Vercel AI SDK
- Prompt engineering for music metadata analysis
- Web search query construction from existing tags
- JSON response parsing
- Error handling with fallback values

### `src/tagger.js`
- Read tags: `music-metadata` for all formats
- Write tags: `flac-tagger` for FLAC files
- Custom tag management (GenreTaggerStatus, GenreTaggerDate, etc.)
- Vorbis comment handling for FLAC

### `src/logger.js`
- Pino logger setup with dual transports
- File logging (all levels, JSON format)
- Console logging (errors only, colorized)
- Automatic logs directory creation

## Code Conventions

### ES Modules
- All files use ES module syntax (`import`/`export`)
- No CommonJS (`require`)
- File extensions required in imports (`.js`)

### Async/Await
- All I/O operations use async/await
- No callbacks or raw promises in business logic
- Error handling via try/catch blocks

### Logging Pattern
```javascript
logger.info({ context }, 'message');
logger.debug({ details }, 'debug message');
logger.error({ error: error.message, stack: error.stack }, 'error message');
```

### Function Documentation
- JSDoc comments for exported functions
- Include `@param` and `@returns` tags
- Describe purpose and behavior

### Error Handling
- Return objects with `{ success: boolean, error?: string, ...data }`
- Log errors before returning
- Provide fallback values when appropriate

### User Interaction
- Use `styleText` for colored console output
- Consistent emoji usage (🎵 📁 ✅ ❌ ⚠️ 🤖 💾)
- Interactive prompts via `readline` interface

## File Naming

- Lowercase with hyphens for multi-word files (not used yet, but convention)
- `.js` extension for all JavaScript files
- No TypeScript (pure JavaScript project)

## Ignored Paths

Key gitignored items:
- `node_modules/`
- `.env` (but not `.env.example`)
- `logs/` and `*.log`
- `music/` (test files)
- `.DS_Store`
