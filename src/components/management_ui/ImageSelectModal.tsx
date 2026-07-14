'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UploadCloud, Search, Loader2, ChevronDown, ChevronUp, X } from 'lucide-react';
import Image from 'next/image';
import { useCustomToast } from '@/components/ui/CustomToast';
import { GiphyFetch } from '@giphy/js-fetch-api';
import type { IGif } from '@giphy/js-types';

interface PixabayImage {
  id: number;
  webformatURL: string;
  webformatWidth: number;
  webformatHeight: number;
  previewURL: string;
  largeImageURL: string;
  imageWidth: number;
  imageHeight: number;
  user: string;
  tags: string;
  views: number;
  downloads: number;
}

interface PixabayResponse {
  total: number;
  totalHits: number;
  hits: PixabayImage[];
}

interface StoredImage {
  id: string;
  filename: string;
  blobUrl: string;
  width: number;
  height: number;
  mimeType: string;
  searchTerm?: string;
  tags: string[];
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
}

interface StoredImageResponse {
  success: boolean;
  data: {
    images: StoredImage[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

interface ImageSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (
    imageUrl: string,
    metadata?: {
      pixabayId: number;
      pixabayUser: string;
      tags: string[];
      searchTerm: string;
      width: number;
      height: number;
    },
    localFile?: File | null
  ) => void;
}

const PREVIEW_COUNT = 4;
const PAGE_SIZE = 12;

type SectionKey = 'stored' | 'giphy' | 'pixabay';

function takeVisible<T>(items: T[], expanded: boolean): T[] {
  return expanded ? items : items.slice(0, PREVIEW_COUNT);
}

export default function ImageSelectModal({ isOpen, onClose, onImageSelect }: ImageSelectModalProps) {
  const { addToast } = useCustomToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const [topUsedImages, setTopUsedImages] = useState<StoredImage[]>([]);
  const [isLoadingTopUsed, setIsLoadingTopUsed] = useState(false);

  const [storedImages, setStoredImages] = useState<StoredImage[]>([]);
  const [storedPage, setStoredPage] = useState(1);
  const [storedHasMore, setStoredHasMore] = useState(false);
  const [isLoadingStored, setIsLoadingStored] = useState(false);

  const [giphyResults, setGiphyResults] = useState<IGif[]>([]);
  const [giphyOffset, setGiphyOffset] = useState(0);
  const [giphyHasMore, setGiphyHasMore] = useState(false);
  const [isLoadingGiphy, setIsLoadingGiphy] = useState(false);

  const [pixabayResults, setPixabayResults] = useState<PixabayImage[]>([]);
  const [pixabayPage, setPixabayPage] = useState(1);
  const [pixabayHasMore, setPixabayHasMore] = useState(false);
  const [isLoadingPixabay, setIsLoadingPixabay] = useState(false);

  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    stored: false,
    giphy: false,
    pixabay: false,
  });

  const pixabayApiKey = process.env.NEXT_PUBLIC_PIXABAY_API_KEY;
  const giphyApiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;

