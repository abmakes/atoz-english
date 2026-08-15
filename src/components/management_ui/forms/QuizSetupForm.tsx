'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge";
import Image from 'next/image';
import type { QuizSetupData } from '@/components/management_ui/QuizEditor';
import { TagDrawer } from "@/components/management_ui/TagDrawer";
import { ALL_TAG_CATEGORIES } from "@/lib/tags";
import { useCustomToast } from '@/components/ui/CustomToast'
import { ArrowRight, Image as Picture, Sparkles } from 'lucide-react';
import QuizTypeGrid, { QuestionType } from "@/components/management_ui/forms/QuizTypeGrid";
import ImageSelectModal from '@/components/management_ui/ImageSelectModal';

interface QuizSetupFormProps {
  initialData: QuizSetupData;
  onSetupComplete: (data: QuizSetupData) => void;
  /** Premium path: complete setup and open AI generation with prefilled values */
  onAiGenerate?: (data: QuizSetupData) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onSelectedTagsChange?: (tags: string[]) => void;
}

const PLACEHOLDER_IMAGE_CLIENT = '/images/placeholder.webp';

export default function QuizSetupForm({ 
  initialData, 
  onSetupComplete,
  onAiGenerate,
  selectedTags, 
  onTagToggle,
  onSelectedTagsChange,
}: QuizSetupFormProps) {
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(initialData.coverImageFile);
  const [coverImageUrlPreview, setCoverImageUrlPreview] = useState(initialData.coverImageUrl || PLACEHOLDER_IMAGE_CLIENT);
  const [quizType, setQuizType] = useState<QuestionType>(initialData.quizType as QuestionType);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const { addToast } = useCustomToast()

  useEffect(() => {
    if (coverImageFile) {
      const objectUrl = URL.createObjectURL(coverImageFile);
      setCoverImageUrlPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    if (initialData.coverImageUrl) {
      setCoverImageUrlPreview(initialData.coverImageUrl);
      return;
    }
    setCoverImageUrlPreview(PLACEHOLDER_IMAGE_CLIENT);
  }, [coverImageFile, initialData.coverImageUrl]);

  const handleImageSelect = (imageUrl: string, _metadata?: unknown, localFile?: File | null) => {
    setCoverImageUrlPreview(imageUrl);
    setCoverImageFile(localFile ?? null);
    setIsImageModalOpen(false);
    addToast('Cover image selected!', { variant: 'success' });
  };

  const buildSetupData = (): QuizSetupData | null => {
    if (!title.trim()) {
      addToast('Enter a quiz title.', {
        variant: 'warning',
        position: 'top-center',
      });
      return null;
    }
    if (!description.trim()) {
      addToast('Add a short quiz description so learners know what to expect.', {
        variant: 'warning',
        position: 'top-center',
      });
      return null;
    }
    return {
      title,
      description,
      coverImageUrl:
        coverImageUrlPreview || initialData.coverImageUrl || PLACEHOLDER_IMAGE_CLIENT,
      coverImageFile,
      quizType,
      tags: selectedTags,
    };
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = buildSetupData();
    if (!data) return;
    addToast('Quiz setup complete. Now add questions to your quiz.', { variant: 'success', position: 'top-center' });
    onSetupComplete(data);
  };

  const handleAiGenerate = () => {
    const data = buildSetupData();
    if (!data) return;
    if (quizType !== QuestionType.MULTIPLE_CHOICE) {
      addToast('AI generation currently supports multiple-choice quizzes only.', {
        variant: 'error',
        position: 'top-center',
      });
      return;
    }
    onAiGenerate?.(data);
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="mt-4 flex w-full max-w-screen-lg flex-col gap-4 space-y-2 rounded-lg border border-[--border-dark] bg-white p-2 shadow-[4px_4px_0px_0px_var(--border-dark)] grandstander lg:p-6">
      
      <div className='flex flex-col gap-8 rounded-lg bg-[var(--surface-cloud)] p-4 text-[--text-color]'>        
        <div className='flex flex-col gap-4 lg:flex-row'>
          <div className='flex-1 lg:basis-2/3'>
            <div className='flex flex-col gap-4'>
              <div className='flex flex-col'>
                <Label htmlFor="quizTitle" className="mb-1 block text-base font-medium">Quiz Details</Label>
                <Input
                  className='h-14 w-full border-2 border-slate-200 bg-white px-6 py-4 text-[--text-color]'
                  id="quizTitle"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter the quiz title"
                  required
                />
              </div>
              <div className='flex flex-col'>
                <Textarea
                  rows={2}
                  className='h-14 w-full border-2 border-slate-200 bg-white px-6 py-4 text-[--text-color]'
                  id="quizDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter a brief description for your quiz"
                  required
                />
              </div>
            </div>
          </div>        
        
          <div className='flex flex-1 flex-col items-center lg:basis-1/3'>
            <div className="mt-2 flex w-full flex-col items-start gap-2">
              <div className="relative w-full">
                <Image 
                  src={coverImageUrlPreview} 
                  alt="Quiz Cover Preview" 
                  width={160} 
                  height={90} 
                  className="h-40 w-full rounded-md border bg-slate-100 object-cover"
                />
                
                <div className="absolute bottom-2 right-2">
                  <Button
                    type="button"
                    onClick={() => setIsImageModalOpen(true)}
                    className="flex items-center gap-2 rounded-full border border-[var(--border-dark)] bg-white px-4 py-2 text-sm font-semibold text-[--text-color] shadow-[2px_2px_0px_0px_var(--border-dark)] transition-colors hover:bg-[var(--surface-cloud)]"
                    title="Select cover image"
                  >
                    <span>Select Cover Image</span>
                    <Picture className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <QuizTypeGrid quizType={quizType} setQuizType={setQuizType} />
        <div className='flex flex-col gap-4 rounded-lg lg:flex-row lg:items-center'>
          <TagDrawer
            allTags={ALL_TAG_CATEGORIES}
            selectedTags={selectedTags}
            onTagToggle={onTagToggle}
            onSelectedTagsChange={onSelectedTagsChange}
            triggerElement={
              <div className='flex h-10 w-full cursor-pointer items-center rounded-full border border-[var(--border-dark)] transition-colors hover:bg-white lg:w-72'>
                <span className="flex h-full w-32 items-center rounded-full bg-[var(--primary-accent)]/25 px-4 pb-1 pt-2 text-base font-semibold text-[--text-color] transition-colors hover:bg-[var(--primary-accent)]/40">
                  Quiz Tags
                </span>
                <Button id="quizTags" type="button" variant="outline" 
                  className='h-full flex-1 border-none pt-2 pb-1 text-base text-[--text-color]'>
                    Select Tags
                </Button>
              </div>
            }
            description="Choose tags that best describe your quiz."
          />
          <div className="flex flex-wrap items-center gap-2">
            {selectedTags.length > 0 ? (
              selectedTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="h-8 cursor-pointer px-2 pt-1 text-sm text-nowrap text-[--text-color] transition-all duration-150 ease-in-out border-[--primary-accent] shadow-[2px_2px_0px_0px_var(--primary-accent-hover)] hover:shadow-md">
                  {tag}
                  <button 
                    type="button"
                    onClick={() => onTagToggle(tag)} 
                    className="ml-2 text-xs font-bold hover:text-red-500"
                  >
                    &times;
                  </button>
                </Badge>
              ))
            ) : (
              <p className="text-sm text-slate-500">No tags selected yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onAiGenerate && (
          <Button
            type="button"
            variant="outline"
            onClick={handleAiGenerate}
            className="flex h-12 items-center gap-2 border-2 border-[var(--accent-premium)] bg-[var(--accent-premium-muted)] px-6 text-lg font-semibold text-[--text-color] shadow-[4px_4px_0px_0px_var(--accent-premium-hover)] transition-all duration-300 hover:scale-105 hover:bg-white"
          >
            <Sparkles className="h-5 w-5 text-[var(--accent-premium)]" />
            AI Generate
          </Button>
        )}
        <Button
          type="submit"
          variant='outline' 
          className="flex h-12 items-center gap-2 border border-[#1F6E91] bg-[--text-color] px-8 text-lg font-semibold text-white shadow-[4px_4px_0px_0px_#1F6E91] transition-all duration-300 hover:scale-105 hover:border-[#1F6E91] hover:bg-white hover:text-[--text-color] hover:shadow-[4px_6px_0px_0px_#1F6E91]"
        >
            Create Questions <ArrowRight className="-mt-0.5" size={20} /> 
        </Button>
      </div>
    </form>

      {isImageModalOpen && (
        <ImageSelectModal 
          isOpen={isImageModalOpen} 
          onClose={() => setIsImageModalOpen(false)} 
          onImageSelect={handleImageSelect} 
        />
      )}
    </>
  )
}
