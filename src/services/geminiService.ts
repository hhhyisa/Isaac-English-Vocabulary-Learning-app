import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { FlashcardData, GeneratedArticle } from "../types";
import { initializeReviewData } from "../utils/srs";

// ✅ 安全写法：让代码去 Vercel 的保险箱里拿密码
// ❌ 千万不要再在这里粘贴你的 Key 了！
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const getAIClient = () => {
  if (!API_KEY) {
    console.error("API Key is missing! Check Vercel Environment Variables.");
  }
  return new GoogleGenerativeAI(API_KEY);
};

// --- 1. Schema 定义 ---
const FLASHCARD_SCHEMA = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      word: { type: SchemaType.STRING },
      pronunciation_ipa: { type: SchemaType.STRING },
      meanings: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            partOfSpeech: { type: SchemaType.STRING },
            english: { type: SchemaType.STRING },
            chinese: { type: SchemaType.STRING }
          },
          required: ["partOfSpeech", "english", "chinese"]
        }
      },
      examples: {
        type: SchemaType.ARRAY,
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
    content: { type: SchemaType.STRING },
  },
  required: ["title", "content"],
};

// --- 2. 辅助函数 ---
const cleanJsonText = (text: string): string => {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

const WORD_CACHE_KEY = 'lingoflash_word_cache';
const getWordFromCache = (word: string): FlashcardData | null => {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(WORD_CACHE_KEY) || '{}')[word.toLowerCase()] || null;
  } catch (e) { return null; }
};
const saveWordToCache = (word: string, data: FlashcardData) => {
    if (typeof window === 'undefined') return;
    try {
        const cache = JSON.parse(localStorage.getItem(WORD_CACHE_KEY) || '{}');
        cache[word.toLowerCase()] = data;
        localStorage.setItem(WORD_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {}
};

const validateWordWithDictionary = async (word: string): Promise<boolean> => {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.trim())}`);
    return response.status !== 404;
  } catch (error) { return false; }
};

// --- 3. 核心功能 ---
export const generateFlashcards = async (words: string[]): Promise<FlashcardData[]> => {
  const genAI = getAIClient();
  
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash", 
    systemInstruction: "You are an expert language tutor.",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: FLASHCARD_SCHEMA,
    },
  });

  const validationResults = await Promise.all(words.map(async w => ({ word: w, isValid: await validateWordWithDictionary(w) })));
  if (validationResults.some(r => !r.isValid)) throw new Error(`Word not found: ${validationResults.find(r => !r.isValid)?.word}`);

  try {
    const prompt = `Create flashcards for: ${words.join(", ")}. Requirements: IPA, Chinese/English meanings, 2 examples (Pop Culture & General). Return strict JSON.`;
    const result = await model.generateContent(prompt);
    const text = cleanJsonText(result.response.text());
    
    return JSON.parse(text).map((item: any) => ({
      ...item,
      id: `card-${crypto.randomUUID()}`,
      reviewData: initializeReviewData(),
    }));
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const generateArticle = async (words: string[]): Promise<GeneratedArticle> => {
  const genAI = getAIClient();
  
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: "You are a creative writer.",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: ARTICLE_SCHEMA,
    },
  });

  try {
    const prompt = `Write a short story using: ${words.join(", ")}. Return JSON with title and content.`;
    const result = await model.generateContent(prompt);
    const data = JSON.parse(cleanJsonText(result.response.text()));
    
    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      title: data.title,
      content: data.content,
      targetWords: words,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const lookupWord = async (word: string): Promise<FlashcardData> => {
  const cached = getWordFromCache(word);
  if (cached) return cached;
  const cards = await generateFlashcards([word]);
  if (cards[0]) saveWordToCache(word, cards[0]);
  return cards[0];
};