  const resetSearchState = useCallback(() => {
    setQuery('');
    setActiveQuery('');
    setHasSearched(false);
    setStoredImages([]);
    setGiphyResults([]);
    setPixabayResults([]);
    setExpanded({ stored: false, giphy: false, pixabay: false });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetSearchState();
      return;
    }
    void loadTopUsedImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const loadTopUsedImages = async () => {
    setIsLoadingTopUsed(true);
    try {
      const response = await fetch('/api/images/top-used?limit=24');
      if (!response.ok) throw new Error('Failed to fetch top used images');
      const result = await response.json();
      if (result.success) setTopUsedImages(result.data.images);
    } catch (error) {
      console.error('Error loading top used images:', error);
      setTopUsedImages([]);
    } finally {
      setIsLoadingTopUsed(false);
    }
  };

  const searchStored = async (q: string, page: number, append: boolean) => {
    setIsLoadingStored(true);
    try {
      const params = new URLSearchParams({
        q,
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      const response = await fetch(`/api/images/search?${params}`);
      if (!response.ok) throw new Error('Failed to search stored images');
      const result: StoredImageResponse = await response.json();
      if (result.success) {
        setStoredImages((prev) =>
          append ? [...prev, ...result.data.images] : result.data.images
        );
        setStoredHasMore(result.data.pagination.hasNext);
        setStoredPage(page);
      }
    } catch (error) {
      console.error('Error searching stored images:', error);
      if (!append) setStoredImages([]);
    } finally {
      setIsLoadingStored(false);
    }
  };

  const searchGiphy = async (q: string, offset: number, append: boolean) => {
    if (!giphyApiKey) {
      setGiphyResults([]);
      setGiphyHasMore(false);
      return;
    }
    setIsLoadingGiphy(true);
    try {
      const gf = new GiphyFetch(giphyApiKey);
      const { data, pagination } = await gf.search(q, {
        offset,
        limit: PAGE_SIZE,
        rating: 'pg',
      });
      setGiphyResults((prev) => (append ? [...prev, ...data] : data));
      const nextOffset = offset + data.length;
      setGiphyOffset(nextOffset);
      setGiphyHasMore(nextOffset < (pagination?.total_count ?? 0));
    } catch (error) {
      console.error('Error searching Giphy:', error);
      if (!append) setGiphyResults([]);
    } finally {
      setIsLoadingGiphy(false);
    }
  };

  const searchPixabay = async (q: string, page: number, append: boolean) => {
    if (!pixabayApiKey) {
      setPixabayResults([]);
      setPixabayHasMore(false);
      return;
    }
    setIsLoadingPixabay(true);
    try {
      const url =
        `https://pixabay.com/api/?key=${pixabayApiKey}` +
        `&q=${encodeURIComponent(q)}` +
        `&image_type=photo&orientation=all&editors_choice=true&safeSearch=true` +
        `&per_page=${PAGE_SIZE}&page=${page}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: PixabayResponse = await response.json();
      setPixabayResults((prev) => (append ? [...prev, ...data.hits] : data.hits));
      setPixabayHasMore(data.hits.length === PAGE_SIZE && page * PAGE_SIZE < data.totalHits);
      setPixabayPage(page);
    } catch (error) {
      console.error('Error searching Pixabay:', error);
      if (!append) setPixabayResults([]);
    } finally {
      setIsLoadingPixabay(false);
    }
  };

  const runUnifiedSearch = async (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    setActiveQuery(q);
    setHasSearched(true);
    setExpanded({ stored: false, giphy: false, pixabay: false });
    await Promise.all([
      searchStored(q, 1, false),
      searchGiphy(q, 0, false),
      searchPixabay(q, 1, false),
    ]);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('Please choose an image file.', { variant: 'error' });
      return;
    }
    onImageSelect(URL.createObjectURL(file), undefined, file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (!file?.type.startsWith('image/')) return;
      onImageSelect(URL.createObjectURL(file), undefined, file);
    },
    [onImageSelect]
  );

  const handleGiphySelect = (gif: IGif) => {
    const imageUrl = gif.images?.downsized?.url || gif.images?.original?.url;
    if (imageUrl) onImageSelect(imageUrl, undefined);
  };

  const handlePixabaySelect = (image: PixabayImage) => {
    onImageSelect(image.webformatURL, {
      pixabayId: image.id,
      pixabayUser: image.user,
      tags: image.tags.split(', ').filter((tag) => tag.trim() !== ''),
      searchTerm: activeQuery || query,
      width: image.webformatWidth,
      height: image.webformatHeight,
    });
    addToast('Image selected! It will be saved when you publish the quiz.', { variant: 'success' });
  };

  const handleStoredImageSelect = (image: StoredImage) => {
    onImageSelect(image.blobUrl, undefined);
  };

  const toggleExpand = (key: SectionKey) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isSearchingAny = isLoadingStored || isLoadingGiphy || isLoadingPixabay;

  const renderStoredGrid = (images: StoredImage[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {images.map((image) => (
        <button
          type="button"
          key={image.id}
          className="group text-left rounded-xl overflow-hidden border border-slate-200 hover:border-[#49c8ff] hover:shadow-md transition-all bg-white"
          onClick={() => handleStoredImageSelect(image)}
        >
          <div className="aspect-square relative">
            <Image
              src={image.blobUrl}
              alt={image.searchTerm || 'Stored image'}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              sizes="160px"
              unoptimized
            />
            <span className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
              {image.usageCount} uses
            </span>
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl grandstander max-h-[88vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-8 pt-8 pb-2">
          <DialogTitle className="text-2xl text-center text-[#114257]">Find an image</DialogTitle>
        </DialogHeader>

        <div className="px-8 pt-6 pb-4">
          <div className="mx-auto max-w-xl">
            <div className="relative flex items-center rounded-full border-2 border-[#1E5167] bg-white shadow-[3px_3px_0px_0px_#1E5167] focus-within:ring-2 focus-within:ring-[#49c8ff]">
              <Search className="absolute left-4 h-5 w-5 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search collection, Giphy, and Pixabay..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  // Stop Enter from submitting any parent quiz form
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    void runUnifiedSearch(query);
                  }
                }}
                className="h-14 border-0 bg-transparent pl-12 pr-24 rounded-full text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus
              />
              <div className="absolute right-2 flex items-center gap-1">
                {query ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    onClick={() => {
                      resetSearchState();
                    }}
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}
                <Button
                  type="button"
                  disabled={!query.trim() || isSearchingAny}
                  onClick={() => void runUnifiedSearch(query)}
                  className="h-10 rounded-full px-4 bg-[#114257] hover:bg-[#1E5167] text-white"
                >
                  {isSearchingAny ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 text-sm text-[#114257] hover:underline"
            >
              <UploadCloud className="h-4 w-4" />
              Or upload from your device
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto px-8 pb-8 space-y-8"
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {isDragging ? (
            <div className="rounded-xl border-2 border-dashed border-[#49c8ff] bg-[#e8f8ff] p-8 text-center text-[#114257]">
              Drop an image to use it
            </div>
          ) : null}

          {!hasSearched ? (
            <section className="space-y-5 pt-2">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-semibold text-[#114257]">Most used</h3>
                <p className="text-sm text-slate-500 inclusive-sans">
                  Popular images from our collection - or search above
                </p>
              </div>
              {isLoadingTopUsed ? (
                <div className="py-12 text-center text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  Loading...
                </div>
              ) : topUsedImages.length > 0 ? (
                renderStoredGrid(topUsedImages)
              ) : (
                <p className="text-center text-slate-500 py-10 inclusive-sans">
                  No images in our collection yet. Try searching Giphy or Pixabay.
                </p>
              )}
            </section>
          ) : (
            <>
              <ResultSection
                title="Our collection"
                subtitle={activeQuery}
                loading={isLoadingStored && storedImages.length === 0}
                empty={!isLoadingStored && storedImages.length === 0}
                emptyText="No matches in our collection"
                expanded={expanded.stored}
                canExpand={storedImages.length > PREVIEW_COUNT}
                onToggleExpand={() => toggleExpand('stored')}
                hasMore={expanded.stored && storedHasMore}
                onLoadMore={() => void searchStored(activeQuery, storedPage + 1, true)}
                loadingMore={isLoadingStored && storedImages.length > 0}
              >
                {renderStoredGrid(takeVisible(storedImages, expanded.stored))}
              </ResultSection>

              <ResultSection
                title="Giphy"
                subtitle={activeQuery}
                loading={isLoadingGiphy && giphyResults.length === 0}
                empty={!isLoadingGiphy && (giphyResults.length === 0 || !giphyApiKey)}
                emptyText={
                  !giphyApiKey ? 'Giphy API key is not configured' : 'No GIFs found'
                }
                expanded={expanded.giphy}
                canExpand={giphyResults.length > PREVIEW_COUNT}
                onToggleExpand={() => toggleExpand('giphy')}
                hasMore={expanded.giphy && giphyHasMore}
                onLoadMore={() => void searchGiphy(activeQuery, giphyOffset, true)}
                loadingMore={isLoadingGiphy && giphyResults.length > 0}
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {takeVisible(giphyResults, expanded.giphy).map((gif) => {
                    const thumb =
                      gif.images?.fixed_width_small?.url ||
                      gif.images?.preview_gif?.url ||
                      gif.images?.downsized?.url;
                    if (!thumb) return null;
                    return (
                      <button
                        type="button"
                        key={gif.id}
                        className="group rounded-xl overflow-hidden border border-slate-200 hover:border-[#49c8ff] hover:shadow-md transition-all bg-white aspect-square relative"
                        onClick={() => handleGiphySelect(gif)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumb}
                          alt={gif.title || 'GIF'}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </button>
                    );
                  })}
                </div>
              </ResultSection>

              <ResultSection
                title="Pixabay"
                subtitle={activeQuery}
                loading={isLoadingPixabay && pixabayResults.length === 0}
                empty={!isLoadingPixabay && (pixabayResults.length === 0 || !pixabayApiKey)}
                emptyText={
                  !pixabayApiKey ? 'Pixabay API key is not configured' : 'No photos found'
                }
                expanded={expanded.pixabay}
                canExpand={pixabayResults.length > PREVIEW_COUNT}
                onToggleExpand={() => toggleExpand('pixabay')}
                hasMore={expanded.pixabay && pixabayHasMore}
                onLoadMore={() => void searchPixabay(activeQuery, pixabayPage + 1, true)}
                loadingMore={isLoadingPixabay && pixabayResults.length > 0}
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {takeVisible(pixabayResults, expanded.pixabay).map((image) => (
                    <button
                      type="button"
                      key={image.id}
                      className="group rounded-xl overflow-hidden border border-slate-200 hover:border-[#49c8ff] hover:shadow-md transition-all bg-white"
                      onClick={() => handlePixabaySelect(image)}
                    >
                      <div className="aspect-square relative">
                        <Image
                          src={image.webformatURL}
                          alt={image.tags}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                          sizes="160px"
                          unoptimized
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </ResultSection>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResultSection({
  title,
  subtitle,
  loading,
  empty,
  emptyText,
  expanded,
  canExpand,
  onToggleExpand,
  hasMore,
  onLoadMore,
  loadingMore,
  children,
}: {
  title: string;
  subtitle: string;
  loading: boolean;
  empty: boolean;
  emptyText: string;
  expanded: boolean;
  canExpand: boolean;
  onToggleExpand: () => void;
  hasMore: boolean;
  onLoadMore: () => void;
  loadingMore: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-t border-slate-100 pt-6 first:border-t-0 first:pt-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[#114257]">{title}</h3>
          <p className="text-xs text-slate-500 inclusive-sans">
            Results for &quot;{subtitle}&quot;
          </p>
        </div>
        {canExpand && !empty ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onToggleExpand}
            className="rounded-full border-[#1E5167] text-[#114257] shrink-0"
          >
            {expanded ? (
              <>
                Show less <ChevronUp className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                Expand <ChevronDown className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="py-8 text-center text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          Searching...
        </div>
      ) : empty ? (
        <p className="text-sm text-slate-500 py-4 inclusive-sans">{emptyText}</p>
      ) : (
        <>
          {children}
          {hasMore ? (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="rounded-full border-[#1E5167] text-[#114257]"
              >
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Load more
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
