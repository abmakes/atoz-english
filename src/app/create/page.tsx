'use client'

import { useState, useRef } from 'react'
import QuizForm, { QuizFormHandle } from "@/components/management_ui/forms/QuizForm"
import UploadForm from "@/components/management_ui/forms/UploadForm"
import QuizSetupForm from "@/components/management_ui/forms/QuizSetupForm"
import DownloadButton from "@/components/management_ui/DownloadButton"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QuestionType } from '@/types/question_types'
import QuizFinalizeForm from "@/components/management_ui/forms/QuizFinalizeForm"
import { useCustomToast } from '@/components/ui/CustomToast'
import { Sparkles, Upload, Pencil, ArrowRight, Check, ArrowLeft } from 'lucide-react'
// Define Question interface (can be moved to a shared types file later)
// Make sure this matches the Question interface used/needed by QuizForm
export interface Question {
  id?: string; // Optional: only for existing questions during an edit
  question: string;
  answers: string[];
  correctAnswer: string;
  imageUrl: string;
  imageFile: File | null;
  type: QuestionType; // Ensure type is always present
}

export interface QuizSetupData {
  title: string;
  description: string;
  coverImageUrl: string;
  coverImageFile: File | null;
  quizType: QuestionType;
  tags: string[];
}

export interface QuizSettingsData {
  theme?: string; // Example setting
  // Add other settings as needed
  powerUps?: string[]; // For selected power-up IDs
  gameMode?: 'basic' | 'boosted';
  guessOptions?: string;
  timeLimit?: string;
  music?: boolean;
  soundEffects?: boolean;
}

