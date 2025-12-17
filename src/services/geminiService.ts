import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { FlashcardData, GeneratedArticle } from "../types";
import { initializeReviewData } from "../utils/srs";

const API_KEY = "AIzaSyB8D5MbiI-kDKOmeo6xNLxAwzCMTW6gl5w";

// Lazy initialization helper
const getAIClient = () => {
  return new GoogleGenerativeAI(API_KEY);
};

// 2. Schema 定义需要使用 SchemaType
const FLASHCARD_SCHEMA = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      word: { type: SchemaType.STRING },
      pronunciation_ipa: { type: SchemaType.STRING, description: "IPA pronunciation guide" },
      meanings: {
        type: SchemaType.ARRAY,
        description: "List of meanings for different parts of speech.",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            partOfSpeech: { type: SchemaType.STRING, description: "e.g., noun, verb, adj" },
            english: { type: SchemaType.STRING, description: "Concise English definition" },
            chinese: { type: SchemaType.STRING, description: "Concise Chinese definition" }
          },
          required: ["partOfSpeech", "english", "chinese"]
        }
      },
      examples: {
        type: SchemaType.ARRAY,
        description: "List of exactly 2 distinct example sentences.",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            sentence: { type: SchemaType.STRING },
            translation: { type: SchemaType.STRING },
            source_type: { 
              type: SchemaType.STRING, 
              enum: ["News", "Comedy", "YouTube", "Movie", "General"]
            },
            source_context: { type: SchemaType.STRING },
          },
          required: ["sentence", "translation", "source_type"],
        }
      },
    },
    required: ["word", "meanings", "examples"],
  },
};

const ARTICLE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    content: { type: SchemaType.STRING, description: "The full text of the article/story." },
  },
  required: ["title", "content"],
};

// --- Helper: Clean JSON string from Markdown ---
// 防止 AI 返回 ```json ... ``` 导致解析失败
const cleanJsonText = (text: string): string => {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
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
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
    if (response.status === 404) return false;
    return true;
  } catch (error) {
    console.warn(`Dictionary validation error for ${word}:`, error);
    // 如果字典API挂了，为了不阻塞用户，我们暂时放行 (返回 true)，或者严格拦截 (返回 false)
    return false; 
  }
};

export const generateFlashcards = async (words: string[]): Promise<FlashcardData[]> => {
  const genAI = getAIClient();
  
  // 3. 使用正确的模型名称 (1.5-flash)
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", 
    systemInstruction: "You are an expert language tutor. You prioritize dictionary accuracy above all else.",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: FLASHCARD_SCHEMA,
    },
  });

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
    const prompt = `
      Create a list of flashcards for the following vocabulary words: ${wordListString}
      Requirements:
      1. Provide definitions, phonetics (IPA), and usage examples. 
      2. Strictly aligned with Oxford/Cambridge dictionaries.
      3. Include English and Chinese meanings.
      4. Provide exactly 2 example sentences per word (1 Pop Culture, 1 General).
      5. Return strict JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = cleanJsonText(response.text()); // 安全解析

    if (!text) throw new Error("No response from AI");

    const rawData = JSON.parse(text);
    
    // Enrich with IDs
    const formattedData: FlashcardData[] = rawData.map((item: any) => ({
      ...item,
      id: `card-${crypto.randomUUID()}`,
      reviewData: initializeReviewData(),
    }));

    return formattedData;

  } catch (error) {
    console.error("Error generating flashcards:", error);
    throw error;
  }
};

export const generateArticle = async (words: string[]): Promise<GeneratedArticle> => {
  const genAI = getAIClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: "You are a creative writer.",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: ARTICLE_SCHEMA,
    },
  });

  try {
    const wordListString = words.join(", ");
    const prompt = `
      Write a creative, engaging short story (approx 300 words) using these words: ${wordListString}.
      Context: Sci-fi, modern dialogue, or news.
      Return JSON with 'title' and 'content'.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = cleanJsonText(response.text());

    if (!text) throw new Error("No response from AI");

    const resultData = JSON.parse(text);
    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      title: resultData.title,
      content: resultData.content,
      targetWords: words,
    };

  } catch (error) {
    console.error("Error generating article:", error);
    throw error;
  }
};

export const lookupWord = async (word: string): Promise<FlashcardData> => {
  const cached = getWordFromCache(word);
  if (cached) return cached;

  const isValid = await validateWordWithDictionary(word);
  if (!isValid) {
    throw new Error(`Word not found in dictionary: ${word}`);
  }

  try {
    const cards = await generateFlashcards([word]);
    if (cards && cards.length > 0) {
      saveWordToCache(word, cards[0]);
      return cards[0];
    }
    throw new Error("Word lookup failed");
  } catch (error) {
    console.error("Error looking up word:", error);
    throw error;
  }
};
