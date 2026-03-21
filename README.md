# Genre Tagger

A Node.js CLI tool that analyzes your DJ music files, uses Claude 3.5 Sonnet to research metadata, pick the best genre and generate DJ comments, then writes everything to the file's ID3 tags.

## Data Sources

| Priority | Source                 | When                              |
| -------- | ---------------------- | --------------------------------- |
| 1        | **Claude 3.5 Sonnet** | AI analysis with music knowledge |

## What Gets Written to Files

### Standard ID3 Tags

| Tag          | Content                                   | Example                                                       |
| ------------ | ----------------------------------------- | ------------------------------------------------------------- |
| Title        | Track name                                | "La Ni Merma"                                                 |
| Artist       | Main artist                               | "Mora"                                                        |
| Album        | Album name                                | "Estrella"                                                    |
| Album Artist | All artists (main + features)            | "Mora, Jhayco"                                                |
| Genre        | Predominant (Claude picks best for DJs)  | "Reggaeton"                                                   |
| Year         | Release year                              | "2022"                                                        |
| Comment      | DJ context                                | "Club/Perreo · Alta energia · Peak time" |

### Custom ID3 Tags

| Tag                      | Content           |
| ------------------------ | ----------------- |
| `TXXX:GenreTaggerStatus` | "analyzed"        |
| `TXXX:GenreTaggerDate`   | "2026-01-30"      |
| `TXXX:GenreTaggerSource` | "claude_analysis" |

## Comment Format

```txt
[Use case] · [Energy] · [When to play]
```

Example: "Club/Perreo · Alta energia · Peak time"

No emojis. Clean and scannable in DJ software.

## Energy Catalog Examples

**Use Cases:**
- Club/Perreo
- Radio/Commercial
- Warm-up
- Peak time
- Opening
- Closing
- Dinner
- Beach
- Workout

**Energy Levels:**
- Chill
- Easy Listening
- Perreo
- Chill Perreo
- Reggaeton Suave
- Medio tempo
- Alta energia
- Intenso
- Energético
- Relajado
- Morning Breakfast
- Dinner vibe

**When to Play:**
- Peak time
- Warm-up
- Cool down
- Opening
- Closing
- Early night
- Late night
- Afternoon

## Genre Logic

- No fixed taxonomy
- Claude researches artist and track information using its training data
- Claude picks the **predominant/most useful** genre for DJ mixing
- If multiple genres found, Claude chooses the most relevant one

## Analysis Features

- Claude uses its extensive training data for music knowledge
- No external API rate limits to manage
- Fast and reliable analysis
- Handles multiple audio formats (MP3, FLAC)
- Supports writing tags to MP3 (ID3v2) and FLAC (Vorbis Comments)

## Tech Stack

| Purpose       | Package                    |
| ------------- | -------------------------- |
| ID3 tags (read) | `music-metadata`         |
| FLAC tags (write) | `flac-tagger`            |
| MP3 tags (write) | `node-id3`                |
| AI Analysis   | `ai` + `@ai-sdk/anthropic` |
| Logging       | `pino` + `pino-pretty`     |
| CLI           | Node.js built-in           |
| File scanning | `glob`                     |
| Environment   | `dotenv`                   |

## Logging & Observability

The application uses Pino for structured logging with the following features:

- **File logging**: All logs are written to `./logs/app.log`
- **Console logging**: Errors are displayed in the console with colors
- **Log levels**: info, debug, warn, error
- **Structured data**: All logs include contextual information (file paths, tags, errors, etc.)

### Log Files

Logs are stored in the `logs/` directory:
- `logs/app.log` - Complete application log with all operations

### Viewing Logs

```bash
# View recent logs
tail -f logs/app.log

# Search for errors
grep ERROR logs/app.log

# View logs for a specific file
grep "ESQUIRLA" logs/app.log
```

### Log Levels

Set the `LOG_LEVEL` environment variable to control verbosity:

```bash
# Show debug logs in console
LOG_LEVEL=debug node src/cli.js --file song.flac

# Show only errors
LOG_LEVEL=error node src/cli.js --folder ./music
```

## Project Structure

```txt
genre-tagger/
├── src/
│   ├── cli.js             # CLI entry point
│   ├── tagger.js          # ID3 read/write
│   ├── analyzer.js        # Claude 3.5 Sonnet analysis
│   └── utils.js           # Helpers
├── .env                   # API keys (gitignored)
├── .env.example           # Template
├── package.json
└── README.md
```

## CLI Usage

```bash
# Analyze folder (skips already tagged)
music-tagger --folder /path/to/music

# Analyze single file
music-tagger --file song.mp3

# Force re-analyze
music-tagger --folder /path/to/music --force

# Check status
music-tagger --folder /path/to/music --status
```

## Workflow

```txt
Read file → Check if analyzed → Claude analysis for metadata
→ Claude picks genre + writes comment → You review → Write tags
```

## Setup

### Prerequisites

1. **Anthropic API key** → [console.anthropic.com](https://console.anthropic.com)

### Cost Estimation

Using Claude 3 Haiku (most economical model):
- **Input**: $0.25 per million tokens
- **Output**: $1.25 per million tokens

Typical usage per track:
- ~500 input tokens (metadata + prompt)
- ~200 output tokens (analysis result)
- **Cost per track**: ~$0.00037 (less than 0.04 cents)

For 1,000 tracks: ~$0.37 USD

For 10,000 tracks: ~$3.70 USD

Note: Costs may vary based on:
- Length of existing metadata
- Complexity of web search results
- Number of retries requested

### Installation

```bash
pnpm install
cp .env.example .env
# Edit .env with your Anthropic API key
```

### Configuration

```env
ANTHROPIC_API_KEY=your_anthropic_key_here
```

## License

GPL-3.0