export default function CreatePage() {
  const [creationStep, setCreationStep] = useState<'setup' | 'content' | 'publish'>('setup')
  const { addToast } = useCustomToast()
  const quizFormRef = useRef<QuizFormHandle>(null);

  const [quizSetupData, setQuizSetupData] = useState<QuizSetupData>({
    title: '',
    description: '',
    coverImageUrl: '/images/placeholder.webp',
    coverImageFile: null,
    quizType: QuestionType.MULTIPLE_CHOICE,
    tags: [],
  })

  const [questionsList, setQuestionsList] = useState<Question[]>([])

  const [quizSettings, setQuizSettings] = useState<QuizSettingsData>({
    theme: 'default',
    powerUps: [],
  })

  const [contentView, setContentView] = useState<'create' | 'upload' | 'ai-generation'>('create')

  const handleSetupComplete = (data: QuizSetupData) => {
    setQuizSetupData(data)
    // If questionsList is empty and a quiz type is set, add an initial question
    if (questionsList.length === 0 && data.quizType) {
      const initialQuestion: Question = {
        question: '',
        answers: ["", "", "", ""],
        correctAnswer: "",
        // answers: data.quizType === QuestionType.TRUE_FALSE ? ['True', 'False'] : ['', '', '', ''],
        // correctAnswer: data.quizType === QuestionType.TRUE_FALSE ? 'True' : '',
        imageUrl: '/images/placeholder.webp',
        imageFile: null,
        type: data.quizType,
      };
      setQuestionsList([initialQuestion]);
    } else if (questionsList.length > 0 && data.quizType) {
      // Optionally, update types of existing questions if overall type changes
      // setQuestionsList(prevQuestions => prevQuestions.map(q => ({ ...q, type: data.quizType })));
    }
    setCreationStep('content')
  }

  // Callback for QuizForm to update cover image in quizSetupData
  const handleQuizCoverImageChangeInContentStep = (newImageUrl: string, newImageFile?: File | null) => {
    setQuizSetupData(prevData => ({
      ...prevData,
      coverImageUrl: newImageUrl,
      coverImageFile: newImageFile || null, 
    }));
  };

  const handleQuestionsListChange = (updatedQuestions: Question[]) => {
    setQuestionsList(updatedQuestions);
  };

  const handleAddQuestions = (newQuestions: Question[]) => {
    setQuestionsList(prevQuestions => [...prevQuestions, ...newQuestions]);
  };
  
  const handleQuestionsConfirmed = () => {
    console.log("Questions confirmed.");

    if (!quizSetupData.title) {
      addToast("Please enter a quiz title before proceeding.", { variant: 'error', position: 'top-center' });
      return;
    }
    if (!quizSetupData.description) {
      addToast("Please enter a quiz description before proceeding.", { variant: 'error', position: 'top-center' });
      return;
    }

    if (questionsList.length === 0) {
      // Using toast instead of alert for consistency
      addToast("Please add at least one question before proceeding to settings.", { variant: 'warning', position: 'top-center' });
      return;
    }

    // Validate individual questions and answers
    for (let i = 0; i < questionsList.length; i++) {
      const q = questionsList[i];
      if (!q.question.trim()) {
        addToast(`Question ${i + 1} text cannot be empty.`, { variant: 'error', position: 'top-center' });
        return;
      }
      // For multiple choice, sorting - check answers array
      if ([QuestionType.MULTIPLE_CHOICE, QuestionType.SORTING].includes(q.type)) {
        if (q.answers.some(ans => !ans.trim())) {
          addToast(`All answer fields for question ${i + 1} must be filled.`, { variant: 'error', position: 'top-center' });
          return;
        }
      }
      // Specific validation for matching type can be added here if correctAnswer structure is different
      // For now, assuming correctAnswer for matching is a string that also shouldn't be empty
      if (!q.correctAnswer.trim() && q.type !== QuestionType.MATCHING) { // Matching might have complex object, handle separately
         addToast(`Correct answer for question ${i + 1} must be specified.`, { variant: 'error', position: 'top-center' });
         return;
      }
      // If it's matching, correctAnswer might be a JSON string of pairs, ensure it's not just '[]' or empty object '{}'
      if (q.type === QuestionType.MATCHING) {
        try {
          const pairs = JSON.parse(q.correctAnswer);
          if (!Array.isArray(pairs) || pairs.length === 0) {
            addToast(`Please provide at least one pair for matching question ${i + 1}.`, { variant: 'error', position: 'top-center' });
            return;
          }
          for (const pair of pairs) {
            if (!pair.prompt || !pair.prompt.trim() || !pair.answer || !pair.answer.trim()) {
              addToast(`Both parts of each pair must be filled for matching question ${i + 1}.`, { variant: 'error', position: 'top-center' });
              return;
            }
          }
        } catch (e) {
          console.error("Error parsing correct answer for matching question:", e);
          addToast(`Correct answer format for matching question ${i + 1} is invalid.`, { variant: 'error', position: 'top-center' });
          return;
        }
      }
    }

    setCreationStep('publish');
  };

  const handleTagToggle = (tag: string) => {
    setQuizSetupData(prevData => {
      const newTags = prevData.tags.includes(tag)
        ? prevData.tags.filter(t => t !== tag)
        : [...prevData.tags, tag];
      return { ...prevData, tags: newTags };
    });
  };

  const handleGoToPublishStep = () => {
    if (quizFormRef.current) {
      quizFormRef.current.triggerSubmit(); 
    } else {
      console.warn("QuizForm ref not available. Proceeding to publish step directly, but this might skip validation.");
      handleQuestionsConfirmed();
    }
  };

  // Placeholder for final submission
  const handleFinalQuizSubmit = async (finalizedData: {
    quizSetup: QuizSetupData;
    questions: Question[];
    settings: QuizSettingsData;
  }) => {
    addToast("Publishing your quiz...", { variant: 'info', position: 'top-center' });

    const { quizSetup, questions, settings } = finalizedData;
    setQuizSettings(settings);
    
    const formData = new FormData();
    formData.append('title', quizSetup.title);
    formData.append('description', quizSetup.description || '');
    formData.append('quizType', quizSetup.quizType);
    
    if (quizSetup.tags.length > 0) {
      formData.append('tags', JSON.stringify(quizSetup.tags));
    }

    if (quizSetup.coverImageFile) {
      formData.append('quizImageFile', quizSetup.coverImageFile);
    } else {
      formData.append('imageUrl', quizSetup.coverImageUrl);
    }

    // Append questions and their potential image files
    questions.forEach((q, index) => {
      formData.append(`questions[${index}][question]`, q.question);
      formData.append(`questions[${index}][correctAnswer]`, q.correctAnswer);
      formData.append(`questions[${index}][type]`, q.type);
      formData.append(`questions[${index}][answers]`, JSON.stringify(q.answers));
      
      if (q.imageFile) {
        formData.append(`questions[${index}][imageFile]`, q.imageFile);
      } else if (q.imageUrl) {
        formData.append(`questions[${index}][imageUrl]`, q.imageUrl);
      }
    });

    // Structure and append the defaultSettings JSON object
    const defaultSettings = {
      theme: settings.theme ?? 'default',
      powerUps: settings.powerUps ?? [],
      gameMode: settings.gameMode ?? 'basic',
      guessOptions: settings.guessOptions ?? 'zero',
      timeLimit: settings.timeLimit ?? 'ten',
      music: settings.music ?? true,
      soundEffects: settings.soundEffects ?? true,
    };
    formData.append('defaultSettings', JSON.stringify(defaultSettings));

     try {
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create quiz');
      }
      const result = await response.json();
      console.log('Quiz created successfully:', result);
      addToast("Quiz Published Successfully!", { variant: 'success', position: 'top-center' });
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      addToast(`Error submitting quiz: ${error instanceof Error ? error.message : 'Unknown error'}`, { variant: 'error', position: 'top-center' });
    } 
  };

  const stepDetails = [
    { id: 'setup', number: 1, title: 'Quiz Setup' },
    { id: 'content', number: 2, title: 'Create Questions' },
    { id: 'publish', number: 3, title: 'Review & Publish' },
  ];
  const stepOrder = stepDetails.map(s => s.id);
  const currentActiveStepIndex = stepOrder.indexOf(creationStep);

    return (
      <div className='flex flex-col h-[calc(100vh-120px)] px-6'>
        <div className="container h-full w-full mx-auto flex flex-col items-center">
          <div className="flex justify-center space-x-4 grandstander font-semibold bg-[--text-color] rounded-full border-2 border-[--border-dark] shadow-[4px_4px_0px_0px_#1F6E91] mb-6">

            {stepDetails.map((step, index) => {
              let status: 'active' | 'completed' | 'pending';
              if (index < currentActiveStepIndex) {
                status = 'completed';
              } else if (index === currentActiveStepIndex) {
                status = 'active';
              } else {
                status = 'pending';
              }

              let stepContainerClasses = 'flex gap-2 p-0.5 min-w-56 text-justify items-center w-full rounded-full'; 
              let iconClasses = 'rounded-full text-xl font-bold pt-1 flex items-center justify-center h-8 w-8'; 
              let titleClasses = 'px-2 pt-1'; 
              let iconContent: React.ReactNode | number = step.number;

              switch (status) {
                case 'active':
                  stepContainerClasses += ' bg-white';
                  iconClasses += ' text-[--text-color] font-bold text-xl px-3 bg-white rounded-full border-2 border-[--primary-accent]'; 
                  titleClasses += ' text-[--text-color] font-bold text-lg no-wrap w-full';
                  break;
                case 'completed':
                  stepContainerClasses += ' bg-[--text-color]';
                  iconClasses += ' bg-white text-[--accent-success] font-bold text-xl rounded-full'; 
                  titleClasses += ' text-[--primary-accent]'; 
                  iconContent = <Check size={20} strokeWidth={4} absoluteStrokeWidth className='text-[--primary-accent]' />;
                  break;
                case 'pending':
                  stepContainerClasses += '';
                  iconClasses += ' bg-white text-[--text-color]'; 
                  titleClasses += ' text-[--primary-accent]';
                  break;
              }
              
              if (step.id === 'settings') {
                  titleClasses += ' text-nowrap';
              }

              return (
                <div key={step.id} className={stepContainerClasses}>
                  <span className={iconClasses}>{iconContent}</span>
                  <span className={titleClasses}>{step.title}</span>
                </div>
              );
            })}

          </div>

          { creationStep === 'setup' && (
            <div className="w-full max-w-screen-lg flex-grow">
              <QuizSetupForm 
                initialData={quizSetupData} 
                onSetupComplete={handleSetupComplete}
                selectedTags={quizSetupData.tags}
                onTagToggle={handleTagToggle}
              />
            </div>
          )}

          { creationStep === 'content' && (
            <div className="max-w-screen-xl w-full flex-grow flex gap-4 mt-6">
              {/* SIDEBAR - Quiz Info */}
              <div className={`basis-1/4 flex flex-col h-full gap-2 grandstander text-[--text-color] bg-white p-4 items-center align-middle border rounded-lg border-[--border-dark] shadow-[4px_4px_0px_0px_var(--border-dark)]`}>
                <div className='flex flex-col gap-2'>
                  <h2 className='text-2xl w-full text-center font-bold px-4'>{quizSetupData.title || "Quiz Title"}</h2>
                  <span className='text-center'>{quizSetupData.quizType.replace(/_/g, ' ')} QUIZ </span>
                  {quizSetupData.coverImageUrl && (
                    <Image 
                      src={quizSetupData.coverImageFile ? URL.createObjectURL(quizSetupData.coverImageFile) : quizSetupData.coverImageUrl} 
                      alt={quizSetupData.title || "Quiz cover image"} 
                      width={300} 
                      height={200} 
                      className='rounded-lg w-full h-auto object-cover aspect-[16/9]'
                    />
                  )}
                  <p className='text-center text-sm py-2'>{quizSetupData.description || "No description yet."}</p>
                  <div className='flex gap-2 justify-center'>
                    {quizSetupData.tags.length > 0 && (
                      <div className='text-center'>
                        <div className="flex flex-wrap justify-center gap-2">
                          {quizSetupData.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-sm bg-white text-[--text-color] border-[--primary-accent] shadow-[2px_2px_0px_0px_var(--primary-accent-hover)]">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {quizSetupData.tags.length === 0 && (
                      <div className='text-center'><Badge variant="outline" className="text-xs font-medium bg-white text-[--text-color] border-[--primary-accent] shadow-[2px_2px_0px_0px_var(--primary-accent-hover)]">No tags yet</Badge></div>
                    )}
                  </div>
                  <h3 className='text-center text-lg font-bold py-2'>Questions: {questionsList.length}</h3>
                </div>
                <div className='flex flex-col gap-4 w-full justify-center'> 
                  <Button variant='outline' 
                    className="flex items-center h-full text-lg font-semibold border border-[--border-dark] gap-2 bg-[--background] text-[--text-color] shadow-[4px_4px_0px_0px_var(--border-dark)] hover:bg-teal-50 hover:border-[--border-dark] hover:shadow-[4px_6px_0px_0px_var(--border-dark)] hover:scale-105 transition-all duration-300"
                    onClick={() => setCreationStep('setup')}>
                       <ArrowLeft className="-mt-0.5" size={20} /> Edit Quiz Info
                  </Button>
                  <Button variant='outline' 
                    className="flex items-center h-full text-lg font-semibold border border-[#1F6E91] gap-2 bg-[--text-color] text-white shadow-[4px_4px_0px_0px_#1F6E91] hover:bg-white hover:border-[#1F6E91] hover:shadow-[4px_6px_0px_0px_#1F6E91] hover:scale-105 transition-all duration-300"
                    onClick={handleGoToPublishStep}>
                      Publish Quiz <ArrowRight className="-mt-0.5" size={20} /> 
                  </Button>
                </div>
              </div>

              {/* MAIN - Methods for creating quiz */}
              <div className="basis-3/4 flex flex-col gap-4 grandstander items-center text-[--text-color] h-full align-middle ">
                  <div className="absolute -mt-6 flex w-[540px] justify-between items-center grandstander gap-2 bg-[--primary-light] border border-[--border-dark] rounded-lg shadow-[4px_4px_0px_0px_var(--border-dark)]">
                    {/* <h3 className='text-xl flex items-center justify-center px-4 font-bold text-[--text-color]'>Create Questions :</h3> */}
                    <Button variant='default' className={`w-32 pr-4 pl-1 text-[--text-color] ${contentView === 'create' ? 'bg-white' : 'hover:font-bold'}`} onClick={() => setContentView('create')}>
                      <div className={`flex items-center p-1.5 mr-2 justify-center rounded-full ${contentView === 'create' ? 'bg-[--background] border-2 border-[--primary-accent]' : 'hover:bg-white'}`}>
                        <Pencil size={16} />
                      </div> Edit 
                    </Button>
                    {/* <div className='mx-3 w-0 h-8 border border-[--primary-accent-light]'></div>   */}
                    <Button variant='default' className={`w-32 pr-4 pl-1 text-[--text-color] ${contentView === 'upload' ? 'bg-white' : 'hover:font-bold'}`} onClick={() => setContentView('upload')}>
                      <div className={`flex items-center p-1.5 mr-2 justify-center rounded-full ${contentView === 'upload' ? 'bg-[--background] border-2 border-[--primary-accent]' : 'hover:bg-white'}`}>  
                        <Upload size={16} />
                      </div> Upload
                    </Button>
                    {/* <div className='mx-3 w-0 h-8 border border-[--primary-accent-light]'></div>   */}
                    <Button variant='default' className={`w-52 pr-4 pl-1 text-[--text-color] ${contentView === 'ai-generation' ? 'bg-white' : 'hover:font-bold'}`} onClick={() => setContentView('ai-generation')}>
                      <div className={`flex items-center p-1.5 mr-2 justify-center rounded-full ${contentView === 'ai-generation' ? 'bg-[--background] border-2 border-[--primary-accent]' : 'hover:bg-white'}`}>
                        <Sparkles size={16} />
                      </div> Generate with AI
                    </Button>
                  </div>


                {/* MAIN - Quiz Form */}
                <div className='w-full h-full max-w-screen-2xl border border-[--border-dark] bg-white shadow-[4px_4px_0px_0px_var(--border-dark)] rounded-lg'>


                  {contentView === 'create' && (
                    <QuizForm 
                      ref={quizFormRef}
                      quizOverallType={quizSetupData.quizType}
                      onQuizCoverImageChange={handleQuizCoverImageChangeInContentStep}
                      initialQuestions={questionsList}
                      onQuestionsChange={handleQuestionsListChange}
                      onConfirmQuestions={handleQuestionsConfirmed}
                      className="bg-transparent shadow-none border-0"
                    />
                  )}

                  {contentView === 'upload' && (
                    <div className="flex w-full justify-">
                      <Card className="flex flex-col text-2xl w-full h-full border-none font-bold p-6">
                        <UploadForm 
                          quizOverallType={quizSetupData.quizType}
                          onAddQuestions={handleAddQuestions}
                          className="bg-transparent shadow-none border-0"
                        />
                        <div className="text-base font-normal p-4 flex-grow ">
                          <h1 className="text-xl font-semibold mb-2">Even faster quiz creation</h1>
                          <p>Use our quiz template to make a quiz in Excel then simply upload the quiz.</p>
                          <p className='mb-2'>You can add images by going to the quiz list and editing the quiz.</p>
                          <DownloadButton />
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
          )}

          { creationStep === 'publish' && (
            <div className="w-full max-w-screen-2xl mt-0 flex-grow">
              <QuizFinalizeForm 
                quizSetupData={quizSetupData}
                questionsList={questionsList}
                initialQuizSettings={quizSettings}
                onFinalize={handleFinalQuizSubmit}
                onGoBackToContent={() => setCreationStep('content')}
              />
            </div>
          )}
        </div>
      </div>
    )

  return <div>Loading creation page...</div>
}
