import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import GiphyGrid from './GiphyModal';

interface ImageSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (imageUrl: string, file?: File | null) => void;
}

export default function ImageSelectModal({ isOpen, onClose, onImageSelect }: ImageSelectModalProps) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      onImageSelect(imageUrl, file);
      onClose();
    }
  };

  const handleGiphySelect = (url: string) => {
    onImageSelect(url, null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Select Image</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="upload">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Image</TabsTrigger>
            <TabsTrigger value="giphy">Search Giphy</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="py-4">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
            />
          </TabsContent>
          <TabsContent value="giphy" className="h-[600px]">
            <GiphyGrid onGifSelect={handleGiphySelect} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
