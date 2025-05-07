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
  
  // Initialize GiphyFetch with environment variable
  // Make sure to add NEXT_PUBLIC_GIPHY_API_KEY to your .env.local file
  const gf = new GiphyFetch(process.env.NEXT_PUBLIC_GIPHY_API_KEY || '');

  // Fetch function for Giphy
  const fetchGifs = (offset: number) => 
    gf.search(searchTerm, { offset, limit: 10 });

  const handleGifClick = (gif: IGif) => {
    if (onGifSelect) {
      onGifSelect(gif.images.original.url);
    }
  };

  return (
    <Card className="w-full mx-auto p-4">
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
        <div className="w-full h-[600px] overflow-y-auto" data-testid="giphy-container">
          <Grid
            width={800}
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
