import { parseFile } from 'music-metadata';
import { readFlacTags, writeFlacTags } from 'flac-tagger';
import NodeID3 from 'node-id3';
import logger from './logger.js';

/**
 * Reads ID3 tags from a music file (supports MP3, FLAC, M4A, etc.)
 * @param {string} filePath - Path to the music file
 * @returns {Promise<Object>} Existing tags and metadata
 */
export async function readTags(filePath) {
  try {
    logger.info({ filePath }, 'Reading tags from file');
    
    // Use music-metadata for reading (supports FLAC and many formats)
    const metadata = await parseFile(filePath);
    const common = metadata.common;
    
    logger.debug({ metadata: common }, 'Parsed metadata');
    
    // Check if already analyzed by looking for custom tags
    const commentText = Array.isArray(common.comment) ? common.comment.join('; ') : (common.comment || '');
    const isAnalyzed = commentText.includes('GenreTaggerStatus:analyzed');
    
    const analyzedDate = commentText.match(/GenreTaggerDate:(\d{4}-\d{2}-\d{2})/)?.[1] || null;
    
    const result = {
      success: true,
      tags: {
        title: common.title || '',
        artist: common.artist || '',
        album: common.album || '',
        albumArtist: common.albumartist || common.artist || '',
        genre: Array.isArray(common.genre) ? common.genre[0] : (common.genre || ''),
        year: common.year?.toString() || '',
        comment: commentText,
      },
      isAnalyzed,
      analyzedDate
    };
    
    logger.info({ 
      filePath, 
      artist: result.tags.artist, 
      title: result.tags.title,
      isAnalyzed 
    }, 'Tags read successfully');
    
    return result;
  } catch (error) {
    logger.error({ filePath, error: error.message, stack: error.stack }, 'Error reading tags');
    return {
      success: false,
      error: error.message,
      tags: {},
      isAnalyzed: false
    };
  }
}

/**
 * Writes updated tags to an MP3 file using ID3v2
 * @param {string} filePath - Path to the MP3 file
 * @param {Object} newTags - Tags to write
 * @param {Object} analysis - Analysis results
 * @returns {Promise<Object>} Write result
 */
async function writeMp3Tags(filePath, newTags, analysis) {
  try {
    logger.info({ filePath, newTags }, 'Writing MP3 tags');
    
    // Read existing tags
    const existingTags = NodeID3.read(filePath);
    logger.debug({ existingTags }, 'Existing MP3 tags');
    
    // Build updated tags
    const tags = {
      genre: newTags.genre || analysis.genre,
      year: newTags.year || analysis.year,
      comment: {
        language: 'eng',
        text: newTags.comment || analysis.comment
      },
      // Add custom TXXX frames for tracking
      userDefinedText: [
        {
          description: 'GenreTaggerStatus',
          value: 'analyzed'
        },
        {
          description: 'GenreTaggerDate',
          value: new Date().toISOString().split('T')[0]
        },
        {
          description: 'GenreTaggerSource',
          value: analysis.source || 'claude_analysis'
        },
        {
          description: 'GenreTaggerConfidence',
          value: analysis.confidence || 'medium'
        }
      ]
    };
    
    logger.debug({ tags }, 'Updated MP3 tags');
    
    // Write tags
    const success = NodeID3.write(tags, filePath);
    
    if (!success) {
      throw new Error('Failed to write MP3 tags');
    }
    
    logger.info({ filePath }, 'MP3 tags written successfully');
    
    return {
      success: true,
      message: 'Tags updated successfully'
    };
    
  } catch (error) {
    logger.error({ 
      filePath, 
      error: error.message, 
      stack: error.stack 
    }, 'Error writing MP3 tags');
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Writes updated tags to a FLAC file using vorbis comments
 * @param {string} filePath - Path to the FLAC file
 * @param {Object} newTags - Tags to write
 * @param {Object} analysis - Analysis results
 * @returns {Promise<Object>} Write result
 */
async function writeFlacTagsToFile(filePath, newTags, analysis) {
  try {
    logger.info({ filePath, newTags }, 'Writing FLAC tags');
    
    // Read existing tags first
    const existingFlacTags = await readFlacTags(filePath);
    logger.debug({ existingTags: existingFlacTags.tagMap }, 'Existing FLAC tags');
    
    // Build updated tag map
    const tagMap = {
      ...existingFlacTags.tagMap,
      GENRE: newTags.genre || analysis.genre,
      DATE: newTags.year || analysis.year,
      COMMENT: newTags.comment || analysis.comment,
      // Add custom tracking tags
      GENRETAGGERSTATUS: 'analyzed',
      GENRETAGGERDATE: new Date().toISOString().split('T')[0],
      GENRETAGGERSOURCE: analysis.source || 'claude_analysis',
      GENRETAGGERCONFIDENCE: analysis.confidence || 'medium'
    };
    
    logger.debug({ tagMap }, 'Updated FLAC tag map');
    
    // Write tags back to file
    await writeFlacTags(
      {
        tagMap,
        picture: existingFlacTags.picture // Preserve existing cover art
      },
      filePath
    );
    
    logger.info({ filePath }, 'FLAC tags written successfully');
    
    return {
      success: true,
      message: 'Tags updated successfully'
    };
    
  } catch (error) {
    logger.error({ 
      filePath, 
      error: error.message, 
      stack: error.stack 
    }, 'Error writing FLAC tags');
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Writes updated tags to a music file
 * @param {string} filePath - Path to the music file
 * @param {Object} newTags - Tags to write
 * @param {Object} analysis - Analysis results
 * @returns {Promise<Object>} Write result
 */
export async function writeTags(filePath, newTags, analysis) {
  try {
    logger.info({ filePath, newTags, analysis }, 'Starting tag write operation');
    
    // Detect file type
    const ext = filePath.toLowerCase().split('.').pop();
    
    if (ext === 'flac') {
      return await writeFlacTagsToFile(filePath, newTags, analysis);
    }
    
    if (ext === 'mp3') {
      return await writeMp3Tags(filePath, newTags, analysis);
    }
    
    // For other formats, we'll need to add support later
    logger.warn({ filePath, ext }, 'Unsupported file format for writing');
    return {
      success: false,
      error: `Writing tags for ${ext} files is not yet supported. Currently only FLAC and MP3 are supported.`
    };
    
  } catch (error) {
    logger.error({ 
      filePath, 
      error: error.message, 
      stack: error.stack 
    }, 'Error in writeTags');
    
    return {
      success: false,
      error: error.message
    };
  }
}
