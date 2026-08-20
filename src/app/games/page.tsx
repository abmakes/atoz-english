'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Play, Bookmark, SlidersHorizontal, X as XIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { QuizListItem } from '@/types/gameTypes';
import type { QuizSort } from '@/lib/schemas';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useGameStore } from '@/stores/useGameStore';
import { TagDrawer } from '@/components/management_ui/TagDrawer';
import { ALL_TAG_CATEGORIES } from '@/lib/tags';
import { discoveryTagMatches } from '@/lib/taxonomy/quiz-taxonomy';
import LoadingSpinner from '@/components/loading_spinner';
import QuizCatalogSkeleton from '@/components/management_ui/QuizCatalogSkeleton';
import { toast } from 'sonner';
import { useIsClerkActive } from '@/components/auth/ClerkActiveProvider';
import { useAuth } from '@clerk/nextjs';

async function getQuizzesClient(sort: QuizSort): Promise<QuizListItem[]> {
  const apiUrl = `/api/quizzes?sort=${sort}`;
  try {
    const res = await fetch(apiUrl, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Failed to fetch quizzes: ${res.statusText}`);
    }
    const data = await res.json();
    if (!data || !Array.isArray(data.data)) {
      console.warn('API response format unexpected (expected { data: [...] }):', data);
      return [];
    }
    return data.data;
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return [];
  }
}

export default function GamesPage() {
  const clerkActive = useIsClerkActive();
  if (clerkActive) {
    return <GamesPageWithAuth />;
  }
  return <GamesPageContent isSignedIn={false} />;
}

function GamesPageWithAuth() {
  const { isSignedIn } = useAuth();
  return <GamesPageContent isSignedIn={!!isSignedIn} />;
}

function GamesPageContent({ isSignedIn }: { isSignedIn: boolean }) {
  const [allQuizzes, setAllQuizzes] = useState<QuizListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sort, setSort] = useState<QuizSort>('newest');
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [navigatingQuizId, setNavigatingQuizId] = useState<string | null>(null);
  const setQuizzes = useGameStore((state) => state.setQuizzes);
  const hasLoadedOnce = useRef(false);

  const loadQuizzes = useCallback(async (sortValue: QuizSort) => {
    if (hasLoadedOnce.current) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      const fetchedQuizzes = await getQuizzesClient(sortValue);
      setAllQuizzes(fetchedQuizzes);
      setQuizzes(fetchedQuizzes);
      hasLoadedOnce.current = true;
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [setQuizzes]);

  useEffect(() => {
    void loadQuizzes(sort);
  }, [sort, loadQuizzes]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSelectedTagsChange = (tags: string[]) => {
    setSelectedTags(tags);
  };

  const updateQuizLocal = (quizId: string, patch: Partial<QuizListItem>) => {
    setAllQuizzes((prev) =>
      prev.map((q) => (q.id === quizId ? { ...q, ...patch, statistics: { ...q.statistics, ...patch.statistics } } : q))
    );
  };

  const requireSignIn = () => {
    toast.message('Sign in required', {
      description: 'Please sign in to like or favorite quizzes.',
    });
  };

  const toggleLike = async (e: React.MouseEvent, quiz: QuizListItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) {
      requireSignIn();
      return;
    }
    if (pendingIds.has(quiz.id)) return;

    const prevLiked = !!quiz.likedByMe;
    const prevLikes = quiz.statistics?.likes ?? 0;
    updateQuizLocal(quiz.id, {
      likedByMe: !prevLiked,
      statistics: {
        ...quiz.statistics,
        likes: Math.max(0, prevLikes + (prevLiked ? -1 : 1)),
        favoritesCount: quiz.statistics?.favoritesCount ?? 0,
        playsCount: quiz.statistics?.playsCount ?? 0,
      },
    });
    setPendingIds((s) => new Set(s).add(quiz.id));

    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/like`, { method: 'POST' });
      if (res.status === 401) {
        updateQuizLocal(quiz.id, {
          likedByMe: prevLiked,
          statistics: { ...quiz.statistics, likes: prevLikes, favoritesCount: quiz.statistics?.favoritesCount ?? 0, playsCount: quiz.statistics?.playsCount ?? 0 },
        });
        requireSignIn();
        return;
      }
      if (!res.ok) throw new Error('Failed to toggle like');
      const body = await res.json();
      updateQuizLocal(quiz.id, {
        likedByMe: body.data.liked,
        statistics: {
          ...quiz.statistics,
          likes: body.data.likes,
          favoritesCount: quiz.statistics?.favoritesCount ?? 0,
          playsCount: quiz.statistics?.playsCount ?? 0,
        },
      });
    } catch {
      updateQuizLocal(quiz.id, {
        likedByMe: prevLiked,
        statistics: { ...quiz.statistics, likes: prevLikes, favoritesCount: quiz.statistics?.favoritesCount ?? 0, playsCount: quiz.statistics?.playsCount ?? 0 },
      });
      toast.error('Could not update like');
    } finally {
      setPendingIds((s) => {
        const next = new Set(s);
        next.delete(quiz.id);
        return next;
      });
    }
  };

  const toggleFavorite = async (e: React.MouseEvent, quiz: QuizListItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) {
      requireSignIn();
      return;
    }
    if (pendingIds.has(`fav-${quiz.id}`)) return;

    const prevFav = !!quiz.favoritedByMe;
    const prevCount = quiz.statistics?.favoritesCount ?? 0;
    updateQuizLocal(quiz.id, {
      favoritedByMe: !prevFav,
      statistics: {
        ...quiz.statistics,
        likes: quiz.statistics?.likes ?? 0,
        playsCount: quiz.statistics?.playsCount ?? 0,
        favoritesCount: Math.max(0, prevCount + (prevFav ? -1 : 1)),
      },
    });
    setPendingIds((s) => new Set(s).add(`fav-${quiz.id}`));

    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/favorite`, { method: 'POST' });
      if (res.status === 401) {
        updateQuizLocal(quiz.id, {
          favoritedByMe: prevFav,
          statistics: { ...quiz.statistics, likes: quiz.statistics?.likes ?? 0, playsCount: quiz.statistics?.playsCount ?? 0, favoritesCount: prevCount },
        });
        requireSignIn();
        return;
      }
      if (!res.ok) throw new Error('Failed to toggle favorite');
      const body = await res.json();
      updateQuizLocal(quiz.id, {
        favoritedByMe: body.data.favorited,
        statistics: {
          ...quiz.statistics,
          likes: quiz.statistics?.likes ?? 0,
          playsCount: quiz.statistics?.playsCount ?? 0,
          favoritesCount: body.data.favoritesCount,
        },
      });
    } catch {
      updateQuizLocal(quiz.id, {
        favoritedByMe: prevFav,
        statistics: { ...quiz.statistics, likes: quiz.statistics?.likes ?? 0, playsCount: quiz.statistics?.playsCount ?? 0, favoritesCount: prevCount },
      });
      toast.error('Could not update favorite');
    } finally {
      setPendingIds((s) => {
        const next = new Set(s);
        next.delete(`fav-${quiz.id}`);
        return next;
      });
    }
  };

  const filteredQuizzes = useMemo(() => {
    let quizzesToFilter = allQuizzes;

    if (selectedTags.length > 0) {
      quizzesToFilter = quizzesToFilter.filter((quiz) =>
        selectedTags.every((selectedTag) =>
          discoveryTagMatches(quiz.tags ?? [], selectedTag)
        )
      );
    }

    if (!searchTerm) return quizzesToFilter;

    return quizzesToFilter.filter((quiz) => {
      const term = searchTerm.toLowerCase();
      const titleMatch = quiz.title.toLowerCase().includes(term);
      const descriptionMatch = quiz.description
        ? quiz.description.toLowerCase().includes(term)
        : false;
      const searchTagMatch = quiz.tags?.some((tag) => tag.toLowerCase().includes(term)) ?? false;
      return titleMatch || descriptionMatch || searchTagMatch;
    });
  }, [allQuizzes, searchTerm, selectedTags]);

  if (!isLoading && (!allQuizzes || allQuizzes.length === 0)) {
    return (
      <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4 grandstander text-[--secondary]">
            No quizzes available.
          </h1>
          <p className="text-muted-foreground">Please try again later or create a new quiz.</p>
        </div>
      </div>
    );
  }

  const showSkeleton = isLoading && allQuizzes.length === 0;

  return (
    <div className="min-h-screen max-w-[1500px] mx-auto text-[#114257] px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="x-auto flex flex-col items-center w-full">
        <div className="sticky top-14 z-20 flex w-full max-w-[900px] p-2 border-2 shadow-solid bg-white border-[#1E5167] rounded-full mt-4 mb-4 items-center gap-2">
          {selectedTags.length > 0 && (
            <div className="flex flex-shrink-0 flex-wrap gap-1 p-2 pl-1 max-w-[250px] overflow-x-auto scrollbar-thin">
              {selectedTags.map((tag) => (
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

          <div className="relative flex-grow flex items-center">
            <Input
              type="text"
              placeholder="Search quizzes..."
              className={`border-none rounded-full flex-grow bg-white focus:ring-0 ${searchTerm ? 'pr-8' : ''}`}
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

          <Select value={sort} onValueChange={(v) => setSort(v as QuizSort)}>
            <SelectTrigger className="w-[150px] shrink-0 rounded-full border-[#1E5167] h-9 bg-white text-[#114257]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="bg-white text-[#114257] border-[#1E5167] shadow-md">
              <SelectItem value="newest" className="focus:bg-[#e8f8ff] focus:text-[#114257]">
                Newest
              </SelectItem>
              <SelectItem value="likes" className="focus:bg-[#e8f8ff] focus:text-[#114257]">
                Most liked
              </SelectItem>
              <SelectItem value="plays" className="focus:bg-[#e8f8ff] focus:text-[#114257]">
                Most played
              </SelectItem>
              <SelectItem value="favorites" className="focus:bg-[#e8f8ff] focus:text-[#114257]">
                Most favorited
              </SelectItem>
            </SelectContent>
          </Select>

          <TagDrawer
            allTags={ALL_TAG_CATEGORIES}
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
            onSelectedTagsChange={handleSelectedTagsChange}
            triggerElement={
              <Button
                variant="ghost"
                size="icon"
                className="p-2 text-[#1E5167] hover:bg-gray-200 rounded-full flex-shrink-0"
              >
                <SlidersHorizontal size={20} />
              </Button>
            }
            title="Filter by Tags"
            description="Select tags to narrow down your quiz results."
          />
        </div>

        {!isSignedIn && (
          <p className="text-sm text-muted-foreground mb-4">
            Sign in to like and favorite quizzes.
          </p>
        )}

        {showSkeleton ? (
          <QuizCatalogSkeleton count={8} />
        ) : (
          <>
            {filteredQuizzes.length === 0 && !isLoading && !isRefreshing && (
              <div className="text-center py-10">
                <p className="text-xl text-gray-500 mb-4">
                  No quizzes match your search or selected tags.
                </p>
              </div>
            )}

            <div className="relative w-full">
              {isRefreshing && (
                <div className="absolute inset-0 z-10 flex items-start justify-center pt-16 bg-white/40 pointer-events-none">
                  <LoadingSpinner size={10} />
                </div>
              )}

              <div
                className={`grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
                  isRefreshing ? 'opacity-60' : ''
                }`}
              >
                {filteredQuizzes.map((quiz) => {
                  const isNavigating = navigatingQuizId === quiz.id;
                  return (
                  <Link
                    className={`block group cursor-pointer relative ${
                      isNavigating ? 'opacity-70 pointer-events-none' : ''
                    }`}
                    key={quiz.id}
                    href={`/games/${quiz.id}`}
                    passHref
                    onClick={() => {
                      setNavigatingQuizId(quiz.id);
                    }}
                  >
                    {isNavigating && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[32px] bg-white/50 pointer-events-none">
                        <span className="grandstander font-bold text-[#114257] text-lg bg-white/90 px-4 py-2 rounded-full border-2 border-[#1E5167] shadow-[3px_3px_0px_0px_#1E5167]">
                          Opening…
                        </span>
                      </div>
                    )}
                    {/* Image card — hover reveals stats, tags, and actions */}
                    <div className="relative overflow-hidden rounded-[32px] border-2 border-[#1E5167] bg-card shadow-[3px_6px_0px_0px_#1E5167] mb-3 transition duration-300 ease-in-out">
                      <div className="relative h-48 w-full min-w-72">
                        <Image
                          src={quiz.imageUrl || '/placeholder.webp'}
                          alt={quiz.title}
                          fill
                          style={{ objectFit: 'cover' }}
                          className="rounded-t-[32px] transition-opacity duration-300 group-hover:opacity-20"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      </div>

                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/30 p-4 text-[#114257] opacity-0 transition-opacity duration-300 group-hover:opacity-100 grandstander pointer-events-none group-hover:pointer-events-auto">
                        <span className="text-xl font-bold">{quiz.questions.length} questions</span>

                        <button
                          type="button"
                          aria-label={quiz.likedByMe ? 'Unlike quiz' : 'Like quiz'}
                          onClick={(e) => toggleLike(e, quiz)}
                          className="flex items-center gap-1 hover:opacity-80"
                        >
                          <Heart
                            className={`h-5 w-5 ${
                              quiz.likedByMe
                                ? 'fill-red-500 stroke-red-500'
                                : 'stroke-red-500 fill-transparent'
                            }`}
                          />
                          <span className="text-base pt-1 ml-1">
                            {quiz.statistics?.likes ?? 0} likes
                          </span>
                        </button>

                        <button
                          type="button"
                          aria-label={quiz.favoritedByMe ? 'Remove favorite' : 'Favorite quiz'}
                          onClick={(e) => toggleFavorite(e, quiz)}
                          className="flex items-center gap-1 hover:opacity-80"
                        >
                          <Bookmark
                            className={`h-5 w-5 ${
                              quiz.favoritedByMe
                                ? 'fill-[--primary-accent] stroke-[--primary-accent]'
                                : 'stroke-[#114257] fill-transparent'
                            }`}
                          />
                          <span className="text-base pt-1 ml-1">
                            {quiz.statistics?.favoritesCount ?? 0} saved
                          </span>
                        </button>

                        {quiz.tags.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-2 mt-1">
                            {quiz.tags.map((tag, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs pt-1 bg-white text-[--text-color] border-[--primary-accent] shadow-[3px_3px_0px_0px_var(--primary-accent-hover)]"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title + play count; description stays clean */}
                    <div className="px-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-xl font-semibold grandstander text-[#114257] px-2 leading-tight">
                          {quiz.title}
                        </h3>
                        <div className="flex items-center gap-1 shrink-0 pr-2 pt-1">
                          <Play className="h-4 w-4 stroke-[--primary-accent] shrink-0 fill-[--primary-accent]" />
                          <span className="text-base font-semibold text-[#114257]">
                            {quiz.statistics?.playsCount ?? 0}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-sans text-[#114257] line-clamp-2 inclusive-sans px-2">
                        {quiz.description}
                      </p>
                      {quiz.level && (
                        <span className="mt-2 inline-block rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700 grandstander">
                          {quiz.level}
                        </span>
                      )}
                    </div>
                  </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
