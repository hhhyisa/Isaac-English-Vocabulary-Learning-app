import React, { useState } from 'react';
import { FlashcardData } from '../types';
import { ArrowLeft, BookOpenText, CheckSquare, Square, Zap, Search, Layers } from 'lucide-react';

interface StorySetupProps {
  library: FlashcardData[];
  onGenerate: (words: string[]) => void;
  onBack: () => void;
}

export const StorySetup: React.FC<StorySetupProps> = ({ library, onGenerate, onBack }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Filter based on search
  const filteredLibrary = library.filter(c => 
    c.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.meanings.some(m => m.english.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      if (newSet.size >= 50) {
        alert("You can select up to 50 words.");
        return;
      }
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleGenerate = () => {
    const words = library
      .filter(c => selectedIds.has(c.id))
      .map(c => c.word);
    
    if (words.length === 0) {
        alert("Please select at least one word.");
        return;
    }
    onGenerate(words);
  };

  const selectTop = (count: number) => {
    const MAX_SELECTION = 50;
    // Get the IDs from the current filtered view
    const ids = filteredLibrary.slice(0, count).map(c => c.id);
    const newSet = new Set(selectedIds);
    
    ids.forEach(id => {
        if (newSet.size < MAX_SELECTION) {
            newSet.add(id);
        }
    });
    
    setSelectedIds(newSet);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 animate-fade-in flex flex-col h-full">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 shrink-0">
        <div className="flex items-center space-x-4">
             <button 
               onClick={onBack}
               className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
             >
               <ArrowLeft size={24} />
             </button>
             <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <BookOpenText className="text-indigo-600" />
                    <span>Story Mode Setup</span>
                </h1>
                <p className="text-slate-500 text-sm">Select words to weave into a story (Latest first)</p>
             </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-bold text-sm border border-indigo-100">
              {selectedIds.size} / 50 Selected
           </div>
           <button
             onClick={handleGenerate}
             disabled={selectedIds.size === 0}
             className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:shadow-none"
           >
             <Zap size={18} />
             <span>Generate Story</span>
           </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col xl:flex-row gap-4 mb-6 shrink-0">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search your library..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
            />
         </div>
         
         <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 no-scrollbar">
             <span className="text-sm font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-2 hidden md:block">
                Quick Select:
             </span>
             <button 
               onClick={() => selectTop(10)}
               className="px-4 py-3 bg-white border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap text-sm"
             >
               Top 10
             </button>
             <button 
               onClick={() => selectTop(20)}
               className="px-4 py-3 bg-white border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap text-sm"
             >
               Top 20
             </button>
             <button 
               onClick={() => selectTop(30)}
               className="px-4 py-3 bg-white border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap text-sm"
             >
               Top 30
             </button>
             
             <div className="w-px h-8 bg-slate-200 mx-2 hidden md:block"></div>
             
             <button 
               onClick={() => setSelectedIds(new Set())}
               className="px-4 py-3 bg-white border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors whitespace-nowrap text-sm"
             >
               Clear
             </button>
         </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-20 custom-scrollbar">
         {filteredLibrary.length === 0 ? (
             <div className="text-center py-20">
                 <p className="text-slate-400">No words found in your library.</p>
             </div>
         ) : (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 {filteredLibrary.map(card => {
                    const isSelected = selectedIds.has(card.id);
                    const primaryMeaning = card.meanings[0] || { english: '', chinese: '' };
                    return (
                        <div 
                          key={card.id}
                          onClick={() => toggleSelection(card.id)}
                          className={`
                            relative p-4 rounded-xl border-2 cursor-pointer transition-all group
                            ${isSelected 
                                ? 'border-indigo-500 bg-indigo-50/30' 
                                : 'border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md'}
                          `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className={`font-bold text-lg truncate pr-6 ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                                    {card.word}
                                </h3>
                                <div className={`absolute top-4 right-4 ${isSelected ? 'text-indigo-600' : 'text-slate-200 group-hover:text-slate-400'}`}>
                                    {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 truncate mb-1">{primaryMeaning.english}</p>
                            <p className="text-xs text-indigo-500 font-medium truncate">{primaryMeaning.chinese}</p>
                        </div>
                    );
                 })}
             </div>
         )}
      </div>
    </div>
  );
};
