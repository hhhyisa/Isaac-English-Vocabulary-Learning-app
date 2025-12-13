import { GoogleGenAI, Type } from "@google/genai";
import { FlashcardData, GeneratedArticle } from "../types";
import { initializeReviewData } from "../utils/srs";

// Initialize Gemini Client
// We assume process.env.API_KEY is available as per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const FLASHCARD_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      word: { type: Type.STRING },
      pronunciation_ipa: { type: Type.STRING, description: "IPA pronunciation guide" },
      meanings: {
        type: Type.OBJECT,
        properties: {
          english: { type: Type.STRING, description: "Concise English definition" },
          chinese: { type: Type.STRING, description: "Concise Chinese definition" },
        },
        required: ["english", "chinese"],
      },
      examples: {
        type: Type.ARRAY,
        description: "List of exactly 2 distinct example sentences from different contexts.",
        items: {
          type: Type.OBJECT,
          properties: {
            sentence: { type: Type.STRING, description: "An example sentence. PREFER quotes from popular culture, news, comedy, or viral videos." },
            translation: { type: Type.STRING, description: "Chinese translation of the sentence" },
            source_type: { 
              type: Type.STRING, 
              enum: ["News", "Comedy", "YouTube", "Movie", "General"],
              description: "The type of source the example mimics or comes from."
            },
            source_context: { type: Type.STRING, description: "Specific source if applicable (e.g. 'The Office', 'BBC News', 'TED Talk')" },
          },
          required: ["sentence", "translation", "source_type"],
        }
      },
    },
    required: ["word", "meanings", "examples"],
  },
};

const ARTICLE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    content: { type: Type.STRING, description: "The full text of the article/story." },
  },
  required: ["title", "content"],
};

// --- Caching Helpers ---
const WORD_CACHE_KEY = 'lingoflash_word_cache';

const getWordFromCache = (word: string): FlashcardData | null => {
  if (typeof window === 'undefined') return null;
  try {
    const cache = JSON.parse(localStorage.getItem(WORD_CACHE_KEY) || '{}');
    return cache[word.toLowerCase()] || null;
  } catch (e) {
    return null;
  }
};

const saveWordToCache = (word: string, data: FlashcardData) => {
    if (typeof window === 'undefined') return;
    try {
        const cache = JSON.parse(localStorage.getItem(WORD_CACHE_KEY) || '{}');
        cache[word.toLowerCase()] = data;
        localStorage.setItem(WORD_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.error("Cache save failed", e);
    }
};

// --- Validation Helper ---
const validateWordWithDictionary = async (word: string): Promise<boolean> => {
  try {
    const cleanWord = word.trim();
    // Use the Free Dictionary API as the Gatekeeper
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
    
    if (response.status === 404) {
      return false;
    }
    return true;
  } catch (error) {
    // If API is down or network error, we might optionally default to true to allow Gemini to handle it,
    // but the requirement implies strictness. Let's return false on fetch failure to be safe, 
    // or log and assume true if it's a network issue. 
    // Given the prompt "Strict Validation", we will assume if we can't verify it, we don't process it.
    console.warn(`Dictionary validation error for ${word}:`, error);
    return false; 
  }
};

export const generateFlashcards = async (words: string[]): Promise<FlashcardData[]> => {
  // Step 1: Strict Validation (The Gatekeeper)
  // We validate concurrently for speed
  const validationResults = await Promise.all(
    words.map(async (word) => {
      const isValid = await validateWordWithDictionary(word);
      return { word, isValid };
    })
  );

  const invalidWords = validationResults.filter(r => !r.isValid).map(r => r.word);

  if (invalidWords.length > 0) {
    throw new Error(`Word not found in dictionary: ${invalidWords.join(", ")}`);
  }

  try {
    const wordListString = words.join(", ");
    // Updated Prompt for Authoritative Content
    const prompt = `
      Create a list of flashcards for the following vocabulary words:
      ${wordListString}

      Requirements:
      1. Provide the definition, phonetics, and usage examples for this word. 
      2. The definition must be strictly aligned with standard dictionaries like Oxford, Cambridge, or Collins. Do not invent meanings.
      3. Provide the English and Chinese meaning.
      4. Provide a pronunciation guide (IPA).
      5. Provide exactly 2 example sentences per word. 
         - Mix sources: One from Pop Culture/Comedy/Movies and one from News/Formal/General.
      6. Return strict JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: FLASHCARD_SCHEMA,
        // Adjusted token limit for efficiency while maintaining capacity
        maxOutputTokens: 8192, 
        systemInstruction: "You are an expert language tutor. You prioritize dictionary accuracy above all else.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const rawData = JSON.parse(text);
    
    // Enrich with IDs using randomUUID for robustness in parallel calls
    const formattedData: FlashcardData[] = rawData.map((item: any) => ({
      ...item,
      id: `card-${crypto.randomUUID()}`,
      reviewData: initializeReviewData(), // Init SRS data
    }));

    return formattedData;

  } catch (error) {
    console.error("Error generating flashcards:", error);
    throw error;
  }
};

export const generateArticle = async (words: string[]): Promise<GeneratedArticle> => {
  try {
    const wordListString = words.join(", ");
    const prompt = `
      Write a creative, engaging short story or article (approx 300 words) that naturally integrates the following vocabulary words:
      ${wordListString}

      Requirements:
      1. The context should be interesting (e.g., a sci-fi snippet, a modern dialogue, or a news report).
      2. Use the words correctly in context.
      3. Return a JSON object with a 'title' and the 'content'.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: ARTICLE_SCHEMA,
        systemInstruction: "You are a creative writer.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text);
    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      title: result.title,
      content: result.content,
      targetWords: words,
    };

  } catch (error) {
    console.error("Error generating article:", error);
    throw error;
  }
};

export const lookupWord = async (word: string): Promise<FlashcardData> => {
  // 1. Check Cache
  const cached = getWordFromCache(word);
  if (cached) return cached;

  // 2. Strict Validation
  const isValid = await validateWordWithDictionary(word);
  if (!isValid) {
    throw new Error(`Word not found in dictionary: ${word}`);
  }

  // 3. Fetch if not in cache
  try {
    // Re-use the existing generation logic but for a single word
    // We bypass the internal validation of generateFlashcards to avoid double checking, 
    // OR we just call it since it's cached/fast enough. 
    // Calling generateFlashcards will re-validate, which is safer but slightly slower.
    // Given the requirement, let's call generateFlashcards to ensure consistency.
    const cards = await generateFlashcards([word]);
    if (cards && cards.length > 0) {
      // 4. Save to Cache
      saveWordToCache(word, cards[0]);
      return cards[0];
    }
    throw new Error("Word lookup failed");
  } catch (error) {
    console.error("Error looking up word:", error);
    throw error;
  }
};