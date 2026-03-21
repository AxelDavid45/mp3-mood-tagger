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
  
  const prompt = `You are a music expert. Search the web to verify and complete the metadata for this track.

Existing metadata:
${searchQuery}
Filename: ${filename}${guidanceText}

IMPORTANT: 
- Use the existing metadata as a starting point for your web search
- Verify the information is correct by searching online
- Find any missing information (especially release year if not provided)
- Correct any inaccurate genre classifications for DJ use

Search for:
1. Verify the artist name and track title are correct
2. Find the release year if not provided (or verify if provided)
3. Determine the best DJ-friendly genre (may differ from the existing genre tag)

After searching, provide:

1. **Genre**: ONE clear genre that DJs would use (e.g., "Reggaeton", "House", "Techno", "Hip Hop", "Afrobeats")
2. **Year**: The release year (YYYY format)
3. **DJ Comment**: Format as "[Use case] · [Energy] · [When to play]"

Requirements:
- Genre must be based on web search results and DJ classification
- Year must be the actual release year found online
- Comment should be concise, no emojis, scannable in DJ software

**Use case examples:**
- Club/Perreo
- Radio/Commercial
- Warm-up
- Peak time
- Opening
- Closing
- Dinner
- Beach
- Workout

**Energy examples (choose the most appropriate):**
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

**When to play examples:**
- Peak time
- Warm-up
- Cool down
- Opening
- Closing
- Early night
- Late night
- Afternoon

Return ONLY a JSON object:
{
  "genre": "Genre Name",
  "year": "2024",
  "comment": "Use case · Energy · When to play",
  "confidence": "high|medium|low",
  "searchSummary": "Brief summary of what you found online"
}`;

  try {
    logger.debug({ prompt }, 'Sending prompt to Claude');
    
    const result = await generateText({
      model: anthropic('claude-3-haiku-20240307'),
      prompt,
      maxTokens: 800,
    });

    logger.debug({ response: result.text }, 'Received response from Claude');

    // Parse the JSON response
    const analysis = JSON.parse(result.text.trim());
    
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
