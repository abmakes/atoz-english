'use client'

import React from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTrigger,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface TagCategory {
  category: string;
  tags: string[];
}

interface TagDrawerProps {
  allTags: TagCategory[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  triggerElement: React.ReactNode;
  title?: string;
  description?: string;
}

export function TagDrawer({
  allTags,
  selectedTags,
  onTagToggle,
  triggerElement,
  title,
  description = "Choose tags that best describe your quiz.",
}: TagDrawerProps) {
  return (
    <Drawer>
      <DrawerTrigger asChild>{triggerElement}</DrawerTrigger>
      <DrawerContent className="h-[70vh] text-[--text-color] grandstander">
        <DrawerHeader className="text-center flex flex-col items-center px-4 md:px-12 pt-4 pb-2">
          <DrawerTitle className='hidden'>{title || "Select Tags"}</DrawerTitle>
          <div className="flex flex-row justify-between items-center w-full mt-2">
            <div className="flex flex-wrap gap-2 items-center">
              <h3 className="text-lg font-semibold">Selected Tags: </h3>
              {selectedTags.map((tag) => (
                <Badge key={tag} 
                variant="default" 
                className="cursor-pointer p-2 h-8 text-sm font-medium transition-all text-nowrap duration-150 border-[--primary-accent] shadow-[2px_2px_0px_0px_var(--primary-accent-hover)] ease-in-out hover:shadow-md"
                onClick={() => onTagToggle(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>

            <DrawerClose asChild>
              <Button variant="outline" 
                className="flex items-center h-full text-md px-6 font-semibold border border-[#1F6E91] gap-2 bg-[--text-color] text-white shadow-[4px_4px_0px_0px_#1F6E91] hover:bg-white hover:border-[#1F6E91] hover:shadow-[4px_6px_0px_0px_#1F6E91] hover:scale-105 transition-all duration-300"
              >Apply {selectedTags.length} Selected Tags</Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <ScrollArea className="flex-grow px-4">
          <div className="flex flex-col gap-2 pl-8 py-2">
            <DrawerDescription className="text-base">{description}</DrawerDescription>
          </div>  
          <div className="grid grid-cols-1 gap-4 px-4 pb-8 md:grid-cols-2 xl:grid-cols-4 md:px-8">
            {allTags.map((categoryItem) => {
              return (
                <div 
                  key={categoryItem.category} 
                  className="rounded-xl border border-[--primary-accent] bg-white/70 p-3"
                >
                  <h3 className="text-lg font-semibold mb-1">{categoryItem.category}</h3>
                  <p className="mb-3 text-xs text-gray-500">
                    {categoryItem.category === 'Level' && 'Choose one target band'}
                    {categoryItem.category === 'Topic' && 'Choose a visual theme'}
                    {categoryItem.category === 'Word Class' && 'Choose the words to practise'}
                    {categoryItem.category === 'Grammar' && 'Choose a short sentence structure'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {categoryItem.tags.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <Badge
                          key={tag}
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => onTagToggle(tag)}
                          className={`cursor-pointer text-sm font-medium transition-all text-nowrap duration-150 border-[--primary-accent] shadow-[2px_2px_0px_0px_var(--primary-accent-hover)] ease-in-out hover:shadow-md ${isSelected ? "bg-[--primary-accent] text-[--text-color]" : "bg-[--background-color] text-[--text-color]"}`}
                        >
                          {tag}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
} 