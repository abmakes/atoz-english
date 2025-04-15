import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { QuizListItem } from '@/types/gameTypes';

// Function to fetch quizzes (server-side)
async function getQuizzes(): Promise<QuizListItem[]> {
    // Use the full URL for server-side fetch if necessary, or environment variable
    // Assuming the API route is accessible at this path relative to the server
    // In production, use process.env.NEXT_PUBLIC_API_URL or similar
    const apiUrl = process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/quizzes`
        : 'http://localhost:3000/api/quizzes';

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

// Mock data removed
// const mockQuizzes: QuizListItem[] = [ ... ];

// TODO: Fetch actual levels/filters from API or define statically
const mockFilters = ['Pre-A1 Starters', 'A1 Movers', 'A2 Flyers', 'B1 Preliminary'];

// Make the page component async
export default async function GamesPage() {
  const quizzes = await getQuizzes();

  // Handle the case where fetching fails or returns no quizzes
  if (!quizzes || quizzes.length === 0) {
      return (
          <div className="min-h-screen bg-blue-100 px-4 py-8 sm:px-6 lg:px-8">
              <div className="container mx-auto text-center">
                  <h1 className="text-2xl font-bold mb-4">Could not load quizzes.</h1>
                  <p>Please try again later.</p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-blue-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        {/* Header Row: Search, Title, Filter - Consider making filter/search client components for interactivity */}
        <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
           {/* Search Input */}
           <div className="flex w-full items-center gap-2 md:w-auto md:flex-1 md:max-w-xs">
             <span className="font-semibold">Search</span>
             <Input type="text" placeholder="type keywords" className="rounded-full bg-white shadow-sm" />
           </div>

           {/* Title */}
           <h1 className="text-center text-3xl font-bold uppercase tracking-wider text-gray-700 md:text-4xl">
             Choose Quiz
           </h1>

           {/* Filter Select */}
           <div className="flex w-full items-center justify-end gap-2 md:w-auto md:flex-1 md:max-w-xs">
             <span className="font-semibold">Select Filters</span>
             <Select>
               <SelectTrigger className="w-full rounded-full bg-white shadow-sm md:w-[180px]">
                 <SelectValue placeholder="Select level" />
               </SelectTrigger>
               <SelectContent>
                 {mockFilters.map((filter) => (
                   <SelectItem key={filter} value={filter.toLowerCase().replace(' ', '-')}>
                     {filter}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
        </div>

        {/* Grid - Now uses fetched quizzes */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {quizzes.map((quiz) => (
            <Link
              key={quiz.id}
              // Link to the default game slug
              href={`/games/${quiz.id}/multiple-choice`}
              passHref
              legacyBehavior
            >
              <a className="block transform cursor-pointer transition duration-300 ease-in-out hover:-translate-y-1 hover:scale-[1.02]">
                <Card className="flex h-full flex-col overflow-hidden rounded-lg border-none bg-white shadow-md hover:shadow-xl">
                  {/* Image Section */}
                  <CardContent className="p-0">
                     <div className="relative h-48 w-full">
                       <Image
                         // Correct fallback image path (assuming placeholder.webp exists in /public)
                         src={quiz.imageUrl || '/placeholder.webp'}
                         alt={quiz.title}
                         fill
                         style={{ objectFit: 'cover' }}
                         className="rounded-t-lg"
                         // Consider removing priority or making it conditional
                         priority={['quiz-1', 'quiz-2', 'quiz-3', 'quiz-4'].includes(quiz.id)} // Adjust logic if IDs change
                         sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                       />
                     </div>
                  </CardContent>
                  {/* Text Content Section */}
                  <CardHeader className="pt-4">
                    <CardTitle className="text-lg font-semibold">{quiz.title}</CardTitle>
                    <CardDescription className="text-sm text-gray-600">{quiz.description}</CardDescription>
                  </CardHeader>
                  {/* Footer Section */}
                  <CardFooter className="mt-auto flex items-center justify-between border-t bg-gray-50 px-4 py-2">
                    <div className="flex items-center gap-1 text-sm text-blue-600">
                      <Heart className="h-4 w-4 fill-current" />
                      <span>{quiz.likes}</span>
                    </div>
                    <span className="text-xs text-gray-500">{quiz.questionCount} questions</span>
                    {/* Display level if available */}
                    {quiz.level && (
                        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">{quiz.level}</span>
                    )}
                  </CardFooter>
                </Card>
              </a>
            </Link>
          ))}
        </div>

        {/* "See more..." Button */}
        <div className="mt-12 flex justify-center">
           <Button variant="outline" size="lg" className="rounded-full border-2 border-gray-600 bg-white px-8 py-3 text-lg font-semibold text-gray-700 shadow-sm hover:bg-gray-100">
             See more...
           </Button>
        </div>
      </div>
    </div>
  );
} 