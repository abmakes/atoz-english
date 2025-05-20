'use client'

import { useState } from 'react'
import QuizForm from "@/components/management_ui/forms/QuizForm"
import UploadForm from "@/components/management_ui/forms/UploadForm"
import DownloadButton from "@/components/management_ui/DownloadButton"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function CreatePage() {
  const [view, setView] = useState<'create' | 'upload' | 'ai-generation'>('create')

  return (
    <div className='min-h-screen flex flex-col'>

      <div className="container mx-auto flex flex-col items-center align-start">
        
        <div className="flex justify-center space-x-4 p-4 grandstander font-semibold">
          <div className='flex gap-2 p-1 min-w-56 text-justify items-center w-full bg-white rounded-full border border-[--border-dark] shadow-[4px_4px_0px_0px_var(--border-dark)]'>
            <span className='text-[--text-color] text-xl font-bold bg-[--primary-light] rounded-full px-3 pt-1'>1</span>
            <span className='px-4 pt-1 text-[--text-color]'>Quiz Setup</span>
          </div>
          <div className='flex gap-2 p-1 min-w-56  text-justify items-center w-full bg-white rounded-full border border-[--border-dark] shadow-[4px_4px_0px_0px_var(--border-dark)]'>
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

        <div className="max-w-screen-2xl mt-10 flex gap-4 border border-blue-500">
          {/* SIDEBAR CONTAINER */}
          <div className="basis-1/4 flex flex-col gap-4 grandstander bg-white p-4 h-full items-center align-middle border rounded-lg border-[--border-dark] shadow-[4px_4px_0px_0px_var(--border-dark)]">
            <h2 className='text-2xl w-full text-center font-bold px-4'>This is the name of the quiz quiz info</h2>
            <Image src={"/images/placeholder.webp"} alt="quiz-info" height={120} width={200} className='rounded-lg w-full h-full object-cover'/>
            <p className='text-sm text-center'>This is the description of the quiz quiz info. This is the description of the quiz quiz info. This is the description of the quiz quiz info</p>
            <span className='text-sm text-center'>Questions: 10</span>
            <div className='flex gap-2'>
              <Button variant='outline' className='w-full text-sm'>Edit Quiz Info</Button>
              <Button variant='outline' className='w-full text-sm'>Delete Quiz</Button>
            </div>
          </div>

          {/* MAIN CONTAINER */}  
          <div className="basis-3/4 flex flex-col gap-4 h-full items-center align-middle">
            {/* FORM TAB BUTTONS */}
            <div className="absolute -mt-6 justify-center space-x-4 grandstander text-[--primary-accent] bg-white rounded-full border border-[--border-dark] shadow-[4px_4px_0px_0px_var(--border-dark)]">
              <Button variant='default' 
                className={
                  `px-6 
                  ${view === 'create' ? 
                    'bg-[--primary-light] text-[--text-color] font-bold' : 
                    'text-[--text-color] font-medium hover:font-bold'}`} 
                  onClick={() => setView('create')
                }>
                Custom creation
              </Button>
              <Button variant='default' 
                className={
                  `px-6 
                  ${view === 'upload' ? 
                    'bg-[--primary-light] text-[--text-color] font-bold' : 
                    'text-[--text-color] font-medium hover:font-bold'}`} 
                  onClick={() => setView('upload')
                }>
                Upload Quiz from File
              </Button>
              <Button variant='default' 
                className={
                  `px-6 
                  ${view === 'ai-generation' ? 
                    'bg-[--primary-light] text-[--text-color] font-bold' : 
                    'text-[--text-color] font-medium hover:font-bold'}`} 
                  onClick={() => setView('ai-generation')}>
                Generate with AI
              </Button>
            </div>

            <div className='w-full h-full border border-[--border-dark] shadow-[4px_4px_0px_0px_var(--border-dark)] rounded-lg'>
              {view === 'create' && (
                <QuizForm />
              )}

            {view === 'upload' && (
              <div className="flex w-full justify-center border-2 border-red-500">
                <Card className="flex flex-col space-y-4 text-2xl h-full rounded-lg font-bold mb-6 p-6">
                  <UploadForm />
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

            {view === 'ai-generation' && (
              <div className="flex w-full justify-center border-2 border-red-500">
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
