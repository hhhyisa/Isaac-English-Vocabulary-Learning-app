import React, { useState, useEffect, useRef } from 'react';
import { FlashcardData } from '../types';
import { Volume2, Check, X, ArrowRight, RefreshCw, Mic, Image as ImageIcon, Award } from 'lucide-react';

interface DictationProps {
  cards: FlashcardData[];
  onExit: () => void;
}

export const Dictation: React.FC<DictationProps> = ({ cards, onExit }) => {
  // Cap at 10 words for the batch
  const sessionCards = useRef(cards.slice(0, 10)).current;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentCard = sessionCards[currentIndex];

  const playAudio = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!isFinished && currentCard) {
      // Auto play audio on new card
      const timer = setTimeout(() => playAudio(currentCard.word), 500);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isFinished, currentCard]);

  // Focus input on mount and next card
  useEffect(() => {
    if (status === 'idle') {
      inputRef.current?.focus();
    }
  }, [currentIndex, status]);

  const handleSubmit = () => {
    if (!userInput.trim()) return;

    const isCorrect = userInput.trim().toLowerCase() === currentCard.word.toLowerCase();
    
    setStatus(isCorrect ? 'correct' : 'incorrect');
    if (isCorrect) setScore(prev => prev + 1);
  };

  const handleNext = () => {
    if (currentIndex < sessionCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserInput('');
      setStatus('idle');
    } else {
      setIsFinished(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (status === 'idle') {
        handleSubmit();
      } else {
        handleNext();
      }
    }
  };

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center animate-fade-in py-12 w-full max-w-2xl mx-auto">
        <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-6 text-indigo-600">
          <Award size={48} />
        </div>
        <h2 className="text-4xl font-bold text-slate-800 mb-2">Dictation Complete!</h2>
        <p className="text-xl text-slate-500 mb-8">You spelled {score} out of {sessionCards.length} words correctly.</p>
        
        <div className="flex space-x-4">
          <button 
            onClick={onExit}
            className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors"
          >
            Back to Learning
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl w-full mx-auto px-4 py-8">
      {/* Header / Progress */}
      <div className="flex justify-between items-center mb-8">
        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Dictation {currentIndex + 1} / {sessionCards.length}
        </span>
        <button onClick={onExit} className="text-slate-400 hover:text-slate-600">
          Exit
        </button>
      </div>

      {/* "Visual" Card Area */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 border border-slate-100">
        
        {/* Placeholder Graphic / Concept Area */}
        <div className="h-40 bg-gradient-to-r from-indigo-500 to-purple-600 flex flex-col items-center justify-center text-white p-6 text-center relative">
           <ImageIcon className="text-white/20 absolute top-4 right-4 w-12 h-12" />
           <p className="text-2xl font-bold leading-tight drop-shadow-md">
             {currentCard.meanings.chinese}
           </p>
           <p className="text-indigo-100 text-lg mt-2 font-medium opacity-90">
             {currentCard.meanings.english}
           </p>
        </div>

        {/* Audio Interaction Area */}
        <div className="p-8 flex flex-col items-center">
           
           <button 
             onClick={() => playAudio(currentCard.word)}
             className="mb-8 w-20 h-20 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-sm border border-indigo-200"
             title="Play Pronunciation"
           >
             <Volume2 size={36} />
           </button>

           <div className="w-full relative">
             <input
               ref={inputRef}
               type="text"
               value={userInput}
               onChange={(e) => setUserInput(e.target.value)}
               onKeyDown={handleKeyDown}
               disabled={status !== 'idle'}
               placeholder="Type what you hear..."
               className={`w-full text-center text-3xl font-bold py-4 border-b-2 bg-transparent outline-none transition-colors
                 ${status === 'idle' ? 'border-slate-200 focus:border-indigo-500 text-slate-800' : ''}
                 ${status === 'correct' ? 'border-green-500 text-green-600' : ''}
                 ${status === 'incorrect' ? 'border-red-500 text-red-500' : ''}
               `}
               autoComplete="off"
               autoCorrect="off"
               spellCheck="false"
             />
             
             {/* Status Icon Indicator */}
             <div className="absolute right-0 top-1/2 transform -translate-y-1/2 mr-2">
                {status === 'correct' && <Check className="text-green-500 w-8 h-8" />}
                {status === 'incorrect' && <X className="text-red-500 w-8 h-8" />}
             </div>
           </div>

           {/* Feedback Message */}
           <div className="h-16 mt-4 flex items-center justify-center w-full">
             {status === 'correct' && (
               <div className="text-green-600 font-bold flex items-center animate-bounce-short">
                 <span className="mr-2">Correct!</span>
                 <span className="text-sm font-normal text-slate-500">/{currentCard.pronunciation_ipa}/</span>
               </div>
             )}
             {status === 'incorrect' && (
               <div className="text-center animate-shake">
                 <p className="text-red-500 font-bold mb-1">Incorrect</p>
                 <p className="text-slate-600">
                   Correct spelling: <span className="font-bold text-indigo-600">{currentCard.word}</span>
                 </p>
               </div>
             )}
           </div>

           {/* Action Button */}
           <button
             onClick={status === 'idle' ? handleSubmit : handleNext}
             className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-md flex items-center justify-center space-x-2
               ${status === 'idle' 
                 ? 'bg-slate-800 text-white hover:bg-slate-900' 
                 : 'bg-indigo-600 text-white hover:bg-indigo-700'}
             `}
           >
             {status === 'idle' ? (
               <span>Check Spelling</span>
             ) : (
               <>
                 <span>Next Word</span>
                 <ArrowRight size={20} />
               </>
             )}
           </button>

        </div>
      </div>
    </div>
  );
};
