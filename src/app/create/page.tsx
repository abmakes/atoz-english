'use client'

import { useState } from 'react'
import QuizForm from "@/components/management_ui/forms/QuizForm"
import UploadForm from "@/components/management_ui/forms/UploadForm"
import QuizSetupForm from "@/components/management_ui/forms/QuizSetupForm"
import DownloadButton from "@/components/management_ui/DownloadButton"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QuestionType } from '@/types/question_types'

export interface QuizSetupData {
  title: string;
  description: string;
  coverImageUrl: string;
  coverImageFile: File | null;
  quizType: QuestionType;
  tags: string[];
}

export default function CreatePage() {
  const [creationStep, setCreationStep] = useState<'setup' | 'content' | 'settings' | 'publish'>('setup')

  const [quizSetupData, setQuizSetupData] = useState<QuizSetupData>({
    title: '',
    description: '',
    coverImageUrl: '/images/placeholder.webp',
    coverImageFile: null,
    quizType: QuestionType.MULTIPLE_CHOICE,
    tags: [],
  })

  const [contentView, setContentView] = useState<'create' | 'upload' | 'ai-generation'>('create')

  const handleSetupComplete = (data: QuizSetupData) => {
    setQuizSetupData(data)
    setCreationStep('content')
  }

  // Callback for QuizForm to update cover image in quizSetupData
  const handleQuizCoverImageChangeInContentStep = (newImageUrl: string, newImageFile?: File | null) => {
    setQuizSetupData(prevData => ({
      ...prevData,
      coverImageUrl: newImageUrl,
      coverImageFile: newImageFile || null, // Keep track of the file if a new one is selected
    }));
  };

  if (creationStep === 'setup') {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-6 text-center grandstander">Step 1: Quiz Setup</h1>
        <QuizSetupForm 
          initialData={quizSetupData} 
          onSetupComplete={handleSetupComplete} 
        />
      </div>
    )
  }

  if (creationStep === 'content') {
    return (
      <div className='min-h-screen flex flex-col'>
        <div className="container mx-auto flex flex-col items-center align-start">
          <div className="flex justify-center space-x-4 p-4 grandstander font-semibold">
            <div className='flex gap-2 p-1 min-w-56 text-justify items-center w-full bg-[--accent-success] text-white rounded-full border border-[--border-dark] shadow-[4px_4px_0px_0px_var(--border-dark)]'>
              <span className='text-xl font-bold bg-white text-[--accent-success] rounded-full px-3 pt-1'>✓</span>
              <span className='px-4 pt-1'>Quiz Setup</span>
            </div>
            <div className='flex gap-2 p-1 min-w-56 text-justify items-center w-full bg-white rounded-full border border-[--border-dark] shadow-[4px_4px_0px_0px_var(--border-dark)]'>
              <span className='text-[--text-color] text-xl font-bold bg-[--primary-light] rounded-full px-3 pt-1'>2</span>
              <span className='px-4 pt-1 text-[--text-color]'>Create Questions</span>
            </div>
            <div className='flex gap-2 p-1 min-w-56 text-justify items-center w-full bg-white rounded-full border border-[--border-dark] shadow-[4px_4px_0px_0px_var(--border-dark)]'>
              <span className='text-[--text-color] text-xl font-bold bg-[--primary-light] rounded-full px-3 pt-1'>3</span>
              <span className='px-4 pt-1 text-[--text-color] text-nowrap'>Default Settings</span>
            </div>
            <div className='flex gap-2 p-1 w-full min-w-56 text-justify items-center bg-white rounded-full border border-[--border-dark] shadow-[4px_4px_0px_0px_var(--border-dark)]'>
              <span className='text-[--text-color] text-xl font-bold bg-[--primary-light] rounded-full px-3 pt-1'>4</span>
              <span className='px-4 pt-1 text-[--text-color]'>Publish Quiz</span>
            </div>
          </div>

          <div className="max-w-screen-2xl mt-10 flex gap-4">
            <div className="basis-1/4 flex flex-col gap-4 grandstander bg-white p-4 h-fit items-center align-middle border rounded-lg border-[--border-dark] shadow-[4px_4px_0px_0px_var(--border-dark)]">
              <h2 className='text-2xl w-full text-center font-bold px-4'>{quizSetupData.title || "Quiz Title"}</h2>
              {quizSetupData.coverImageUrl && (
                <Image 
                  src={quizSetupData.coverImageFile ? URL.createObjectURL(quizSetupData.coverImageFile) : quizSetupData.coverImageUrl} 
                  alt={quizSetupData.title || "Quiz cover image"} 
                  width={200} 
                  height={120} 
                  className='rounded-lg w-full h-auto object-cover aspect-[16/9]'
                />
              )}
              <p className='text-sm text-center'>{quizSetupData.description || "No description yet."}</p>
              <p className='text-sm text-center'>Type: {quizSetupData.quizType.replace(/_/g, ' ')}</p>
              {quizSetupData.tags.length > 0 && (
                <p className='text-sm text-center'>Tags: {quizSetupData.tags.join(', ')}</p>
              )}
              <div className='flex gap-2 w-full'> 
                <Button variant='outline' className='w-full text-sm' onClick={() => setCreationStep('setup')}>Edit Quiz Info</Button>
              </div>
            </div>

            <div className="basis-3/4 flex flex-col gap-4 h-full items-center align-middle">
              <div className="absolute -mt-6 justify-center space-x-4 grandstander text-[--primary-accent] bg-white rounded-full border border-[--border-dark] shadow-[4px_4px_0px_0px_var(--border-dark)]">
                <Button variant='default' 
                  className={`px-6 ${contentView === 'create' ? 'bg-[--primary-light] text-[--text-color] font-bold' : 'text-[--text-color] font-medium hover:font-bold'}`} 
                  onClick={() => setContentView('create')}>
                  Custom creation
                </Button>
                <Button variant='default' 
                  className={`px-6 ${contentView === 'upload' ? 'bg-[--primary-light] text-[--text-color] font-bold' : 'text-[--text-color] font-medium hover:font-bold'}`} 
                  onClick={() => setContentView('upload')}>
                  Upload Quiz from File
                </Button>
                <Button variant='default' 
                  className={`px-6 ${contentView === 'ai-generation' ? 'bg-[--primary-light] text-[--text-color] font-bold' : 'text-[--text-color] font-medium hover:font-bold'}`} 
                  onClick={() => setContentView('ai-generation')}>
                  Generate with AI
                </Button>
              </div>

              <div className='w-full h-full border border-[--border-dark] shadow-[4px_4px_0px_0px_var(--border-dark)] rounded-lg'>
                {contentView === 'create' && (
                  <QuizForm 
                    quizTitle={quizSetupData.title}
                    quizDescription={quizSetupData.description}
                    quizCoverImageUrl={quizSetupData.coverImageFile ? URL.createObjectURL(quizSetupData.coverImageFile) : quizSetupData.coverImageUrl}
                    quizOverallType={quizSetupData.quizType}
                    quizTags={quizSetupData.tags}
                    onQuizCoverImageChange={handleQuizCoverImageChangeInContentStep}
                    className="bg-transparent shadow-none border-0"
                  />
                )}

                {contentView === 'upload' && (
                  <div className="flex w-full justify-center p-6">
                    <Card className="flex flex-col space-y-4 text-2xl h-full rounded-lg font-bold p-6">
                      <UploadForm 
                        quizTitle={quizSetupData.title}
                        quizDescription={quizSetupData.description}
                        quizCoverImageUrl={quizSetupData.coverImageFile ? URL.createObjectURL(quizSetupData.coverImageFile) : quizSetupData.coverImageUrl}
                        quizOverallType={quizSetupData.quizType}
                        quizTags={quizSetupData.tags}
                        className="bg-transparent shadow-none border-0"
                      />
                      <div className="text-base font-semibold space-y-2 p-4 flex-grow">
                        <h1 className="text-2xl">Even faster quiz creation</h1>
                        <p>Use our quiz template to make a quiz in Excel then simply upload the quiz.</p>
                        <p>You can add images by going to the quiz list and editing the quiz.</p>
                        <DownloadButton />
                      </div>
                      <div className="flex-shrink-0">
                        <Image
                          src={"/images/template.png"}
                          alt="excel-quiz-editing"
                          height={265}
                          width={903}
                          className="h-auto w-full md:max-w-2xl"
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                    </Card>
                  </div>
                )}

                {contentView === 'ai-generation' && (
                  <div className="flex w-full justify-center p-6">
                    <div className="flex flex-col gap-4">
                      <h1 className="text-2xl">Generate with AI</h1>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (creationStep === 'settings') {
    return <div>Step 3: Default Settings (Coming Soon)</div>
  }
  if (creationStep === 'publish') {
    return <div>Step 4: Publish Quiz (Coming Soon)</div>
  }

  return <div>Loading creation page...</div>
}
