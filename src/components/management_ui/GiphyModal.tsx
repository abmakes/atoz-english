import React, { useState } from 'react';
import { Grid } from '@giphy/react-components';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { IGif } from '@giphy/js-types';

interface GiphyGridProps {
  onGifSelect?: (url: string) => void;
}

const GiphyGrid = ({ onGifSelect }: GiphyGridProps) => {
  const [searchTerm, setSearchTerm] = useState('dogs');
  
  const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;

  if (!apiKey) {
    console.error(
      "GIPHY API key is missing. Please set NEXT_PUBLIC_GIPHY_API_KEY in your .env.local file. Giphy search will not be available."
    );
    return (
      <Card className="w-full mx-auto p-4 border-none">
        <CardContent className="flex items-center justify-center h-[500px]">
          <p className="text-red-500 text-center">
            Giphy search is unavailable. <br />
            API key is missing. Please configure it in your .env.local file.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Initialize GiphyFetch with environment variable
  const gf = new GiphyFetch(apiKey);

  // Fetch function for Giphy
  const fetchGifs = (offset: number) => 
    gf.search(searchTerm, { offset, limit: 10 });

  const handleGifClick = (gif: IGif) => {
    if (onGifSelect) {
      let imageUrl: string | undefined;

      if (gif && gif.images) { // Check if gif and gif.images exist
        imageUrl = gif.images.downsized?.url || gif.images.original?.url;
      }

      if (imageUrl) {
        onGifSelect(imageUrl);
      } else {
        // Log a warning if no suitable image URL could be found
        console.warn('Could not retrieve a valid image URL from the selected GIF. GIF object:', gif);
        // onGifSelect will not be called if no URL is found, preventing further errors.
      }
    }
  };

  return (
    <Card className="w-full mx-auto p-4 border-none">
      <CardContent>
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Search GIFs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full mb-4"
          />
        </div>
        {/* Add overflow-y-auto to enable scrolling and h-[600px] for fixed height */}
        <div className="w-full h-[500px] overflow-y-auto" data-testid="giphy-container">
          <Grid
            width={720}
            columns={3}
            gutter={6}
            fetchGifs={fetchGifs}
            key={searchTerm}
            onGifClick={handleGifClick}
            noLink={true}
            // Add borderRadius for better visual appearance
            borderRadius={8}
            // Add loaderConfig to prefetch GIFs for smoother scrolling
            loaderConfig={{
              rootMargin: '100px 0px',
              threshold: 0.1
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default GiphyGrid;
