'use client';

import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UploadCloud, Search } from 'lucide-react';
import GiphyGrid from './GiphyModal';

interface ImageSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (imageUrl: string, file?: File | null) => void;
  // Add any other props like Giphy API key if needed
}

export default function ImageSelectModal({ isOpen, onClose, onImageSelect }: ImageSelectModalProps) {
  const [activeTab, setActiveTab] = useState("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [giphySearchTerm, setGiphySearchTerm] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type.startsWith('image/')) {
        const imageUrl = URL.createObjectURL(file);
        onImageSelect(imageUrl, file);
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
          onImageSelect(imageUrl, file);
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
    onImageSelect(url, null);
    // onClose(); // Keep modal open to allow changing selection before confirming with "Done"
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl grandstander max-h-[90vh] overflow-clip">
        <DialogHeader>
          <DialogTitle className="text-2xl">Select Image</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full h-12 grid-cols-2 bg-slate-100 p-1 rounded-lg">
            <TabsTrigger value="upload" className="data-[state=active]:bg-white data-[state=active]:text-[--primary-accent] data-[state=active]:font-semibold data-[state=active]:shadow-md rounded-md h-10">Upload Image</TabsTrigger>
            <TabsTrigger value="giphy" className="data-[state=active]:bg-white data-[state=active]:text-[--primary-accent] data-[state=active]:font-semibold data-[state=active]:shadow-md rounded-md h-10">Search Giphy</TabsTrigger>
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
          <TabsContent value="giphy" className="py-4 h-[500px] overflow-clip">
            <GiphyGrid onGifSelect={handleGiphySelect} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
