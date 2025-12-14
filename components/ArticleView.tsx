import React, { useState } from 'react';
import { FlashcardData, GeneratedArticle } from '../types';
import { FileText, ArrowLeft, Download, Loader2, Plus, Check, Volume2 } from 'lucide-react';
import { lookupWord } from '../services/geminiService';

interface ArticleViewProps {
  article: GeneratedArticle;
  onExit: () => void;
  onAddCard: (card: FlashcardData) => void;
  library: FlashcardData[];
}

export const ArticleView: React.FC<ArticleViewProps> = ({ article, onExit, onAddCard, library }) => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [definitionData, setDefinitionData] = useState<FlashcardData | null>(null);
  const [loadingDef, setLoadingDef] = useState(false);
  
  const handleWordClick = async (word: string) => {
    // Strip punctuation
    const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, "").trim();
    if (!cleanWord || cleanWord.length < 2) return;

    setSelectedWord(cleanWord);
    setDefinitionData(null);
    setLoadingDef(true);

    try {
      const data = await lookupWord(cleanWord);
      setDefinitionData(data);
    } catch (e) {
      console.error("Failed to lookup word");
    } finally {
      setLoadingDef(false);
    }
  };

  const handleAdd = () => {
    if (definitionData) {
      onAddCard(definitionData);
    }
  };

  const playAudio = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const isAlreadyInLibrary = (word: string) => {
    return library.some(card => card.word.toLowerCase() === word.toLowerCase());
  };

  // Advanced rendering to split by spaces but preserve punctuation for flow, yet allow word clicking
  const renderInteractiveContent = () => {
    // Split by non-word characters (delimiters) but keep them in the array
    // Regex matches sequences of word characters OR sequences of non-word characters
    const tokens = article.content.split(/([a-zA-Z0-9'-]+)/g);

    return tokens.map((token, index) => {
      // Check if this token is a word
      const isWord = /^[a-zA-Z0-9'-]+$/.test(token);
      
      if (!isWord) {
        return <span key={index}>{token}</span>;
      }

      const isTarget = article.targetWords.some(w => w.toLowerCase() === token.toLowerCase());
      
      return (
        <span 
          key={index} 
          onClick={() => handleWordClick(token)}
          className={`
            cursor-pointer rounded px-0.5 transition-colors
            ${isTarget 
               ? 'bg-indigo-100 text-indigo-800 font-bold border-b-2 border-indigo-400 hover:bg-indigo-200' 
               : 'hover:bg-yellow-100 hover:text-slate-900'}
          `}
        >
          {token}
        </span>
      );
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-fade-in relative">
       {/* Header */}
       <div className="flex items-center justify-between mb-8">
         <button 
           onClick={onExit}
           className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 transition-colors"
         >
           <ArrowLeft size={20} />
           <span className="font-medium">Back to Learning</span>
         </button>
         
         <div className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center space-x-2">
            <FileText size={14} />
            <span>Story Mode</span>
         </div>
       </div>

       {/* Article Card */}
       <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden min-h-[60vh]">
          <div className="bg-slate-50 border-b border-slate-100 p-8 md:p-12 text-center">
             <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 leading-tight mb-4">
               {article.title}
             </h1>
             <p className="text-slate-500 font-medium">
               Featuring: {article.targetWords.join(', ')}
             </p>
             <p className="text-xs text-slate-400 mt-4 uppercase tracking-widest">
                Tap any word to see its meaning
             </p>
          </div>

          <div className="p-8 md:p-12 text-lg md:text-xl leading-loose text-slate-700 font-serif">
             <p className="whitespace-pre-wrap">
               {renderInteractiveContent()}
             </p>
          </div>

          <div className="bg-slate-50 border-t border-slate-100 p-6 flex justify-center">
             <button
                onClick={() => window.print()} 
                className="flex items-center space-x-2 text-slate-500 hover:text-indigo-600 font-medium transition-colors"
             >
               <Download size={18} />
               <span>Save as PDF (Print)</span>
             </button>
          </div>
       </div>

       {/* Word Inspector Modal */}
       {selectedWord && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedWord(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                  <h3 className="text-2xl font-bold text-slate-800 capitalize">{selectedWord}</h3>
                  <button onClick={() => setSelectedWord(null)} className="text-slate-400 hover:text-slate-600">✕</button>
               </div>
               
               <div className="p-6 overflow-y-auto custom-scrollbar">
                  {loadingDef ? (
                    <div className="flex flex-col items-center justify-center space-y-3 text-indigo-500 py-8">
                       <Loader2 size={32} className="animate-spin" />
                       <span className="text-sm font-medium">Looking up meaning...</span>
                    </div>
                  ) : definitionData ? (
                    <div className="space-y-4">
                       <div className="flex items-center space-x-3 mb-4">
                             <span className="text-sm font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                               {definitionData.pronunciation_ipa}
                             </span>
                             <button 
                               onClick={() => playAudio(definitionData.word)}
                               className="text-indigo-500 hover:text-indigo-700 p-1 bg-indigo-50 rounded-full transition-colors"
                               title="Play Pronunciation"
                             >
                                <Volume2 size={18} />
                             </button>
                        </div>
                       
                       <div className="space-y-3">
                         {definitionData.meanings.map((m, idx) => (
                           <div key={idx} className="border-l-2 border-indigo-200 pl-3">
                              <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded mb-1 inline-block">
                                {m.partOfSpeech}
                              </span>
                              <p className="text-lg text-slate-800 font-medium leading-snug">{m.english}</p>
                              <p className="text-indigo-600 text-sm mt-0.5">{m.chinese}</p>
                           </div>
                         ))}
                       </div>
                       
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
                          <p className="italic text-slate-600 text-sm">"{definitionData.examples[0].sentence}"</p>
                          <p className="text-slate-400 text-xs mt-2">{definitionData.examples[0].translation}</p>
                       </div>

                       <button 
                         onClick={handleAdd}
                         disabled={isAlreadyInLibrary(definitionData.word)}
                         className={`w-full py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all mt-4
                           ${isAlreadyInLibrary(definitionData.word) 
                             ? 'bg-green-100 text-green-700 cursor-default' 
                             : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'}
                         `}
                       >
                         {isAlreadyInLibrary(definitionData.word) ? (
                           <>
                             <Check size={18} />
                             <span>Already in Library</span>
                           </>
                         ) : (
                           <>
                             <Plus size={18} />
                             <span>Add to Wordlist</span>
                           </>
                         )}
                       </button>
                    </div>
                  ) : (
                     <p className="text-center text-red-400 py-8">Could not define word.</p>
                  )}
               </div>
            </div>
         </div>
       )}
    </div>
  );
};