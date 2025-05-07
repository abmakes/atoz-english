import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { QuizListItem } from '@/types/gameTypes';

// Function to fetch quizzes (server-side)
async function getQuizzes(): Promise<QuizListItem[]> {
    // Use the full URL for server-side fetch if necessary, or environment variable
    // Assuming the API route is accessible at this path relative to the server
    // In production, use process.env.NEXT_PUBLIC_API_URL or similar
    const apiUrl = `https://atoz-english.vercel.app/api/quizzes`

    try {
        const res = await fetch(apiUrl, {
            cache: 'no-store', // Or 'force-cache', 'default' depending on needs
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch quizzes: ${res.statusText}`);
        }

        const data = await res.json();

        // Corrected Check: Expect { data: QuizListItem[] } based on logs
        if (!data || !Array.isArray(data.data)) {
             console.warn("API response format unexpected (expected { data: [...] }):", data);
             return []; // Return empty array on format mismatch
        }

        // Return the correct array
        return data.data;
    } catch (error) {
        console.error("Error fetching quizzes:", error);
        // Return empty array or re-throw error depending on desired behavior
        return [];
    }
}

// Make the page component async
export default async function GamesPage() {
  const quizzes = await getQuizzes();

  // Handle the case where fetching fails or returns no quizzes
  if (!quizzes || quizzes.length === 0) {
      // Add quiz data to local storage
      
      
      return (
          // Apply theme background
          <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
              <div className="container mx-auto text-center">
                  <h1 className="text-2xl font-bold mb-4 grandstander text-[--secondary]">Could not load quizzes.</h1>
                  <p className="text-muted-foreground">Please try again later.</p>
              </div>
          </div>
      );
  }

  return (
    // Apply theme background
    <div className="min-h-screen text-[#114257] px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="container x-auto flex flex-col items-center">
        {/* Header Row: Search, Title, Filter - Consider making filter/search client components for interactivity */}
        <div className="mb-12 flex w-96 p-2 border-2 shadow-solid bg-white border-[#1E5167] rounded-full">
           {/* Search Input */}
           <div className="flex w-96 items-center gap-2 md:w-auto md:flex-1">
             <Input type="text" placeholder="Search for a quiz" className="border-none rounded-full" />
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" stroke-miterlimit="10" stroke-width="1.5" d="M21.25 12H8.895m-4.361 0H2.75m18.5 6.607h-5.748m-4.361 0H2.75m18.5-13.214h-3.105m-4.361 0H2.75m13.214 2.18a2.18 2.18 0 1 0 0-4.36a2.18 2.18 0 0 0 0 4.36Zm-9.25 6.607a2.18 2.18 0 1 0 0-4.36a2.18 2.18 0 0 0 0 4.36Zm6.607 6.608a2.18 2.18 0 1 0 0-4.361a2.18 2.18 0 0 0 0 4.36Z"/></svg>
           </div>

        </div>
        {/* Grid - Updated Card Structure */} 
        <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {quizzes.map((quiz) => (
            <Link
              key={quiz.id}
              href={`/games/${quiz.id}/multiple-choice`}
              passHref
              legacyBehavior
            >
              {/* Outer link acting as group for hover */}
              <a className="block group cursor-pointer">
                {/* 1. Image Container (The actual "Card") */}
                <div className="relative overflow-hidden rounded-[32px] border-2 border-[#1E5167] bg-card shadow-[3px_6px_0px_0px_#1E5167] mb-3 transition duration-300 ease-in-out group-hover:shadow-[3px_6px_0px_0px_#1E5167]">
                  {/* Image */}
                  <div className="relative h-48 w-full">
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
                      <span className="text-xl font-bold">{quiz.questionCount} questions</span>
                      <div className="flex items-center gap-1 mb-2">
                      <Heart className="h-5 w-5 fill-red-500 stroke-red-500" /> 
                      <span className="text-base">{quiz.likes} likes</span>
                    </div>
                    {/* Plays - Placeholder or omit */}
                    <span className="text-base mb-2">0 plays</span>
                  </div>
                </div>

                {/* 2. Text Content Area (Below Image Card) */}
                <div className="px-1">
                   {/* Title and Heart */}
                   <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-xl font-semibold grandstander text-[#114257] px-2 leading-tight">{quiz.title}</h3>
                      {/* Original Heart moved here, adjust styling if needed */}
                      {/* <Heart className="h-4 w-4 fill-primary stroke-primary mt-1 shrink-0" /> */}
                      {/* Figma seems to only show heart on hover overlay */} 
                   </div>
                   {/* Description */}
                   <p className="text-sm font-sans text-[#114257] line-clamp-2 inclusive-sans px-2">{quiz.description} Placeholder Lorem ipsum dolor sit amet, consectetur adipiscing
                   </p>
                   {/* Level Tag - Can remain here */} 
                   {quiz.level && (
                        <span className="mt-2 inline-block rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700 grandstander">{quiz.level}</span>
                    )}
                </div>
              </a>
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