import React, { useState } from 'react';
import { ArrowRight, Zap, BookOpen } from 'lucide-react';

interface InputSectionProps {
  onGenerate: (words: string[]) => void;
  isLoading: boolean;
}

const DEFAULT_WORDS = "Serendipity, Ephemeral, Resilience, Ubiquitous, Quintessential, Melancholy, Eloquent, Pragmatic, Aesthetic, Nostalgia";

export const InputSection: React.FC<InputSectionProps> = ({ onGenerate, isLoading }) => {
  const [inputText, setInputText] = useState('');

  const handleGenerate = () => {
    if (!inputText.trim()) return;
    // Split by commas or newlines, filter empty
    const words = inputText.split(/[\n,]+/).map(w => w.trim()).filter(w => w.length > 0);
    onGenerate(words);
  };

  const loadExample = () => {
    setInputText(DEFAULT_WORDS);
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
            <BookOpen size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Build Your Vocabulary Deck</h1>
          <p className="text-slate-500">
            Paste up to 100 words. We'll add meanings, pronunciation, and pop-culture examples instantly.
          </p>
        </div>

        <div className="relative mb-6">
          <textarea
            className="w-full h-64 p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none text-lg font-mono text-slate-700 placeholder:text-slate-300"
            placeholder="Paste your words here (separated by commas or new lines)...&#10;e.g. Ephemeral, Serendipity, ..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
          />
          {inputText.length === 0 && (
            <button 
              onClick={loadExample}
              className="absolute bottom-4 right-4 text-sm text-indigo-500 hover:text-indigo-700 font-medium bg-indigo-50 px-3 py-1 rounded-md"
            >
              Load Example
            </button>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading || inputText.length === 0}
          className={`w-full py-4 rounded-xl flex items-center justify-center space-x-2 text-lg font-bold text-white transition-all transform hover:scale-[1.01] active:scale-[0.99]
            ${isLoading || inputText.length === 0 
              ? 'bg-slate-300 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30'}`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generating Cards... (Give us ~20s)</span>
            </>
          ) : (
            <>
              <Zap size={20} />
              <span>Generate Flashcards</span>
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
