import React, { useState, useMemo } from 'react';
import { FlashcardData, QuizQuestion } from '../types';
import { CheckCircle, XCircle, RefreshCw, Trophy } from 'lucide-react';

interface QuizProps {
  cards: FlashcardData[];
  onExit: () => void;
}

export const Quiz: React.FC<QuizProps> = ({ cards, onExit }) => {
  // Generate questions from cards
  const questions = useMemo(() => {
    if (cards.length < 4) return []; // Need at least 4 cards for distractors

    return cards.map((card) => {
      // Create a "Meaning to Word" question
      const isMeaningToWord = Math.random() > 0.5;
      const primaryMeaning = card.meanings[0]; // Use first meaning for consistency in quiz
      
      const distractors = cards
        .filter(c => c.id !== card.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      if (isMeaningToWord) {
        return {
          question: primaryMeaning.chinese, // Use Chinese meaning as question
          correctAnswer: card.word,
          options: [card.word, ...distractors.map(d => d.word)].sort(() => 0.5 - Math.random()),
          type: 'meaning-to-word',
          originalCardId: card.id
        } as QuizQuestion;
      } else {
        return {
          question: card.word,
          correctAnswer: primaryMeaning.english, // Use English definition as answer
          options: [primaryMeaning.english, ...distractors.map(d => d.meanings[0].english)].sort(() => 0.5 - Math.random()),
          type: 'word-to-meaning',
          originalCardId: card.id
        } as QuizQuestion;
      }
    }).sort(() => 0.5 - Math.random()).slice(0, 10); // Limit to 10 questions per session
  }, [cards]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const handleAnswer = (option: string) => {
    if (selectedOption) return; // Prevent double clicking
    setSelectedOption(option);
    
    const isCorrect = option === questions[currentIndex].correctAnswer;
    if (isCorrect) setScore(s => s + 1);

    // Auto advance
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
      } else {
        setIsFinished(true);
      }
    }, 1200);
  };

  if (questions.length === 0) {
    return (
       <div className="flex flex-col items-center justify-center p-12 text-center">
         <p className="text-xl text-slate-600 mb-4">Not enough cards to generate a quiz (Need at least 4).</p>
         <button onClick={onExit} className="text-indigo-600 font-bold hover:underline">Go Back</button>
       </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center animate-fade-in py-12">
        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6 text-yellow-600">
          <Trophy size={48} />
        </div>
        <h2 className="text-4xl font-bold text-slate-800 mb-2">Quiz Complete!</h2>
        <p className="text-xl text-slate-500 mb-8">You scored {score} out of {questions.length}</p>
        
        <div className="flex space-x-4">
          <button 
            onClick={onExit}
            className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors"
          >
            Back to Cards
          </button>
           <button 
            onClick={() => {
              setIsFinished(false);
              setCurrentIndex(0);
              setScore(0);
              setSelectedOption(null);
            }}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center"
          >
            <RefreshCw size={20} className="mr-2" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-2xl w-full mx-auto p-4">
      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-200 rounded-full mb-8 overflow-hidden">
        <div 
          className="h-full bg-indigo-500 transition-all duration-300 ease-out"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
          Question {currentIndex + 1} / {questions.length}
        </span>
        
        <h3 className="text-2xl font-bold text-slate-800 mb-8">
          {currentQ.type === 'meaning-to-word' 
            ? `Which word means "${currentQ.question}"?`
            : `What does "${currentQ.question}" mean?`}
        </h3>

        <div className="space-y-3">
          {currentQ.options.map((option, idx) => {
            let btnClass = "w-full text-left p-4 rounded-xl border-2 font-medium transition-all text-lg ";
            
            if (selectedOption) {
              if (option === currentQ.correctAnswer) {
                btnClass += "border-green-500 bg-green-50 text-green-700";
              } else if (option === selectedOption) {
                btnClass += "border-red-500 bg-red-50 text-red-700";
              } else {
                 btnClass += "border-slate-100 opacity-50";
              }
            } else {
              btnClass += "border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700";
            }

            return (
              <button
                key={idx}
                disabled={!!selectedOption}
                onClick={() => handleAnswer(option)}
                className={btnClass}
              >
                <div className="flex justify-between items-center">
                  <span>{option}</span>
                  {selectedOption && option === currentQ.correctAnswer && <CheckCircle className="text-green-500" />}
                  {selectedOption && option === selectedOption && option !== currentQ.correctAnswer && <XCircle className="text-red-500" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};