'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Assuming you have a Textarea component
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge";
import Image from 'next/image';
import type { QuizSetupData } from '@/app/create/page'; // Import the interface
import { TagDrawer } from "@/components/management_ui/TagDrawer"; // Adjusted path
import { ALL_TAG_CATEGORIES } from "@/lib/tags";
import { useCustomToast } from '@/components/ui/CustomToast'
import { ArrowRight } from 'lucide-react';
import QuizTypeGrid, { QuestionType } from "@/components/management_ui/forms/QuizTypeGrid"; // Added import for QuizTypeGrid and its QuestionType

interface QuizSetupFormProps {
  initialData: QuizSetupData;
  onSetupComplete: (data: QuizSetupData) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}

const PLACEHOLDER_IMAGE_CLIENT = '/images/placeholder.webp'; // Renamed to avoid conflict if imported elsewhere

export default function QuizSetupForm({ 
  initialData, 
  onSetupComplete, 
  selectedTags, 
  onTagToggle 
}: QuizSetupFormProps) {
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(initialData.coverImageFile);
  const [coverImageUrlPreview, setCoverImageUrlPreview] = useState(initialData.coverImageUrl || PLACEHOLDER_IMAGE_CLIENT);
  const [quizType, setQuizType] = useState<QuestionType>(initialData.quizType as QuestionType);
  const { addToast } = useCustomToast()

  useEffect(() => {
    if (coverImageFile) {
      setCoverImageUrlPreview(URL.createObjectURL(coverImageFile));
    } else if (initialData.coverImageUrl) {
      setCoverImageUrlPreview(initialData.coverImageUrl)
    } else {
      setCoverImageUrlPreview(PLACEHOLDER_IMAGE_CLIENT)
    }
  }, [coverImageFile, initialData.coverImageUrl]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setCoverImageFile(file);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addToast('Quiz setup complete. Now add questions to your quiz.', { variant: 'success', position: 'top-center' });
    onSetupComplete({
      title,
      description,
      coverImageUrl: coverImageFile ? URL.createObjectURL(coverImageFile) : (initialData.coverImageUrl || PLACEHOLDER_IMAGE_CLIENT), // Send the preview URL or the original if no new file
      coverImageFile, // Send the file itself
      quizType,
      tags: selectedTags, // Use selectedTags from props
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col grandstander gap-4 mt-4 space-y-2 bg-white p-6 rounded-lg w-full max-w-screen-lg border border-[--border-dark] shadow-[4px_4px_0px_0px_var(--border-dark)]">
      
      <div className='flex flex-row gap-8 bg-gray-50 p-4 rounded-lg text-[--text-color]'>
        <div className='basis-2/3'>
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col'>
              <Label htmlFor="quizTitle" className="block text-lg font-medium  mb-1">Quiz Title</Label>
              <Input
                className='w-full bg-white h-16 text-[--text-color] border-2 border-slate-200 px-6 py-4'
                id="quizTitle"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter the quiz title"
                required
              />
            </div>
            <div className='flex flex-col'>
              <Label htmlFor="quizDescription" className="block text-lg font-medium  mb-1">Description</Label>
              <Textarea
                rows={2}
                className='w-full bg-white h-16 text-[--text-color] border-2 border-slate-200 px-6 py-4'
                id="quizDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a brief description for your quiz"
              />
            </div>
          </div>
        </div>        
        
        <div className='basis-1/3 flex flex-col items-center'>
          <div className="mt-2 flex flex-col items-start gap-2">
            <div className="relative w-full">
              <Image 
                src={coverImageUrlPreview} 
                alt="Quiz Cover Preview" 
                width={160} 
                height={90} 
                className="h-40 w-full object-cover rounded-md border bg-slate-100"
              />
              
              <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-white/80 hover:opacity-100 opacity-0 transition-colors cursor-pointer">
                <Label htmlFor="coverImageFile" className="flex w-full justify-center gap-2 font-light text-gray-800 mb-1">
                  Select a cover image for your quiz
                </Label>
              </div>
            </div>
            
            <Input
              id="coverImageFile"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="
                p-0 flex justify-center items-center w-full
                file:mr-4 file:px-4 file:py-2
                file:rounded-lg file:border-0
                file:text-base file:font-semibold
                file:bg-violet-100 file:text-violet-700
                hover:file:bg-violet-200 hover:bg-violet-50 transition-colors cursor-pointer
                border border-violet-400
                "           
              />

          </div>
        </div>
      </div>

      <QuizTypeGrid quizType={quizType} setQuizType={setQuizType} />

      <div className='bg-gray-50 flex p-4 space-x-4 rounded-lg'>
          <TagDrawer
            allTags={ALL_TAG_CATEGORIES}
            selectedTags={selectedTags}
            onTagToggle={onTagToggle}
            triggerElement={
              <div className='flex items-center w-72 h-10 rounded-full border border-violet-400 hover:bg-violet-50 cursor-pointer transition-colors'>
                <span className="flex items-center text-base w-32 h-full px-4 pt-2 pb-1 font-semibold
                  bg-violet-100 text-violet-700 rounded-full
                  hover:bg-violet-200 transition-colors"
                  >
                  Quiz Tags
                </span>
                <Button id="quizTags" type="button" variant="outline" 
                  className='text-base pt-2 pb-1 border-none w-32 h-full text-[--text-color]'>
                    Select Tags
                </Button>
              </div>
            }
            description="Choose tags that best describe your quiz."
          />
        <div className="p-1 flex flex-wrap gap-2 text-center items-center">
          {selectedTags.length > 0 ? (
            selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="cursor-pointer px-2 pt-1 h-8 text-sm transition-all text-nowrap text-[--text-color] duration-150 border-[--primary-accent] shadow-[2px_2px_0px_0px_var(--primary-accent-hover)] ease-in-out hover:shadow-md">
                {tag}
                <button 
                  type="button" // Add type button to prevent form submission
                  onClick={() => onTagToggle(tag)} 
                  className="ml-2 text-xs font-bold hover:text-red-500"
                >
                  &times;
                </button>
              </Badge>
            ))
          ) : (
            <p className="text-sm ml-2 text-gray-500">No tags selected yet.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant='outline' 
          className="flex items-center px-8 h-full text-lg font-semibold border border-[#1F6E91] gap-2 bg-[--text-color] text-white shadow-[4px_4px_0px_0px_#1F6E91] hover:bg-white hover:text-[--text-color] hover:border-[#1F6E91] hover:shadow-[4px_6px_0px_0px_#1F6E91] hover:scale-105 transition-all duration-300"
        >
            Create Questions <ArrowRight className="-mt-0.5" size={20} /> 
        </Button>
      </div>
    </form>
  )
} 