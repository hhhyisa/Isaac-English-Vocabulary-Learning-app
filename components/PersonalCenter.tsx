import React, { useState } from 'react';
import { FlashcardData } from '../types';
import { Trash2, Volume2, Search, PlayCircle, BookOpen, Clock, Calendar, CheckCircle2, FileText, CheckSquare, Square } from 'lucide-react';

interface PersonalCenterProps {
  library: FlashcardData[];
  onReview: (cards: FlashcardData[]) => void;
  onDelete: (id: string) => void;
  onStartDueReview: () => void;
  onGenerateArticle: (words: string[]) => void;
}

export const PersonalCenter: React.FC<PersonalCenterProps> = ({ library, onReview, onDelete, onStartDueReview, onGenerateArticle }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const now = Date.now();
  const dueCards = library.filter(c => !c.reviewData || c.reviewData.nextReviewDate <= now);
  const learnedCards = library.filter(c => c.reviewData && c.reviewData.interval > 0);

  const filteredCards = library.filter(c =>
    c.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.meanings.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.meanings.chinese.includes(searchTerm)
  );

  const playAudio = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const getNextReviewText = (timestamp: number) => {
    const diff = timestamp - Date.now();
    if (diff <= 0) return "Review Now";
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return `Due in ${days} day${days > 1 ? 's' : ''}`;
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleGenerateArticle = () => {
    const selectedWords = library
      .filter(card => selectedIds.has(card.id))
      .map(card => card.word);
    
    if (selectedWords.length > 0) {
      onGenerateArticle(selectedWords);
    }
  };

  const selectAll = () => {
    if (selectedIds.size === filteredCards.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = filteredCards.map(c => c.id);
      setSelectedIds(new Set(allIds));
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Total Words */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
             <BookOpen size={32} />
          </div>
          <div>
            <p className="text-slate-500 font-medium">Total Words</p>
            <h2 className="text-3xl font-bold text-slate-800">{library.length}</h2>
          </div>
        </div>

        {/* Due for Review */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
             <div className={`p-4 rounded-xl ${dueCards.length > 0 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                <Clock size={32} />
             </div>
             <div>
               <p className="text-slate-500 font-medium">Due for Review</p>
               <h2 className="text-3xl font-bold text-slate-800">{dueCards.length}</h2>
             </div>
          </div>
          {dueCards.length > 0 && (
             <button 
               onClick={onStartDueReview}
               className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold shadow-md transition-colors text-sm"
             >
               Review All
             </button>
          )}
        </div>

        {/* Mastered/In Progress */}
         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl">
             <CheckCircle2 size={32} />
          </div>
          <div>
            <p className="text-slate-500 font-medium">Learning</p>
            <h2 className="text-3xl font-bold text-slate-800">{learnedCards.length}</h2>
          </div>
        </div>
      </div>

      {/* Library Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-4 w-full xl:w-auto">
            <h2 className="text-2xl font-bold text-slate-800">All Words</h2>
            
            {/* Bulk Actions */}
             {selectedIds.size > 0 && (
               <div className="flex items-center space-x-2 animate-fade-in">
                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                    {selectedIds.size} selected
                  </span>
                  <button
                    onClick={handleGenerateArticle}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-bold text-sm shadow-sm transition-colors"
                  >
                    <FileText size={16} />
                    <span>Generate Story</span>
                  </button>
               </div>
             )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
             <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 w-full md:w-64 transition-all"
                />
             </div>
             
             <button
               onClick={selectAll}
               className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-medium transition-all"
             >
               {selectedIds.size === filteredCards.length && filteredCards.length > 0 ? 'Deselect All' : 'Select All'}
             </button>

             <button
               onClick={() => onReview(filteredCards)}
               disabled={filteredCards.length === 0}
               className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <PlayCircle size={18} />
               <span>Study List</span>
             </button>
          </div>
      </div>

      {/* Word Grid */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <p className="text-slate-400 text-xl font-medium">No words found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
          {filteredCards.map((card) => {
             const isDue = !card.reviewData || card.reviewData.nextReviewDate <= now;
             const isSelected = selectedIds.has(card.id);

             return (
              <div 
                key={card.id} 
                className={`bg-white rounded-xl shadow-sm border p-6 transition-all group relative cursor-pointer
                  ${isDue ? 'border-orange-200 ring-1 ring-orange-100' : 'border-slate-100'}
                  ${isSelected ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/10' : 'hover:shadow-md'}
                `}
                onClick={() => toggleSelection(card.id)}
              >
                {/* Checkbox Overlay */}
                <div className="absolute top-4 right-4 z-10">
                   <div className={`transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-200 group-hover:text-slate-400'}`}>
                      {isSelected ? <CheckSquare size={24} /> : <Square size={24} />}
                   </div>
                </div>

                <div className="flex justify-between items-start mb-4 pr-8">
                  <h3 className="text-2xl font-bold text-slate-800">{card.word}</h3>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm font-mono text-slate-500 mb-2">{card.pronunciation_ipa}</div>
                  <p className="text-slate-600 line-clamp-1">{card.meanings.english}</p>
                  <p className="text-indigo-600 font-medium mt-1">{card.meanings.chinese}</p>
                </div>

                <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-400 uppercase tracking-wider">
                    {card.examples[0]?.source_type || 'Example'}
                  </span>
                  
                  <div className="flex items-center gap-3">
                     <button 
                        onClick={(e) => playAudio(card.word, e)}
                        className="text-indigo-400 hover:text-indigo-600 transition-colors p-1"
                      >
                        <Volume2 size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                        title="Remove from library"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className={`flex items-center gap-1 ${isDue ? 'text-orange-500' : 'text-green-500'}`}>
                        <Calendar size={12} />
                        <span>
                          {card.reviewData ? getNextReviewText(card.reviewData.nextReviewDate) : 'New'}
                        </span>
                      </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};