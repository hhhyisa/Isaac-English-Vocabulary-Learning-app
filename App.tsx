import React, { useState, useEffect } from 'react';
import { InputSection } from './components/InputSection';
import { Flashcard } from './components/Flashcard';
import { Quiz } from './components/Quiz';
import { PersonalCenter } from './components/PersonalCenter';
import { Dictation } from './components/Dictation';
import { ArticleView } from './components/ArticleView';
import { StorySetup } from './components/StorySetup';
import { generateFlashcards, generateArticle } from './services/geminiService';
import { AppView, FlashcardData, GeneratedArticle } from './types';
import { calculateNextReview, Rating, initializeReviewData } from './utils/srs';
import { BrainCircuit, Grid, PlayCircle, ChevronLeft, ChevronRight, RefreshCw, User, Loader2, Repeat, Zap, Menu, Mic, BookOpenText, FileText, Search } from 'lucide-react';

const STORAGE_KEY = 'lingoflash_library';
const ARTICLE_STORAGE_KEY = 'lingoflash_articles';

const INSPIRING_QUOTES = [
  "Expanding your world, one word at a time...",
  "Language is the roadmap of a culture...",
  "Unlock new possibilities with every word...",
  "Building your linguistic arsenal...",
  "Crafting your path to fluency...",
  "Every new word is a new way to think...",
  "Connecting you to the world..."
];

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.INPUT);
  const [activeDeck, setActiveDeck] = useState<FlashcardData[]>([]);
  
  // Initialize library lazily from local storage with MIGRATION logic
  const [library, setLibrary] = useState<FlashcardData[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((c: any) => {
            // Migration: Convert legacy meaning object to array
            let meanings = c.meanings;
            if (meanings && !Array.isArray(meanings)) {
                // If it's the old format {english: string, chinese: string}
                meanings = [{
                    partOfSpeech: 'general',
                    english: meanings.english,
                    chinese: meanings.chinese
                }];
            }

            return {
                ...c,
                meanings: meanings,
                reviewData: c.reviewData ? c.reviewData : initializeReviewData()
            };
        });
      } catch (e) {
        console.error("Failed to load library", e);
        return [];
      }
    }
    return [];
  });

  // Initialize Article History lazily
  const [articleHistory, setArticleHistory] = useState<GeneratedArticle[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(ARTICLE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [commandInput, setCommandInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Article State
  const [currentArticle, setCurrentArticle] = useState<GeneratedArticle | null>(null);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
  }, [library]);

  useEffect(() => {
    localStorage.setItem(ARTICLE_STORAGE_KEY, JSON.stringify(articleHistory));
  }, [articleHistory]);

  const handleGenerate = async (words: string[]) => {
    const INITIAL_BATCH_SIZE = 3;
    const CHUNK_SIZE = 10;
    const initialWords = words.slice(0, INITIAL_BATCH_SIZE);
    const remainingWords = words.slice(INITIAL_BATCH_SIZE);

    setLoading(true);
    setLoadingMessage(INSPIRING_QUOTES[Math.floor(Math.random() * INSPIRING_QUOTES.length)]);
    setCurrentCardIndex(0);

    try {
      if (initialWords.length > 0) {
        const initialCards = await generateFlashcards(initialWords);
        setActiveDeck(initialCards);
        addToLibrary(initialCards);
        setView(AppView.FLASHCARDS);
        setLoading(false);
      } else {
        setLoading(false);
        return;
      }

      if (remainingWords.length > 0) {
        setBackgroundLoading(true);
        for (let i = 0; i < remainingWords.length; i += CHUNK_SIZE) {
            const chunk = remainingWords.slice(i, i + CHUNK_SIZE);
            try {
                const moreCards = await generateFlashcards(chunk);
                setActiveDeck(prev => [...prev, ...moreCards]);
                addToLibrary(moreCards);
            } catch (err) {
                console.error("Background generation error", err);
            }
        }
        setBackgroundLoading(false);
      }
    } catch (err) {
      // Improved error handling for validation
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Something went wrong generating the cards. Please try fewer words or check your key.");
      }
      setLoading(false);
      setBackgroundLoading(false);
    }
  };

  const handleGenerateArticle = async (words: string[]) => {
    if (words.length === 0) return;
    setLoading(true);
    setLoadingMessage("Weaving your words into a story...");
    try {
      const article = await generateArticle(words);
      // Add to history and set as current
      setArticleHistory(prev => [article, ...prev]);
      setCurrentArticle(article);
      setView(AppView.ARTICLE);
    } catch (e) {
      alert("Failed to generate article. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCommandSubmit = () => {
     if (!commandInput.trim()) return;
     const words = commandInput.split(/[\n,]+/).map(w => w.trim()).filter(w => w.length > 0);
     if (words.length === 0) return;
     
     handleGenerate(words);
     setCommandInput('');
  };

  const addToLibrary = (newCards: FlashcardData[]) => {
    setLibrary(prev => {
        const existingWords = new Set(prev.map(c => c.word.toLowerCase()));
        const unique = newCards.filter(c => !existingWords.has(c.word.toLowerCase()));
        return [...unique, ...prev];
    });
  };
  
  const handleAddSingleCard = (card: FlashcardData) => {
      addToLibrary([card]);
  };

  const handleDeleteFromLibrary = (id: string) => {
    setLibrary(prev => prev.filter(c => c.id !== id));
    setActiveDeck(prev => prev.filter(c => c.id !== id));
  };

  // Start "Free Study" Mode
  const handleReviewFromLibrary = (selectedCards: FlashcardData[]) => {
    setActiveDeck(selectedCards);
    setView(AppView.FLASHCARDS);
    setCurrentCardIndex(0);
  };

  // Start "SRS Review" Mode
  const handleStartDueReview = () => {
    const now = Date.now();
    const dueCards = library.filter(c => !c.reviewData || c.reviewData.nextReviewDate <= now);
    
    if (dueCards.length === 0) {
      alert("No cards due for review!");
      return;
    }

    // Sort by Due Date (Overdue first)
    dueCards.sort((a, b) => (a.reviewData?.nextReviewDate || 0) - (b.reviewData?.nextReviewDate || 0));

    setActiveDeck(dueCards);
    setView(AppView.REVIEW);
    setCurrentCardIndex(0);
  };

  // Start Dictation Mode
  const handleStartDictation = () => {
    const now = Date.now();
    let pool = library.filter(c => !c.reviewData || c.reviewData.nextReviewDate <= now);
    
    if (pool.length < 10) {
        const notDue = library.filter(c => c.reviewData && c.reviewData.nextReviewDate > now);
        pool = [...pool, ...notDue];
    }

    if (pool.length === 0) {
        alert("Add some words to your library first!");
        return;
    }

    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);
    
    setActiveDeck(selected);
    setView(AppView.DICTATION);
  };

  const handleSRSRating = (rating: Rating) => {
    if (view !== AppView.REVIEW) return;

    const currentCard = activeDeck[currentCardIndex];
    
    const newReviewData = calculateNextReview(currentCard.reviewData, rating);

    setLibrary(prev => prev.map(c => c.id === currentCard.id ? { ...c, reviewData: newReviewData } : c));
    setActiveDeck(prev => prev.map(c => c.id === currentCard.id ? { ...c, reviewData: newReviewData } : c));

    if (currentCardIndex < activeDeck.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      alert("Review Session Complete! Great job.");
      setView(AppView.PERSONAL_CENTER);
    }
  };

  const nextCard = () => {
    setCurrentCardIndex((prev) => (prev + 1) % activeDeck.length);
  };

  const prevCard = () => {
    setCurrentCardIndex((prev) => (prev - 1 + activeDeck.length) % activeDeck.length);
  };

  // Search within the active deck
  const handleDeckSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    if (term.length > 0) {
        const index = activeDeck.findIndex(c => 
            c.word.toLowerCase().startsWith(term) || 
            c.word.toLowerCase().includes(term)
        );
        if (index !== -1) {
            setCurrentCardIndex(index);
        }
    }
  };

  const dueCount = library.filter(c => !c.reviewData || c.reviewData.nextReviewDate <= Date.now()).length;

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className={`${isSidebarOpen ? 'w-[280px]' : 'w-0'} md:w-[280px] bg-white border-r border-slate-200 flex flex-col shrink-0 z-30 shadow-xl transition-all duration-300 overflow-hidden`}>
        {/* Branding */}
        <div className="p-6 border-b border-slate-100 flex items-center space-x-3 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setView(AppView.INPUT)}>
             <div className="bg-indigo-600 text-white p-2 rounded-lg shadow-md">
              <BrainCircuit size={24} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              LingoFlash
            </span>
        </div>

        <div className="p-4 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
             
             {/* Main Navigation Block */}
             <div className="space-y-4">
               {/* Personal Center Button */}
               <button
                 onClick={() => setView(AppView.PERSONAL_CENTER)}
                 className={`w-full flex items-center space-x-3 px-4 py-4 rounded-xl transition-all border ${view === AppView.PERSONAL_CENTER ? 'bg-indigo-600 text-white shadow-lg border-indigo-500 scale-[1.02]' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:shadow-sm'}`}
               >
                  <User size={24} />
                  <span className="font-bold text-lg">Personal Center</span>
               </button>

               {/* Command Input */}
               <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center px-1">
                     <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Add</label>
                  </div>
                  <div className="relative group">
                    <textarea 
                      value={commandInput}
                      onChange={(e) => setCommandInput(e.target.value)}
                      onKeyDown={(e) => {
                          if(e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleCommandSubmit();
                          }
                      }}
                      placeholder="Type new words..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none h-28 shadow-inner transition-all group-hover:bg-white"
                    />
                    <div className="absolute bottom-2 right-2">
                      <button 
                          onClick={handleCommandSubmit}
                          disabled={loading || !commandInput.trim()}
                          className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                          title="Generate Flashcards"
                      >
                          {loading ? <Loader2 size={14} className="animate-spin"/> : <Zap size={14} />}
                      </button>
                    </div>
                  </div>
               </div>
             </div>

             {/* Dynamic Menu */}
             <div className="space-y-2 pt-6 border-t border-slate-100">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-2 block">Learning</label>
                 
                 {/* Review Button */}
                 {dueCount > 0 && (
                   <button
                     onClick={handleStartDueReview}
                     className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all border ${view === AppView.REVIEW ? 'bg-orange-50 text-orange-700 border-orange-200 font-bold shadow-sm' : 'bg-white text-slate-600 border-transparent hover:bg-orange-50 hover:text-orange-600'}`}
                   >
                     <div className="flex items-center space-x-3">
                        <Repeat size={18} />
                        <span>Review Due</span>
                     </div>
                     <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full font-bold shadow-sm border border-orange-200">{dueCount}</span>
                   </button>
                )}
                
                {/* Story Mode Button */}
                 <button
                   onClick={() => setView(AppView.STORY_SETUP)}
                   className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${view === AppView.STORY_SETUP || view === AppView.ARTICLE ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                 >
                   <BookOpenText size={18} />
                   <span>Story Mode</span>
                 </button>

                {/* Dictation Mode Button */}
                 {library.length > 0 && (
                   <button
                     onClick={handleStartDictation}
                     className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${view === AppView.DICTATION ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                   >
                     <Mic size={18} />
                     <span>Dictation (10)</span>
                   </button>
                 )}

                 {activeDeck.length > 0 && (
                    <>
                        <button 
                          onClick={() => {
                            setView(AppView.FLASHCARDS);
                            setCurrentCardIndex(0); // Show latest/first card
                          }}
                          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${view === AppView.FLASHCARDS ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Grid size={18} />
                            <span>Current Deck</span>
                        </button>
                        <button 
                          onClick={() => setView(AppView.QUIZ)}
                          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${view === AppView.QUIZ ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <PlayCircle size={18} />
                            <span>Quiz Mode</span>
                        </button>
                    </>
                 )}
             </div>

             {/* Article History List */}
             {articleHistory.length > 0 && (
               <div className="space-y-2 pt-6 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-2 block">Previous Stories</label>
                  <div className="space-y-1">
                     {articleHistory.map((article) => (
                        <button 
                          key={article.id} 
                          onClick={() => { setCurrentArticle(article); setView(AppView.ARTICLE); }}
                          className={`w-full text-left px-4 py-2 rounded-lg text-sm truncate transition-colors flex items-center space-x-2
                             ${currentArticle?.id === article.id && view === AppView.ARTICLE 
                               ? 'bg-indigo-50 text-indigo-700 font-medium' 
                               : 'text-slate-600 hover:bg-slate-50'}`
                          }
                          title={article.title}
                        >
                          <FileText size={14} className="shrink-0" />
                          <span className="truncate">{article.title}</span>
                        </button>
                     ))}
                  </div>
               </div>
             )}
        </div>
      </aside>

      {/* MAIN CONTENT RIGHT */}
      <main className="flex-1 h-full relative flex flex-col bg-slate-50/50">
          
          {/* Mobile Header Toggle */}
          <div className="md:hidden p-4 flex items-center bg-white border-b border-slate-200">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600">
               <Menu size={24} />
             </button>
             <span className="font-bold ml-4 text-slate-700">LingoFlash</span>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden w-full h-full p-4 md:p-8 flex flex-col items-center">
             
             {/* GLOBAL LOADING STATE */}
             {loading && view !== AppView.INPUT && (
               <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
                 <Loader2 size={48} className="animate-spin text-indigo-600 mb-4" />
                 <p className="text-xl font-medium text-slate-700 animate-pulse">{loadingMessage || "Loading..."}</p>
               </div>
             )}

             {view === AppView.INPUT && (
               <InputSection onGenerate={handleGenerate} isLoading={loading} />
             )}

             {view === AppView.PERSONAL_CENTER && (
               <PersonalCenter 
                 library={library} 
                 onReview={handleReviewFromLibrary} 
                 onDelete={handleDeleteFromLibrary}
                 onStartDueReview={handleStartDueReview}
                 onGenerateArticle={handleGenerateArticle}
               />
             )}

             {view === AppView.STORY_SETUP && (
                <StorySetup 
                  library={library}
                  onGenerate={handleGenerateArticle}
                  onBack={() => setView(AppView.PERSONAL_CENTER)}
                />
             )}

             {view === AppView.ARTICLE && currentArticle && (
                <ArticleView 
                  article={currentArticle} 
                  onExit={() => setView(AppView.STORY_SETUP)} 
                  onAddCard={handleAddSingleCard}
                  library={library}
                />
             )}

             {view === AppView.DICTATION && (
                <Dictation cards={activeDeck} onExit={() => setView(AppView.FLASHCARDS)} />
             )}

             {(view === AppView.FLASHCARDS || view === AppView.REVIEW) && activeDeck.length > 0 && (
               <div className="flex flex-col items-center w-full animate-fade-in max-w-5xl">
                 
                 {view === AppView.REVIEW && (
                   <div className="mb-6 bg-orange-100 text-orange-800 px-6 py-2 rounded-full font-bold flex items-center space-x-2 shadow-sm border border-orange-200">
                     <Repeat size={18} />
                     <span>Review Session: {currentCardIndex + 1} / {activeDeck.length}</span>
                   </div>
                 )}

                 {/* Deck Search Bar */}
                 {view === AppView.FLASHCARDS && (
                    <div className="w-full max-w-md mb-6 relative z-20">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                              type="text" 
                              placeholder="Find in deck..."
                              onChange={handleDeckSearch}
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
                            />
                        </div>
                    </div>
                 )}
                 
                 {/* Card Display */}
                 <div className="relative w-full flex justify-center mb-8">
                     {/* Navigation Buttons - Desktop/Tablet Side */}
                     {activeDeck.length > 1 && (
                       <>
                         <button 
                           onClick={prevCard}
                           className="hidden md:flex absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-12 p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-full transition-all"
                         >
                           <ChevronLeft size={32} />
                         </button>
                         <button 
                           onClick={nextCard}
                           className="hidden md:flex absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-12 p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-full transition-all"
                         >
                           <ChevronRight size={32} />
                         </button>
                       </>
                     )}

                     <Flashcard 
                       data={activeDeck[currentCardIndex]} 
                       onRate={view === AppView.REVIEW ? handleSRSRating : undefined}
                     />
                 </div>

                 {/* Mobile Navigation */}
                 {activeDeck.length > 1 && (
                    <div className="flex md:hidden items-center justify-between w-full max-w-xs px-4">
                        <button 
                           onClick={prevCard}
                           className="p-4 bg-white shadow-md rounded-full text-slate-600 hover:text-indigo-600"
                         >
                           <ChevronLeft size={24} />
                         </button>
                         <span className="font-bold text-slate-400 text-sm">
                           {currentCardIndex + 1} / {activeDeck.length}
                         </span>
                         <button 
                           onClick={nextCard}
                           className="p-4 bg-white shadow-md rounded-full text-slate-600 hover:text-indigo-600"
                         >
                           <ChevronRight size={24} />
                         </button>
                    </div>
                 )}

                 {view === AppView.FLASHCARDS && (
                    <div className="mt-4">
                        <button 
                           onClick={() => setView(AppView.QUIZ)}
                           className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center space-x-2"
                        >
                           <PlayCircle size={20} />
                           <span>Start Quiz</span>
                        </button>
                    </div>
                 )}

               </div>
             )}

             {view === AppView.QUIZ && activeDeck.length > 0 && (
                <Quiz cards={activeDeck} onExit={() => setView(AppView.FLASHCARDS)} />
             )}

          </div>
      </main>
    </div>
  );
};

export default App;