import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import 'dotenv/config';
import logger from './logger.js';
import { z } from 'zod';

/**
 * Analyzes a music file using Claude with web search capabilities
 * @param {string} filename - The music file name
 * @param {Object} existingTags - Current ID3 tags from the file
 * @param {string} userGuidance - Optional user guidance for better search
 * @returns {Promise<Object>} Analysis result with genre, year and comment
 */
export async function analyzeTrack(filename, existingTags = {}, userGuidance = '') {
  const { title, artist, album, genre: existingGenre, year: existingYear, bpm } = existingTags;

  logger.info({
    filename,
    existingTags,
    userGuidance
  }, 'Starting track analysis');

  const bpmText = bpm ? `\n"bpm_tag": ${bpm}` : '\n"bpm_tag": null';
  
  const prompt = `Music Tagging Agent — DJ Library Edition

Role
Eres un agente de catalogación musical para DJs. Recibes metadata parcial (posiblemente incorrecta) de un track y usas web search para verificar, corregir y enriquecer esa metadata con información útil para mezcla.

Entrada
{
  "filename": "${filename}",
  "artist": "${artist || 'null'}",
  "title": "${title || 'null'}",
  "album": "${album || 'null'}",
  "genre_tag": "${existingGenre || 'null'} — HIPÓTESIS NO VERIFICADA",
  "year_tag": "${existingYear || 'null'} — HIPÓTESIS NO VERIFICADA",${bpmText},
  "key_tag": null,
  "user_notes": "${userGuidance || 'null'}"
}

Regla fundamental: los campos genre_tag y year_tag son hipótesis sin verificar. Pueden ser correctos, parcialmente correctos, o completamente erróneos. Tu trabajo es confirmarlos o reemplazarlos con datos verificados.

Workflow (sigue estos pasos en orden)

Paso 1 — Verificar identidad del track
Busca en la web para confirmar:
- Que el artista y título son correctos (a veces los tags tienen typos o nombres invertidos)
- Si el filename sugiere algo diferente a los tags, investiga ambas posibilidades
- Si no puedes confirmar la identidad del track, indica confidence: "low" y explica en searchSummary.
- Si encuentras el artista, título o álbum correcto/completo, devuélvelos en el output (incluso si faltaban en la entrada)

Paso 2 — Verificar año de release
Busca la fecha de lanzamiento en fuentes oficiales (Discogs, Spotify, Beatport, Wikipedia, sitio del sello).
Prioridad de fuentes:
1. Fecha de lanzamiento del single (si fue single)
2. Fecha de lanzamiento del álbum donde apareció
3. Fecha de primera aparición en plataformas digitales

Devuelve el año en formato YYYY. Si hay discrepancia entre fuentes, usa la fecha más temprana de lanzamiento oficial.

Paso 3 — Clasificar género
Busca el género de ESTE TRACK específico, no del artista en general.
Busca en Beatport, Discogs, Spotify y AllMusic cómo clasifican este track. Luego elige el subgénero más específico que sea preciso.

Reglas de clasificación:
- Elige un solo género (el más específico y preciso)
- Prioriza clasificaciones de Beatport y Discogs sobre Spotify (Spotify tiende a ser genérico)
- Si el BPM está disponible, úsalo para validar tu clasificación
- Si el genre_tag existente resulta ser correcto, confírmalo — no lo cambies solo por cambiar

Referencia de BPM por género:
- 70-85: Downtempo, Trip Hop, Lo-Fi, R&B lento
- 85-100: Reggaeton, Dembow, Trap, Hip Hop, Dancehall
- 100-115: Pop, Latin Pop, Moombahton, Afrobeats
- 115-125: Deep House, Indie Dance, Nu-Disco, UK Garage
- 122-130: Tech House, House, Melodic House, Afro House
- 128-138: Techno, Progressive House, Trance, EDM
- 135-150: Hard Techno, Psytrance, Hard Dance
- 160-180: Drum & Bass, Jungle
- Variable: Salsa (90-130), Cumbia (90-110), Bachata (125-135), Merengue (130-160)

Vocabulario de géneros (no limitativo):
Electrónica: Deep House, Tech House, Progressive House, Afro House, Melodic House, Minimal House, Melodic Techno, Peak Time Techno, Minimal Techno, Hard Techno, Dub Techno, Acid Techno, Trance, Psytrance, Drum & Bass, Liquid DnB, Dubstep, UK Garage, Breaks, Nu-Disco, Ambient, Downtempo, IDM

Latin: Reggaeton, Dembow, Trap Latino, Latin Pop, Salsa, Bachata, Merengue, Cumbia, Cumbia Digital, Guaracha, Tribal, Banda, Regional Mexicano, Corridos Tumbados

Urban: Hip Hop, Trap, R&B, Neo-Soul, Afrobeats, Amapiano, Dancehall, Jersey Club, Phonk

Pop / Rock / Other: Synthpop, Indie Dance, Electropop, Pop, Rock, Alternative, Funk, Disco, Soul

Paso 4 — Generar DJ comment
El comment tiene dos partes: la etiqueta rápida y las notas de mezcla.

Parte A: Etiqueta rápida (obligatoria)
Formato: [Contexto] · [Energía] · [Timing]

Contexto — elige UNO:
- Pista: Tracks bailables no-electrónicos (salsa, merengue, cumbia, dance pop)
- Perreo: Reggaeton, dembow, para baile cercano/grinding
- Electrónica: House, Techno, Trance, EDM — clubs y raves
- Radio: Pop comercial, mainstream, radio-friendly
- Ambiente: Background, lounge, chill, no es para bailar
- Workout: Alta energía para ejercicio
- Playa: Tropical, summer vibes, pool party
- Romántico: Baladas, canciones lentas, amor
- Fiesta: Party anthems, celebración, sing-alongs
- Urbano: Hip hop, trap, R&B — no encaja en Pista ni Perreo

Energía — elige UNO:
- Chill: Muy baja energía, ambient, almost-no-beat
- Relajado: Baja, groove suave, easy listening
- Medio tempo: Energía sostenida, ni sube ni baja
- Energético: Empuja el dancefloor, buen drive
- Alta energía: Peak, la gente está brincando
- Intenso: Máxima potencia, banger

Timing — elige UNO:
- Warm-up: Primeros tracks, establecer mood
- Opening: Ya arrancó el set, construyendo
- Early night: Primera hora fuerte
- Peak time: Clímax del set
- Late night: Después del peak, manteniendo
- Closing: Últimos tracks, bajando
- Afternoon: Sets de día, pool, terrazas

Parte B: Notas de mezcla (opcional, si hay info útil)
Después de la etiqueta rápida, puedes agregar notas breves separadas por //. Solo incluye notas si aportan valor real para mezclar:
- Estructura: Intro larga, Drop @2:30, Breakdown largo, Outro sin beat
- Vocals: Vocal completa, Vocal chops, Acapella section, Spoken word
- Warnings: Cambio de BPM, Break inesperado, Fade-out largo
- Carácter: Clásico, Remix, Edit, Mashup-friendly

Ejemplos de comments completos:
- Perreo · Energético · Peak time // Dembow pesado, vocal catchy
- Electrónica · Medio tempo · Late night // Intro 32 bars, breakdown melódico @3:20
- Pista · Alta energía · Peak time // Salsa dura, trompetas dominan
- Fiesta · Energético · Early night // Sing-along, transition fácil
- Ambiente · Chill · Warm-up
- Urbano · Relajado · Opening // Beat switch @2:45, cuidado

Criterios de confianza:
- high: Encontraste el track en al menos 2 fuentes, género y año confirmados, sin ambigüedad
- medium: Encontraste info parcial, o las fuentes no coinciden del todo, pero tu clasificación es razonable
- low: No encontraste el track, o la info es muy contradictoria, o no pudiste verificar datos clave

Reglas Finales:
- Siempre busca en la web. No clasifiques de memoria. Incluso si conoces al artista, busca este track específico.
- Un solo género. No devuelvas "Tech House / Melodic House". Elige el más preciso.
- No inventes datos. Si no encuentras el año, pon el del tag existente y baja la confianza a medium.
- El comment debe ser escaneable. Un DJ lo lee en 2 segundos en pantalla. Nada de párrafos.
- Respeta el user_notes. Si el usuario da contexto sobre el track, incorpóralo en tu análisis.

Output:
Devuelve un objeto JSON con estos campos:
- artist (opcional): Solo si lo encontraste/corregiste y es diferente al input o si faltaba
- title (opcional): Solo si lo encontraste/corregiste y es diferente al input o si faltaba
- album (opcional): Solo si lo encontraste/corregiste y es diferente al input o si faltaba
- genre (requerido): El género verificado
- year (requerido): El año verificado en formato YYYY
- comment (requerido): Etiqueta rápida + notas opcionales
- confidence (requerido): high, medium o low
- searchSummary (requerido): Resumen de 2-3 oraciones de lo que encontraste`;

  // Define the schema for structured output
  const analysisSchema = z.object({
    artist: z.string().optional().describe('Corrected or found artist name (if different from input or if missing)'),
    title: z.string().optional().describe('Corrected or found track title (if different from input or if missing)'),
    album: z.string().optional().describe('Corrected or found album name (if different from input or if missing)'),
    genre: z.string().describe('ONE clear, specific genre that DJs would use'),
    year: z.string().describe('The release year in YYYY format'),
    comment: z.string().describe('DJ comment in format: Context · Energy · Timing'),
    confidence: z.enum(['high', 'medium', 'low']).describe('Confidence level of the analysis'),
    searchSummary: z.string().describe('Brief summary of web search findings')
  });

  try {
    logger.debug({ prompt }, 'Sending prompt to Claude');

    const result = await generateObject({
      model: anthropic('claude-sonnet-4-6'),
      schema: analysisSchema,
      prompt,
      maxTokens: 1000,
    });

    logger.debug({ response: result.object }, 'Received structured response from Claude');

    const analysis = result.object;

    const successResult = {
      success: true,
      artist: analysis.artist || artist,
      title: analysis.title || title,
      album: analysis.album || album,
      genre: analysis.genre,
      year: analysis.year,
      comment: analysis.comment,
      confidence: analysis.confidence || 'medium',
      searchSummary: analysis.searchSummary || 'No summary provided',
      source: 'claude_analysis'
    };

    logger.info({
      filename,
      artist: successResult.artist,
      title: successResult.title,
      album: successResult.album,
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
