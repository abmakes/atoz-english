'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Assuming you have a Textarea component
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { QuestionType } from '@/types/question_types';
import Image from 'next/image';
import type { QuizSetupData } from '@/app/create/page'; // Import the interface

interface QuizSetupFormProps {
  initialData: QuizSetupData;
  onSetupComplete: (data: QuizSetupData) => void;
}

const PLACEHOLDER_IMAGE_CLIENT = '/images/placeholder.webp'; // Renamed to avoid conflict if imported elsewhere

export default function QuizSetupForm({ initialData, onSetupComplete }: QuizSetupFormProps) {
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(initialData.coverImageFile);
  const [coverImageUrlPreview, setCoverImageUrlPreview] = useState(initialData.coverImageUrl || PLACEHOLDER_IMAGE_CLIENT);
  const [quizType, setQuizType] = useState<QuestionType>(initialData.quizType);
  const [tagsString, setTagsString] = useState(initialData.tags.join(', ')); // Manage tags as a comma-separated string for simplicity

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
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    onSetupComplete({
      title,
      description,
      coverImageUrl: coverImageFile ? URL.createObjectURL(coverImageFile) : (initialData.coverImageUrl || PLACEHOLDER_IMAGE_CLIENT), // Send the preview URL or the original if no new file
      coverImageFile, // Send the file itself
      quizType,
      tags,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl">
      <div>
        <Label htmlFor="quizTitle" className="block text-lg font-medium text-gray-700 mb-1">Quiz Title</Label>
        <Input
          id="quizTitle"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter the quiz title"
          required
          className="w-full"
        />
      </div>

      <div>
        <Label htmlFor="quizDescription" className="block text-lg font-medium text-gray-700 mb-1">Description</Label>
        <Textarea
          id="quizDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter a brief description for your quiz"
          rows={3}
          className="w-full"
        />
      </div>

      <div>
        <Label className="block text-lg font-medium text-gray-700 mb-1">Quiz Cover Image</Label>
        <div className="mt-2 flex flex-col items-start gap-4">
          <Image 
            src={coverImageUrlPreview} 
            alt="Quiz Cover Preview" 
            width={160} 
            height={90} 
            className="h-24 w-40 object-cover rounded-md border bg-slate-100"
          />
          <Input
            id="coverImageFile"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full max-w-xs"
          />
        </div>
      </div>

      <div>
        <Label className="block text-lg font-medium text-gray-700 mb-2">Default Question Type</Label>
        <RadioGroup 
          value={quizType} 
          onValueChange={(value) => setQuizType(value as QuestionType)} 
          className="flex flex-wrap gap-x-6 gap-y-2"
        >
          {Object.values(QuestionType).map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <RadioGroupItem value={type} id={`type-${type}`} />
              <Label htmlFor={`type-${type}`}>{type.replace(/_/g, ' ')}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div>
        <Label htmlFor="quizTags" className="block text-lg font-medium text-gray-700 mb-1">Tags (comma-separated)</Label>
        <Input
          id="quizTags"
          type="text"
          value={tagsString}
          onChange={(e) => setTagsString(e.target.value)}
          placeholder="e.g., history, science, fun"
          className="w-full"
        />
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" className="bg-pink-500 hover:bg-pink-600 text-white text-lg px-8 py-3">
          Proceed to Add Questions
        </Button>
      </div>
    </form>
  );
} 