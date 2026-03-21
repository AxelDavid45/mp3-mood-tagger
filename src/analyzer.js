import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import 'dotenv/config';
import logger from './logger.js';

/**
 * Analyzes a music file using Claude with web search capabilities
 * @param {string} filename - The music file name
 * @param {Object} existingTags - Current ID3 tags from the file
 * @param {string} userGuidance - Optional user guidance for better search
 * @returns {Promise<Object>} Analysis result with genre, year and comment
 */
export async function analyzeTrack(filename, existingTags = {}, userGuidance = '') {
  const { title, artist, album, genre: existingGenre, year: existingYear } = existingTags;
  
  logger.info({ 
    filename, 
    existingTags, 
    userGuidance 
  }, 'Starting track analysis');
  
  // Build a comprehensive search query from existing metadata
  const searchParts = [];
  if (artist) searchParts.push(`Artist: ${artist}`);
  if (title) searchParts.push(`Title: ${title}`);
  if (album) searchParts.push(`Album: ${album}`);
  if (existingGenre) searchParts.push(`Genre: ${existingGenre}`);
  if (existingYear) searchParts.push(`Year: ${existingYear}`);
  
  const searchQuery = searchParts.length > 0 
    ? searchParts.join(', ')
    : filename.replace(/\.(mp3|flac|wav|m4a)$/i, '');
  
  logger.debug({ searchQuery }, 'Built search query');
  
  const guidanceText = userGuidance ? `\n\nUser guidance: ${userGuidance}` : '';
  
  const prompt = `You are a music expert and DJ. Search the web to verify and complete the metadata for this track.

Existing metadata:
${searchQuery}
Filename: ${filename}${guidanceText}

CRITICAL INSTRUCTIONS: 
- DO NOT trust the existing genre tag - it may be incorrect or too generic
- Search the web to find the ACTUAL genre based on the track's sound, BPM, and style
- The existing genre is just a reference point, not the truth
- Verify ALL information by searching online (artist, title, release year)
- Classify the genre from a DJ perspective, not a generic music store perspective

Search and analyze:
1. Verify the artist name and track title are correct
2. Find the release year (search for official release date)
3. DETERMINE THE REAL GENRE by researching:
   - What genre do music databases (Beatport, Discogs, Spotify) list it as?
   - What BPM and style characteristics does it have?
   - What genre would DJs categorize this as?
   - Is the existing genre tag accurate or misleading?

After searching, provide:

1. **Genre**: ONE clear genre that DJs would use (e.g., "Reggaeton", "House", "Techno", "Hip Hop", "Afrobeats")
2. **Year**: The release year (YYYY format)
3. **DJ Comment**: Format as "[Context] · [Energy] · [Timing]"

Requirements:
- Genre MUST be verified through web search - ignore the existing tag if it's wrong
- Prioritize DJ-friendly genre classifications (Beatport, DJ pools, music databases)
- Year must be the actual release year found online
- Comment should be concise, no emojis, scannable in DJ software
- Choose ONLY ONE option from each category below

**Context (where/how to use - choose ONE):**
- Club (electronic dance music for nightclubs: House, Techno, Trance, EDM)
- Perreo (reggaeton/dembow for dancing close/grinding)
- Radio (commercial/mainstream appeal)
- Lounge (background/ambient music)
- Workout (high energy for exercise)
- Beach (tropical/summer vibes)
- Dinner (sophisticated background)

**Energy level (choose ONE):**
- Chill
- Relajado
- Medio tempo
- Energético
- Alta energía
- Intenso

**Timing (when to play - choose ONE):**
- Warm-up
- Opening
- Peak time
- Closing
- Early night
- Late night
- Afternoon

Return ONLY a valid JSON object (no markdown, no code blocks, no extra text):
{
  "genre": "Genre Name",
  "year": "2024",
  "comment": "Context · Energy · Timing",
  "confidence": "high|medium|low",
  "searchSummary": "Brief summary - avoid quotes and newlines"
}

IMPORTANT: Ensure searchSummary has no line breaks, control characters, or unescaped quotes.`;

  try {
    logger.debug({ prompt }, 'Sending prompt to Claude');
    
    const result = await generateText({
      model: anthropic('claude-3-haiku-20240307'),
      prompt,
      maxTokens: 800,
    });

    logger.debug({ response: result.text }, 'Received response from Claude');

    // Clean and parse the JSON response
    let cleanedText = result.text.trim();
    
    // Extract JSON if wrapped in markdown code blocks
    const jsonMatch = cleanedText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      cleanedText = jsonMatch[1].trim();
    }
    
    // Parse the JSON
    const analysis = JSON.parse(cleanedText);
    
    const successResult = {
      success: true,
      genre: analysis.genre,
      year: analysis.year,
      comment: analysis.comment,
      confidence: analysis.confidence || 'medium',
      searchSummary: analysis.searchSummary || 'No summary provided',
      source: 'claude_analysis'
    };
    
    logger.info({ 
      filename, 
      genre: successResult.genre, 
      year: successResult.year,
      confidence: successResult.confidence 
    }, 'Analysis completed successfully');
    
    return successResult;
    
  } catch (error) {
    logger.error({ 
      filename, 
      error: error.message, 
      stack: error.stack 
    }, 'Analysis failed');
    
    return {
      success: false,
      error: error.message,
      // Fallback values
      genre: existingGenre || 'Unknown',
      year: existingYear || '',
      comment: `${artist || 'Unknown Artist'} · Unknown genre · Manual review needed`,
      confidence: 'low',
      searchSummary: 'Analysis failed',
      source: 'fallback'
    };
  }
}
