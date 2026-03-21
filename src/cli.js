#!/usr/bin/env node
import { parseArgs, styleText } from "node:util";
import { createInterface } from "node:readline";
import { glob } from "glob";
import { analyzeTrack } from "./analyzer.js";
import { readTags, writeTags } from "./tagger.js";
import path from "node:path";

function renderHelp(options) {
  console.log(styleText("cyan", "🎵 Genre Tagger - AI-powered music file analyzer"));
  console.log(styleText("cyan", "\nUsage: music-tagger [options]"));
  console.log(styleText("cyan", "\nOptions:"));
  Object.entries(options).forEach(([key, option]) => {
    const short = option.short ? `-${option.short}, ` : "";
    console.log(
      styleText(
        "cyan",
        `  ${short}--${key}${option.type === "boolean" ? "" : ` <${option.type}>`}`,
      ),
    );
    if (option.description) {
      console.log(styleText("gray", `    ${option.description}`));
    }
  });
  
  console.log(styleText("yellow", "\nExamples:"));
  console.log("  music-tagger --folder ./music");
  console.log("  music-tagger --file song.mp3 --force");
  console.log("  music-tagger --folder ./music --status");
  
  process.exit(0);
}

async function askUser(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function confirmAnalysis(analysis, filename) {
  console.log(styleText("yellow", "\n🔍 Web search results:"));
  console.log(styleText("gray", `   ${analysis.searchSummary}`));
  console.log(styleText("yellow", "\n📋 Proposed tags:"));
  console.log(styleText("cyan", `   File: ${filename}`));
  console.log(styleText("cyan", `   Genre: ${analysis.genre}`));
  console.log(styleText("cyan", `   Year: ${analysis.year}`));
  console.log(styleText("cyan", `   Comment: ${analysis.comment}`));
  console.log(styleText("cyan", `   Confidence: ${analysis.confidence}`));
  
  const response = await askUser("\n✅ Accept these tags? (y/n/retry): ");
  
  if (response.toLowerCase() === 'y' || response.toLowerCase() === 'yes') {
    return { accepted: true, analysis };
  }
  
  if (response.toLowerCase() === 'n' || response.toLowerCase() === 'no') {
    console.log(styleText("yellow", "❌ Tags rejected. Skipping file."));
    return { accepted: false };
  }
  
  if (response.toLowerCase() === 'retry' || response.toLowerCase() === 'r') {
    const guidance = await askUser("💡 Provide additional context (artist name, album, year, etc.): ");
    return { accepted: false, retry: true, guidance };
  }
  
  // Default to asking again if unclear response
  console.log(styleText("yellow", "Please answer 'y' for yes, 'n' for no, or 'retry' to search again"));
  return await confirmAnalysis(analysis, filename);
}

async function processFile(filePath, force = false) {
  console.log(styleText("blue", `\n📁 Processing: ${path.basename(filePath)}`));
  
  // Read existing tags
  const tagResult = await readTags(filePath);
  if (!tagResult.success) {
    console.log(styleText("red", `❌ Error reading tags: ${tagResult.error}`));
    return { success: false, error: tagResult.error };
  }
  
  // Skip if already analyzed (unless force)
  if (tagResult.isAnalyzed && !force) {
    console.log(styleText("yellow", `⏭️  Already analyzed (${tagResult.analyzedDate}), use --force to re-analyze`));
    return { success: true, skipped: true };
  }
  
  // Show current info
  const { tags } = tagResult;
  console.log(styleText("gray", `   Artist: ${tags.artist || 'Unknown'}`));
  console.log(styleText("gray", `   Title: ${tags.title || 'Unknown'}`));
  console.log(styleText("gray", `   Album: ${tags.album || 'Unknown'}`));
  console.log(styleText("gray", `   Current Genre: ${tags.genre || 'None'}`));
  console.log(styleText("gray", `   Current Year: ${tags.year || 'None'}`));
  
  let analysis;
  let userGuidance = '';
  
  // Analysis loop with retry option
  while (true) {
    // Analyze with AI
    console.log(styleText("blue", "🤖 Searching web and analyzing..."));
    analysis = await analyzeTrack(path.basename(filePath), tags, userGuidance);
    
    if (!analysis.success) {
      console.log(styleText("red", `❌ Analysis failed: ${analysis.error}`));
      return analysis;
    }
    
    // Ask user for confirmation
    const confirmation = await confirmAnalysis(analysis, path.basename(filePath));
    
    if (confirmation.accepted) {
      analysis = confirmation.analysis;
      break;
    }
    
    if (confirmation.retry) {
      userGuidance = confirmation.guidance;
      continue;
    }
    
    // User rejected without retry
    return { success: false, skipped: true };
  }
  
  // Write tags
  console.log(styleText("blue", "\n💾 Saving tags..."));
  const writeResult = await writeTags(filePath, {
    genre: analysis.genre,
    year: analysis.year,
    comment: analysis.comment
  }, analysis);
  
  if (writeResult.success) {
    console.log(styleText("green", "✅ Tags saved successfully"));
  } else {
    console.log(styleText("red", `❌ Failed to save tags: ${writeResult.error}`));
  }
  
  return { success: writeResult.success, analysis };
}

async function showStatus(targetPath) {
  const isFile = targetPath.endsWith('.mp3') || targetPath.endsWith('.flac');
  const files = isFile ? [targetPath] : await glob(`${targetPath}/**/*.{mp3,flac}`, { nodir: true });
  
  console.log(styleText("cyan", `\n📊 Status Report for: ${targetPath}`));
  console.log(styleText("gray", `Found ${files.length} audio files\n`));
  
  let analyzed = 0;
  let unanalyzed = 0;
  
  for (const file of files) {
    const tagResult = await readTags(file);
    if (tagResult.success && tagResult.isAnalyzed) {
      analyzed++;
      console.log(styleText("green", `✅ ${path.basename(file)} (${tagResult.analyzedDate})`));
    } else {
      unanalyzed++;
      console.log(styleText("yellow", `⏳ ${path.basename(file)}`));
    }
  }
  
  console.log(styleText("cyan", `\n📈 Summary: ${analyzed} analyzed, ${unanalyzed} pending`));
}

const options = {
  folder: {
    type: "string",
    short: "f",
    description: "Path to folder containing music files",
  },
  file: { 
    type: "string", 
    description: "Path to a specific music file" 
  },
  force: {
    type: "boolean",
    description: "Re-analyze already processed files"
  },
  status: {
    type: "boolean",
    short: "s",
    description: "Show analysis status of files"
  },
  help: {
    type: "boolean",
    short: "h",
    description: "Show help information",
  },
};

try {
  const { values } = parseArgs({ options });

  if (!Object.keys(values).length || values.help) {
    renderHelp(options);
  }

  // Check for required environment
  if (!process.env.ANTHROPIC_API_KEY && !values.status) {
    console.error(styleText("red", "❌ ANTHROPIC_API_KEY environment variable is required"));
    console.log(styleText("yellow", "💡 Copy .env.example to .env and add your Anthropic API key"));
    process.exit(1);
  }

  if (values.status) {
    const targetPath = values.folder || values.file;
    if (!targetPath) {
      console.error(styleText("red", "❌ Please specify --folder or --file for status check"));
      process.exit(1);
    }
    await showStatus(targetPath);
    process.exit(0);
  }

  if (values.file) {
    // Process single file
    const result = await processFile(values.file, values.force);
    process.exit(result.success ? 0 : 1);
  }

  if (values.folder) {
    // Process folder
    const files = await glob(`${values.folder}/**/*.{mp3,flac}`, { nodir: true });
    
    if (files.length === 0) {
      console.log(styleText("yellow", "⚠️  No audio files found in the specified folder"));
      process.exit(0);
    }
    
    console.log(styleText("cyan", `🎵 Found ${files.length} audio files`));
    
    let processed = 0;
    let skipped = 0;
    let failed = 0;
    
    for (const file of files) {
      const result = await processFile(file, values.force);
      if (result.success) {
        if (result.skipped) {
          skipped++;
        } else {
          processed++;
        }
      } else {
        failed++;
      }
    }
    
    console.log(styleText("cyan", `\n📈 Summary: ${processed} processed, ${skipped} skipped, ${failed} failed`));
    process.exit(failed > 0 ? 1 : 0);
  }

  console.error(styleText("red", "❌ Please specify --folder or --file"));
  renderHelp(options);

} catch (error) {
  if (error.code === "ERR_PARSE_ARGS_UNKNOWN_OPTION") {
    console.error(
      styleText(
        "yellow",
        `${error.message}, use --help to see available options.`,
      ),
    );
  } else {
    console.error(
      styleText(
        "red",
        `Error: ${error.message}`,
      ),
    );
  }

  process.exit(1);
}
