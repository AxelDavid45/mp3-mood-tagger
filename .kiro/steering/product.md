---
inclusion: auto
---

# Product Overview

Music Tagger CLI is a Node.js command-line tool that analyzes DJ music files and automatically tags them with accurate metadata using Claude 3.5 Sonnet AI.

## Core Purpose

Automate the tedious process of tagging music files for DJs by:
- Researching track metadata using AI with web search capabilities
- Selecting the most DJ-relevant genre (not just the official genre)
- Generating scannable DJ comments with use case, energy level, and timing info
- Writing standardized ID3/Vorbis tags to music files

## Key Features

- AI-powered metadata research and verification using Claude
- Interactive confirmation workflow (accept/reject/retry with guidance)
- Smart skip logic (won't re-analyze unless forced)
- Status tracking via custom tags
- Batch folder processing or single file mode
- Structured logging for observability

## Target Users

DJs who need to organize large music libraries with consistent, DJ-friendly metadata that's optimized for mixing and track selection during performances.

## Comment Format Standard

All DJ comments follow this exact format:
```
[Use case] · [Energy] · [When to play]
```

Example: `Club/Perreo · Alta energia · Peak time`

No emojis. Clean and scannable in DJ software like Rekordbox, Serato, or Traktor.
