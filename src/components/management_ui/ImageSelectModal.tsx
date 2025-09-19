'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UploadCloud, Search, Loader2 } from 'lucide-react';
import GiphyGrid from './GiphyModal';
import Image from 'next/image';
import { useCustomToast } from '@/components/ui/CustomToast';

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
  onImageSelect: (imageUrl: string, metadata?: {
    pixabayId: number;
    pixabayUser: string;
    tags: string[];
    searchTerm: string;
    width: number;
    height: number;
  }) => void;
}

export default function ImageSelectModal({ isOpen, onClose, onImageSelect }: ImageSelectModalProps) {
  const { addToast } = useCustomToast();
  const [activeTab, setActiveTab] = useState("stored");
  const [isDragging, setIsDragging] = useState(false);
  
  // Pixabay state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PixabayImage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  
  // Stored images state
  const [storedImages, setStoredImages] = useState<StoredImage[]>([]);
  const [isLoadingStored, setIsLoadingStored] = useState(false);
  const [storedSearchQuery, setStoredSearchQuery] = useState("");
  const [storedCurrentPage, setStoredCurrentPage] = useState(1);
  const [storedHasMore, setStoredHasMore] = useState(false);
  
  // Top used images state
  const [topUsedImages, setTopUsedImages] = useState<StoredImage[]>([]);
  const [isLoadingTopUsed, setIsLoadingTopUsed] = useState(false);
  
  // Get Pixabay API key from environment
  const pixabayApiKey = process.env.NEXT_PUBLIC_PIXABAY_API_KEY;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type.startsWith('image/')) {
        const imageUrl = URL.createObjectURL(file);
        onImageSelect(imageUrl, undefined);
        // onClose(); // User might want to confirm or see preview
      } else {
        console.warn("Selected file is not an image.");
        // Consider adding a toast notification here
      }
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
          const imageUrl = URL.createObjectURL(file);
          onImageSelect(imageUrl, undefined);
          // onClose();
        } else {
          console.warn("Dropped file is not an image.");
          // Consider adding a toast notification here
        }
      }
    },
    [onImageSelect]
  );
  
  const handleGiphySelect = (url: string) => {
    onImageSelect(url, undefined);
    // onClose(); // Keep modal open to allow changing selection before confirming with "Done"
  };

  const handlePixabaySelect = (image: PixabayImage) => {
    // Store the Pixabay URL temporarily for display during quiz creation
    // The image will be downloaded and stored when the quiz is published
    // Pass the full image metadata as a custom object
    const imageMetadata = {
      url: image.webformatURL,
      pixabayId: image.id,
      pixabayUser: image.user,
      tags: image.tags.split(', ').filter(tag => tag.trim() !== ''), // Convert comma-separated string to array
      searchTerm: searchQuery, // Use the current search query
      width: image.webformatWidth,
      height: image.webformatHeight
    };
    
    onImageSelect(image.webformatURL, imageMetadata);
    addToast('Image selected! It will be saved when you publish the quiz.', { variant: 'success' });
  };

  const handleStoredImageSelect = (image: StoredImage) => {
    // Use the blob URL for stored images
    onImageSelect(image.blobUrl, undefined);
  };

    const searchPixabay = async (query: string, page: number = 1) => {
    if (!pixabayApiKey || !query.trim()) {
      return;
    }

    setIsSearching(true);
    try {
      const url = `https://pixabay.com/api/?key=${pixabayApiKey}&q=${encodeURIComponent(query)}&image_type=photo&orientation=all&editors_choice=true&safeSearch=true&per_page=20`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: PixabayResponse = await response.json();
      setSearchResults(data.hits);
      setHasMoreResults(data.hits.length === 20); // If we got 20 results, there might be more
      setCurrentPage(page);
    } catch (error) {
      console.error('Error searching Pixabay:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };



  const loadMoreResults = () => {
    if (searchQuery.trim() && hasMoreResults) {
      searchPixabay(searchQuery.trim(), currentPage + 1);
    }
  };

  const searchStoredImages = async (query: string, page: number = 1) => {
    setIsLoadingStored(true);
    try {
      const params = new URLSearchParams({
        q: query,
        page: page.toString(),
        limit: '20'
      });

      const response = await fetch(`/api/images/search?${params}`);
      if (!response.ok) {
        throw new Error('Failed to search stored images');
      }

      const result: StoredImageResponse = await response.json();
      if (result.success) {
        if (page === 1) {
          setStoredImages(result.data.images);
        } else {
          setStoredImages(prev => [...prev, ...result.data.images]);
        }
        setStoredHasMore(result.data.pagination.hasNext);
        setStoredCurrentPage(page);
      }
    } catch (error) {
      console.error('Error searching stored images:', error);
      setStoredImages([]);
    } finally {
      setIsLoadingStored(false);
    }
  };

  const loadMoreStoredImages = () => {
    if (storedSearchQuery.trim() && storedHasMore) {
      searchStoredImages(storedSearchQuery.trim(), storedCurrentPage + 1);
    }
  };

  const loadTopUsedImages = async () => {
    setIsLoadingTopUsed(true);
    try {
      const response = await fetch('/api/images/top-used?limit=30');
      if (!response.ok) {
        throw new Error('Failed to fetch top used images');
      }

      const result = await response.json();
      if (result.success) {
        setTopUsedImages(result.data.images);
      }
    } catch (error) {
      console.error('Error loading top used images:', error);
      setTopUsedImages([]);
    } finally {
      setIsLoadingTopUsed(false);
    }
  };

  // Load top used images when modal opens and stored tab is active
  useEffect(() => {
    if (isOpen && activeTab === 'stored' && topUsedImages.length === 0) {
      loadTopUsedImages();
    }
  }, [isOpen, activeTab, topUsedImages.length]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl grandstander max-h-[90vh] overflow-clip">
        <DialogHeader>
          <DialogTitle className="text-2xl">Select Image</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full h-12 grid-cols-4 bg-slate-100 p-1 rounded-lg">
            <TabsTrigger value="stored" className="data-[state=active]:bg-white data-[state=active]:text-[--primary-accent] data-[state=active]:font-semibold data-[state=active]:shadow-md rounded-md h-10">Top Picks</TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-white data-[state=active]:text-[--primary-accent] data-[state=active]:font-semibold data-[state=active]:shadow-md rounded-md h-10">Upload</TabsTrigger>
            <TabsTrigger value="giphy" className="data-[state=active]:bg-white data-[state=active]:text-[--primary-accent] data-[state=active]:font-semibold data-[state=active]:shadow-md rounded-md h-10">Giphy</TabsTrigger>
            <TabsTrigger value="pixabay" className="data-[state=active]:bg-white data-[state=active]:text-[--primary-accent] data-[state=active]:font-semibold data-[state=active]:shadow-md rounded-md h-10">Pixabay</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="py-4">
            <div 
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center w-full h-64 p-6 
                          border-2 border-dashed rounded-lg cursor-pointer 
                          transition-colors duration-200 ease-in-out 
                          ${isDragging ? 'border-violet-500 bg-violet-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}`}
            >
              <UploadCloud size={48} className={`mb-3 ${isDragging ? 'text-violet-600' : 'text-slate-400'}`} />
              <p className={`mb-2 text-sm ${isDragging ? 'text-violet-700' : 'text-slate-500'}`}>
                <span className="font-semibold">Drag & drop an image</span> or click to browse
              </p>
              <Input
                id="fileUploadModal"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only" 
              />
              <label 
                  htmlFor="fileUploadModal" 
                  className={`
                    mt-2 cursor-pointer rounded-lg border-0 text-base font-semibold 
                    bg-violet-100 text-violet-700 hover:bg-violet-200 
                    px-4 py-2 transition-colors
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                  `}
              >Choose File</label>
               <p className={`mt-2 text-xs ${isDragging ? 'text-violet-600' : 'text-slate-400'}`}>SVG, PNG, JPG or GIF</p>
            </div>
          </TabsContent>
          <TabsContent value="stored" className="py-4 h-[500px] overflow-clip">
            <div className="space-y-4">
              {/* Search Form */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Search our collection..."
                  value={storedSearchQuery}
                  onChange={(e) => setStoredSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (storedSearchQuery.trim()) {
                        searchStoredImages(storedSearchQuery.trim(), 1);
                      }
                    }
                  }}
                  className="flex-1"
                />
                <Button 
                  type="button"
                  onClick={() => {
                    if (storedSearchQuery.trim()) {
                      searchStoredImages(storedSearchQuery.trim(), 1);
                    }
                  }}
                  disabled={isLoadingStored}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {isLoadingStored ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Search
                </Button>
              </div>

              {/* Show search results if searching, otherwise show top used images */}
              {storedSearchQuery ? (
                // Search Results
                <>
                  {storedImages.length > 0 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
                        {storedImages.map((image) => (
                          <div
                            key={image.id}
                            className="group cursor-pointer rounded-lg overflow-hidden border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all duration-200"
                            onClick={() => handleStoredImageSelect(image)}
                          >
                            <div className="aspect-square relative">
                              <Image
                                src={image.blobUrl}
                                alt={image.searchTerm || 'Stored image'}
                                width={200}
                                height={200}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
                              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                {image.usageCount} uses
                              </div>
                            </div>
                            <div className="p-2">
                              <p className="text-xs text-slate-600 truncate">
                                {image.searchTerm || 'No search term'}
                              </p>
                              <p className="text-xs text-slate-400">
                                {image.width}×{image.height}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Load More Button */}
                      {storedHasMore && (
                        <div className="text-center">
                          <Button
                            onClick={loadMoreStoredImages}
                            disabled={isLoadingStored}
                            variant="outline"
                            className="border-violet-300 text-violet-700 hover:bg-violet-50"
                          >
                            {isLoadingStored ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Load More
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* No Search Results */}
                  {storedSearchQuery && !isLoadingStored && storedImages.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <p>No stored images found for &quot;{storedSearchQuery}&quot;</p>
                      <p className="text-sm mt-1">Try a different search term or search Pixabay to add images</p>
                    </div>
                  )}
                </>
              ) : (
                // Top Used Images (Default View)
                <>
                  {isLoadingTopUsed ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-slate-500">Loading most used images...</p>
                    </div>
                  ) : topUsedImages.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-700">Most Used Images</h3>
                        <p className="text-sm text-slate-500">Top 30 by usage</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
                        {topUsedImages.map((image) => (
                          <div
                            key={image.id}
                            className="group cursor-pointer rounded-lg overflow-hidden border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all duration-200"
                            onClick={() => handleStoredImageSelect(image)}
                          >
                            <div className="aspect-square relative">
                              <Image
                                src={image.blobUrl}
                                alt={image.searchTerm || 'Stored image'}
                                width={200}
                                height={200}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
                              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                {image.usageCount} uses
                              </div>
                            </div>
                            <div className="p-2">
                              <p className="text-xs text-slate-600 truncate">
                                {image.searchTerm || 'No search term'}
                              </p>
                              <p className="text-xs text-slate-400">
                                {image.width}×{image.height}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <p>No images found in your collection</p>
                      <p className="text-sm mt-1">Search Pixabay to add images to your collection</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
          <TabsContent value="giphy" className="py-4 h-[500px] overflow-clip">
            <GiphyGrid onGifSelect={handleGiphySelect} />
          </TabsContent>
          <TabsContent value="pixabay" className="py-4 h-[500px] overflow-clip">
            <div className="space-y-4">
                             {/* Search Form */}
               <div className="flex gap-2">
                 <Input
                   type="text"
                   placeholder="Search for images..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') {
                       e.preventDefault();
                       if (searchQuery.trim()) {
                         searchPixabay(searchQuery.trim(), 1);
                       }
                     }
                   }}
                   className="flex-1"
                 />
                 <Button 
                   type="button"
                   onClick={() => {
                     if (searchQuery.trim()) {
                       searchPixabay(searchQuery.trim(), 1);
                     }
                   }}
                   disabled={!pixabayApiKey || isSearching}
                   className="bg-violet-600 hover:bg-violet-700"
                 >
                   {isSearching ? (
                     <Loader2 className="h-4 w-4 animate-spin" />
                   ) : (
                     <Search className="h-4 w-4" />
                   )}
                   Search
                 </Button>
               </div>

              {/* API Key Warning */}
              {!pixabayApiKey && (
                <div className="text-center py-8 text-slate-500">
                  <p>Pixabay API key is missing.</p>
                  <p className="text-sm mt-1">
                    Please set NEXT_PUBLIC_PIXABAY_API_KEY in your .env.local file. Pixabay search will not be available.
                  </p>
                </div>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
                    {searchResults.map((image) => (
                      <div
                        key={image.id}
                        className="group cursor-pointer rounded-lg overflow-hidden border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all duration-200"
                        onClick={() => handlePixabaySelect(image)}
                      >
                        <div className="aspect-square relative">
                          <Image
                            src={image.webformatURL}
                            alt={image.tags}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Load More Button */}
                  {hasMoreResults && (
                    <div className="text-center">
                      <Button
                        onClick={loadMoreResults}
                        disabled={isSearching}
                        variant="outline"
                        className="border-violet-300 text-violet-700 hover:bg-violet-50"
                      >
                        {isSearching ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Load More
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* No Results */}
              {searchQuery && !isSearching && searchResults.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <p>No images found for &quot;{searchQuery}&quot;</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
