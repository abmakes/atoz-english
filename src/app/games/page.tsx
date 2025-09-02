'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Play, SlidersHorizontal, X as XIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { QuizListItem } from '@/types/gameTypes';
import { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '@/stores/useGameStore'; // Import the store
import { TagDrawer } from '@/components/management_ui/TagDrawer';
import { ALL_TAG_CATEGORIES } from '@/lib/tags';

// Function to fetch quizzes (can remain outside or be moved inside if preferred)
async function getQuizzesClient(): Promise<QuizListItem[]> {
    const apiUrl = `/api/quizzes`; // Use relative path for client-side fetch
    try {
        const res = await fetch(apiUrl, {
            cache: 'no-store',
        });
        if (!res.ok) {
            throw new Error(`Failed to fetch quizzes: ${res.statusText}`);
        }
        const data = await res.json();
        if (!data || !Array.isArray(data.data)) {
             console.warn("API response format unexpected (expected { data: [...] }):", data);
             return [];
        }
        return data.data;
    } catch (error) {
        console.error("Error fetching quizzes:", error);
        return [];
    }
}

export default function GamesPage() {
  const [allQuizzes, setAllQuizzes] = useState<QuizListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const setQuizzes = useGameStore((state) => state.setQuizzes); // Get the action

  useEffect(() => {
    async function loadQuizzes() {
      setIsLoading(true);
      const fetchedQuizzes = await getQuizzesClient();
      setAllQuizzes(fetchedQuizzes);
      setQuizzes(fetchedQuizzes); // Add quizzes to the global store
      setIsLoading(false);

      console.log(fetchedQuizzes[0])
      // Log searchable content for each quiz
      // console.log("Searchable content for fetched quizzes:");
      // fetchedQuizzes.forEach((quiz, index) => {
      //   console.log(`Quiz ${index + 1} (ID: ${quiz.id}):`);
      //   console.log(`  Title: ${quiz.title}`);
      //   console.log(`  Description: ${quiz.description}`);
      //   console.log(`  Tags: ${quiz.tags ? quiz.tags.join(', ') : 'N/A'}`);
      // });
    }
    loadQuizzes();
  }, [setQuizzes]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filteredQuizzes = useMemo(() => {
    let quizzesToFilter = allQuizzes;

    // Filter by selected tags first (AND logic for multiple tags)
    if (selectedTags.length > 0) {
      quizzesToFilter = quizzesToFilter.filter(quiz => 
        selectedTags.every(selectedTag => 
          quiz.tags && quiz.tags.some(quizTag => quizTag.toLowerCase() === selectedTag.toLowerCase())
        )
      );
    }

    // Then filter by search term
    if (!searchTerm) {
      return quizzesToFilter;
    }
    return quizzesToFilter.filter(quiz => {
      const term = searchTerm.toLowerCase();
      const titleMatch = quiz.title.toLowerCase().includes(term);
      const descriptionMatch = quiz.description ? quiz.description.toLowerCase().includes(term) : false;
      // Search term can also match tags, in addition to selectedTags filter
      const searchTagMatch = (quiz.tags && quiz.tags.length > 0) ? quiz.tags.some(tag => tag.toLowerCase().includes(term)) : false;
      return titleMatch || descriptionMatch || searchTagMatch;
    });
  }, [allQuizzes, searchTerm, selectedTags]);

  if (isLoading) {
    return (
      <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 flex justify-center items-center">
        <p className="text-xl grandstander text-[--secondary]">Loading quizzes...</p>
        {/* You can add a spinner here */}
      </div>
    );
  }

  if (!isLoading && (!allQuizzes || allQuizzes.length === 0)) {
      return (
          <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
              <div className="container mx-auto text-center">
                  <h1 className="text-2xl font-bold mb-4 grandstander text-[--secondary]">No quizzes available.</h1>
                  <p className="text-muted-foreground">Please try again later or create a new quiz.</p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen max-w-[1500px] mx-auto text-[#114257] px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="x-auto flex flex-col items-center">
        <div className="sticky top-14 z-20 flex w-full max-w-[700px] p-2 border-2 shadow-solid bg-white border-[#1E5167] rounded-full mt-4 mb-8 items-center gap-2">
           {/* Selected Tags Display */}
           {selectedTags.length > 0 && (
            <div className="flex flex-shrink-0 flex-wrap gap-1 p-2 pl-1 max-w-[250px] overflow-x-auto scrollbar-thin">
              {selectedTags.map(tag => (
                <Badge 
                  key={tag} 
                  variant="outline"
                  onClick={() => handleTagToggle(tag)} 
                  className="text-xs pt-1 bg-white text-[--text-color] border-[--primary-accent] shadow-[3px_3px_0px_0px_var(--primary-accent-hover)] cursor-pointer"
                >
                   {tag} <XIcon size={12} className="ml-1 stroke-[--text-color]" />
                </Badge>
              ))}
            </div>
           )}

           {/* Search Input with Clear Button */}
           <div className="relative flex-grow flex items-center">
             <Input 
               type="text" 
               placeholder="Search quizzes..." 
               className={`border-none rounded-full flex-grow focus:ring-0 ${searchTerm ? 'pr-8' : ''}`} 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
             {searchTerm && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 text-gray-500 hover:text-gray-700 rounded-full p-1"
                >
                  <XIcon size={16} />
                </Button>
             )}
           </div>

           {/* Tag Drawer Trigger */}
           <TagDrawer
              allTags={ALL_TAG_CATEGORIES}
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
              triggerElement={
                <Button variant="ghost" size="icon" className="p-2 text-[#1E5167] hover:bg-gray-200 rounded-full flex-shrink-0">
                  <SlidersHorizontal size={20} />
                </Button>
              }
              title="Filter by Tags"
              description="Select tags to narrow down your quiz results."
            />
        </div>
        
        {(filteredQuizzes.length === 0 && !isLoading) && (
          <div className="text-center py-10">
            <p className="text-xl text-gray-500 mb-4">No quizzes match your search or selected tags.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredQuizzes.map((quiz) => (
            <Link
              className="block group cursor-pointer"
              key={quiz.id}
              href={`/games/${quiz.id}/multiple-choice`}
              passHref
            >
                {/* 1. Image Container (The actual "Card") */}
                <div className="relative overflow-hidden rounded-[32px] border-2 border-[#1E5167] bg-card shadow-[3px_6px_0px_0px_#1E5167] mb-3 transition duration-300 ease-in-out group-hover:shadow-[3px_6px_0px_0px_#1E5167]">
                  
                  {/* Image */}
                  <div className="relative h-48 w-full min-w-72">
                    <Image
                      src={quiz.imageUrl || '/placeholder.webp'}
                      alt={quiz.title}
                      fill
                      style={{ objectFit: 'cover' }}
                      // Image itself doesn't need border now, container has it. Keep top rounding.
                      className="rounded-t-[32px] transition-opacity duration-300 group-hover:opacity-20"
                      priority={['quiz-1', 'quiz-2', 'quiz-3', 'quiz-4'].includes(quiz.id)} 
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/30 p-4 text-[#114257]  opacity-0 transition-opacity duration-300 group-hover:opacity-100 grandstander">
                    <span className="text-xl font-bold">{quiz.questions.length} questions</span> 
                    <div className="flex items-center gap-1">
                      <span><Heart className="h-5 w-5 fill-red-500 stroke-red-500" /></span>
                      <span className="text-base pt-1 ml-1">{quiz.statistics?.likes || 0} likes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span><Play className="h-5 w-5 fill-[--text-color] stroke-[--text-color]" /></span>
                      <span className="text-base pt-1 ml-1">{quiz.statistics?.playsCount || 0} plays</span>
                    </div>

                    {quiz.tags.length > 0 && (
                      <div className='text-center'>
                        <div className="flex flex-wrap justify-center gap-2 mt-1">
                          {quiz.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs pt-1 bg-white text-[--text-color] border-[--primary-accent] shadow-[3px_3px_0px_0px_var(--primary-accent-hover)]">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Text Content Area (Below Image Card) */}
                <div className="px-1">
                   {/* Title and Heart */}
                   <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-xl font-semibold grandstander text-[#114257] px-2 leading-tight">{quiz.title}</h3>

                      {/* Original Heart moved here, adjust styling if needed */}
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4 stroke-primary shrink-0 fill-[--primary-accent]" />
                        <span className="text-base font-semibold">{quiz.statistics?.favoritesCount || 0}</span>
                      </div>
                      {/* Figma seems to only show heart on hover overlay */} 
                   </div>
                   {/* Description */}
                   <p className="text-sm font-sans text-[#114257] line-clamp-2 inclusive-sans px-2">{quiz.description}
                   </p>
                   {/* Level Tag - Can remain here */} 
                   {quiz.level && (
                        <span className="mt-2 inline-block rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700 grandstander">{quiz.level}</span>
                    )}
                </div>
            </Link>
          ))}
        </div>

        {/* "See more..." Button */}
        <div className="mt-12 flex justify-center">
           <Button variant="outline" size="lg" className="rounded-full border-2 border-border bg-card px-8 py-3 text-lg font-semibold text-[#114257] shadow-sm hover:bg-muted grandstander">
             See more...
           </Button>
        </div>
      </div>
    </div>
  );
} 