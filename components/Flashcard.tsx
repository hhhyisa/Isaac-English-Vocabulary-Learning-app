import React, { useState, useEffect } from 'react';
import { Volume2, RotateCcw, Youtube, Tv, Newspaper, Film, MessageCircle, ExternalLink, Book } from 'lucide-react';
import { FlashcardData } from '../types';
import { Rating, getReviewStatusColor } from '../utils/srs';

interface FlashcardProps {
  data: FlashcardData;
  onRate?: (rating: Rating) => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({ data, onRate }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset flip state when card data changes
  useEffect(() => {
    setIsFlipped(false);
  }, [data.id]);

  const playAudio = (text: string, lang: string = 'en-US', e: React.MouseEvent) => {
    e.stopPropagation();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'YouTube': return <Youtube size={18} />;
      case 'Comedy':
      case 'Sitcom': return <Tv size={18} />;
      case 'News': return <Newspaper size={18} />;
      case 'Movie': return <Film size={18} />;
      default: return <MessageCircle size={18} />;
    }
  };

  const handleRating = (e: React.MouseEvent, rating: Rating) => {
    e.stopPropagation();
    if (onRate) onRate(rating);
  };

  return (
    <div 
      className="group perspective-1000 w-[90vw] md:w-[60vw] h-[75vh] md:h-[75vh] min-h-[550px] max-h-[850px] cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* FRONT */}
        <div className="absolute w-full h-full backface-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 p-6 md:p-12 flex flex-col items-center justify-center">
          <div className="absolute top-6 right-6 md:top-10 md:right-10">
             <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-xs md:text-sm font-bold rounded-full uppercase tracking-wider">
               Word
             </span>
          </div>

          <h2 className="text-5xl md:text-8xl font-extrabold text-slate-800 mb-4 text-center tracking-tight break-words max-w-full leading-tight">
            {data.word}
          </h2>
          
          <div className="flex items-center space-x-3 text-slate-500 mb-8 bg-slate-50 px-6 py-3 rounded-full">
            <span className="font-mono text-xl md:text-3xl">{data.pronunciation_ipa || `/${data.word}/`}</span>
            <button 
              onClick={(e) => playAudio(data.word, 'en-US', e)}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-indigo-500"
            >
              <Volume2 className="w-6 h-6 md:w-8 md:h-8" />
            </button>
          </div>

          <div className="mb-8 max-w-3xl">
             <p className="text-2xl md:text-3xl text-slate-600 font-medium text-center leading-relaxed">
               {data.meanings.english}
             </p>
          </div>

          <p className="text-slate-400 text-sm md:text-base font-medium mt-auto animate-pulse">Tap to reveal</p>
        </div>

        {/* BACK */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-800 shadow-2xl p-6 md:p-10 text-white flex flex-col overflow-hidden text-left">
           <div className="flex flex-col md:flex-row justify-between items-start mb-4 md:mb-6 gap-4">
              <div className="flex-1 pr-4">
                <h3 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">{data.meanings.chinese}</h3>
                <p className="text-lg md:text-lg text-indigo-200 font-medium leading-tight opacity-80">{data.meanings.english}</p>
              </div>
              <span className="self-start md:self-center px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-full uppercase tracking-wider border border-white/10 shrink-0">
               Examples
             </span>
           </div>

          {/* Divider */}
          <div className="w-full h-px bg-white/20 mb-4 shrink-0"></div>

          {/* Examples Scrollable Area */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
            {data.examples.map((ex, idx) => (
              <div key={idx} className="bg-white/10 rounded-xl p-4 border border-white/5 hover:bg-white/15 transition-colors">
                <div className="flex items-center space-x-2 mb-2 text-indigo-200 text-xs md:text-xs font-bold uppercase tracking-wider">
                  {getSourceIcon(ex.source_type)}
                  <span>{ex.source_type}</span>
                  {ex.source_context && (
                    <span className="opacity-75 text-indigo-300">• {ex.source_context}</span>
                  )}
                </div>
                
                <blockquote className="text-lg md:text-xl leading-relaxed italic mb-2 text-white/95">
                  "{ex.sentence}"
                  <button 
                    onClick={(e) => playAudio(ex.sentence, 'en-US', e)}
                    className="inline-block ml-3 p-1.5 hover:bg-white/20 rounded-full transition-colors align-middle"
                  >
                    <Volume2 size={16} />
                  </button>
                </blockquote>
                
                <p className="text-indigo-200 text-sm md:text-base">{ex.translation}</p>
              </div>
            ))}
          </div>

           {/* REFERENCES SECTION */}
           <div className="mt-4 pt-3 border-t border-white/20 shrink-0">
              <div className="flex items-center space-x-2 mb-2">
                 <Book size={14} className="text-indigo-200" />
                 <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">References</span>
              </div>
              <div className="flex flex-wrap gap-2">
                 <a 
                   href={`https://www.oxfordlearnersdictionaries.com/definition/english/${data.word}`} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   onClick={(e) => e.stopPropagation()}
                   className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-colors text-white"
                 >
                   <span>Oxford</span>
                   <ExternalLink size={10} />
                 </a>
                 <a 
                   href={`https://dictionary.cambridge.org/dictionary/english/${data.word}`} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   onClick={(e) => e.stopPropagation()}
                   className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-colors text-white"
                 >
                   <span>Cambridge</span>
                   <ExternalLink size={10} />
                 </a>
                 <a 
                   href={`https://www.collinsdictionary.com/dictionary/english/${data.word}`} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   onClick={(e) => e.stopPropagation()}
                   className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-colors text-white"
                 >
                   <span>Collins</span>
                   <ExternalLink size={10} />
                 </a>
              </div>
           </div>

           {/* Footer Actions */}
           <div className="mt-4 flex justify-between items-center z-20 relative">
             {onRate ? (
               <div className="grid grid-cols-4 gap-2 md:gap-4 w-full">
                 {(['again', 'hard', 'good', 'easy'] as Rating[]).map((r) => (
                   <button
                     key={r}
                     onClick={(e) => handleRating(e, r)}
                     className={`py-3 px-2 rounded-xl font-bold text-white shadow-lg transform transition-all hover:scale-105 active:scale-95 text-sm md:text-base capitalize ${getReviewStatusColor(r)}`}
                   >
                     {r}
                   </button>
                 ))}
               </div>
             ) : (
               <button 
                  onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
                  className="ml-auto p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all shadow-lg"
                >
                  <RotateCcw size={24} />
                </button>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};