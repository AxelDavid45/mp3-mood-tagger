# Genre Tagger

A Node.js CLI tool that analyzes your DJ music files, fetches metadata from Spotify, uses GPT-4o mini to pick the best genre and generate DJ comments, then writes everything to the file's ID3 tags.

## Data Sources

| Priority | Source                       | When                                  |
| -------- | ---------------------------- | ------------------------------------- |
| 1        | **Spotify API**              | Primary - structured metadata         |
| 2        | **GPT-4o mini + web search** | Fallback or when Spotify has no match |

## What Gets Written to Files

### Standard ID3 Tags

| Tag          | Content                                     | Example                                                       |
| ------------ | ------------------------------------------- | ------------------------------------------------------------- |
| Title        | Track name                                  | "La Ni Merma"                                                 |
| Artist       | Main artist                                 | "Mora"                                                        |
| Album        | Album name                                  | "Estrella"                                                    |
| Album Artist | All artists (main + features)               | "Mora, Jhayco"                                                |
| Genre        | Predominant (LLM picks from Spotify genres) | "Reggaeton"                                                   |
| Year         | Release year                                | "2022"                                                        |
| Comment      | DJ context                                  | "Club/Perreo · Mora & Jhayco (PR) · Alta energia · Peak time" |

### Custom ID3 Tags

| Tag                      | Content           |
| ------------------------ | ----------------- |
| `TXXX:GenreTaggerStatus` | "analyzed"        |
| `TXXX:GenreTaggerDate`   | "2026-01-30"      |
| `TXXX:GenreTaggerSource` | "spotify" / "llm" |

## Comment Format

```txt
[Use case] · [Artists + origin] · [Energy] · [When to play]
```

No emojis. Clean and scannable in DJ software.

## Genre Logic

- No fixed taxonomy
- Spotify provides artist genres
- LLM picks the **predominant/most useful** genre for DJ mixing
- If multiple genres, LLM chooses one

## Spotify Rate Limit Handling

- 200ms delay between requests
- On 429 → wait `Retry-After` seconds → retry
- On repeated failure → fallback to LLM with web search

## Tech Stack

| Purpose       | Package                |
| ------------- | ---------------------- |
| ID3 tags      | `node-id3`             |
| Spotify API   | `spotify-web-api-node` |
| OpenAI        | `openai`               |
| CLI           | `commander`            |
| File scanning | `glob`                 |
| Environment   | `dotenv`               |

## Project Structure

```txt
genre-tagger/
├── src/
│   ├── index.js           # CLI entry point
│   ├── tagger.js          # ID3 read/write
│   ├── spotify.js         # Spotify API client
│   ├── llm.js             # OpenAI client
│   └── analyzer.js        # Main orchestration
├── .env                   # API keys (gitignored)
├── .env.example           # Template
├── package.json
└── README.md
```

## CLI Usage

```bash
# Analyze folder (skips already tagged)
npx genre-tagger analyze /path/to/music

# Force re-analyze
npx genre-tagger analyze /path/to/music --force

# Check status
npx genre-tagger status /path/to/music
```

## Workflow

```txt
Read file → Check if analyzed → Fetch Spotify
→ LLM picks genre + writes comment → You review → Write tags
```

## Setup

### Prerequisites

1. **Spotify Developer app** → [developer.spotify.com](https://developer.spotify.com)
2. **OpenAI API key** → [platform.openai.com](https://platform.openai.com)

### Installation

```bash
npm install
cp .env.example .env
# Edit .env with your API keys
```

### Configuration

```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
OPENAI_API_KEY=your_openai_key
```

## License

GPL-3.0
