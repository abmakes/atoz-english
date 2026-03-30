'use client'

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input' // Removed unused import
import Image from 'next/image'
import ImageSelectModal from '@/components/management_ui/ImageSelectModal'
import { QuestionFormMatching, MatchingPair } from './QuestionFormMatching'
import { QuestionFormSorting } from './QuestionFormSorting'
import { QuestionType } from '@/types/question_types'
import { Card } from '@/components/ui/card'
import { Copy, Trash2, X, Check, Image as Picture, Plus } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { useCustomToast } from '@/components/ui/CustomToast'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import type { Question as BaseQuestion } from '@/components/management_ui/QuizEditor';

// Extend Question type to include tempId for local state management
type Question = BaseQuestion & { tempId?: string };

interface QuizFormProps {
  quizId?: string;
  
  // quizTitle: string; // No longer used directly in this component for display
  // quizDescription?: string; // No longer used
  // quizCoverImageUrl: string; // No longer used
  quizOverallType: QuestionType;
  // quizTags?: string[]; // No longer used

  onQuizCoverImageChange: (newImageUrl: string, newImageFile?: File | null) => void; // Kept for potential future use or if other parts rely on it

  initialQuestions: Omit<Question, 'tempId'>[] | Question[];
  onQuestionsChange: (updatedQuestions: Question[]) => void;
  onConfirmQuestions?: () => void;
  
  className?: string;
}

// Define the handle type for methods exposed by QuizForm
export interface QuizFormHandle {
  triggerSubmit: () => void;
}

const PLACEHOLDER_IMAGE = '/images/placeholder.webp'

const ensureTempId = (q: Omit<Question, 'tempId'> | Question): Question => {
  if ('tempId' in q && q.tempId) return q as Question;
  return { ...q, tempId: q.id || `new-${Date.now()}-${Math.random()}` } as Question;
};

// Wrap QuizForm with forwardRef
const QuizForm = forwardRef<QuizFormHandle, QuizFormProps>(({ 
  quizId, 
  // quizTitle, // Removed
  // quizDescription, // Removed
  // quizCoverImageUrl, // Removed
  quizOverallType,
  // quizTags, // Removed
  onQuizCoverImageChange, // Kept
  initialQuestions,
  onQuestionsChange,
  onConfirmQuestions,
  className 
}, ref) => {
  const { addToast } = useCustomToast()

  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);

  const mode = quizId ? 'edit' : 'create';
  
  const [questions, setQuestionsState] = useState<Question[]>(() => {
    const initialQuestionsWithTempId = initialQuestions.map(ensureTempId);
    return initialQuestionsWithTempId;
  });
  
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  useEffect(() => {
    const processedQuestions = initialQuestions.map(ensureTempId);
    setQuestionsState(processedQuestions);
    if (mode === 'create' && processedQuestions.length > 0) {
        setOpenAccordionItems([processedQuestions[processedQuestions.length - 1].tempId!]);
    } else if (processedQuestions.length > 0 && processedQuestions[0]?.tempId) {
        // Optionally open the first one in edit mode, or none
        // setOpenAccordionItems([processedQuestions[0].tempId]); 
    }
  }, [initialQuestions, mode]);



  const updateQuestionsAndNotifyParent = (newQuestions: Question[]) => {
    setQuestionsState(newQuestions);
    onQuestionsChange(newQuestions);
  };

  const handleQuestionChange = (index: number, field: string, value: string | QuestionType) => {
    const newQuestions = questions.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    );
    updateQuestionsAndNotifyParent(newQuestions);
  };

  const updateQuestion = (index: number, updatedQuestionFields: Partial<Question>) => {
    const newQuestions = questions.map((q, i) =>
      i === index ? { ...q, ...updatedQuestionFields } : q
    );
    updateQuestionsAndNotifyParent(newQuestions);
  };

  const openImageModal = (questionIndex?: number) => {
    setActiveImageIndex(questionIndex ?? null);
    setIsImageModalOpen(true);
  };

  const handleImageSelect = (imageUrl: string, metadata?: {
    pixabayId: number;
    pixabayUser: string;
    tags: string[];
    searchTerm: string;
    width: number;
    height: number;
  }, localFile?: File | null) => {
    if (activeImageIndex !== null) {
      const newQuestions = [...questions];
      newQuestions[activeImageIndex].imageUrl = imageUrl;
      newQuestions[activeImageIndex].imageFile = localFile ?? null;
      newQuestions[activeImageIndex].imageMetadata =
        metadata && metadata.pixabayId ? metadata : undefined;
      updateQuestionsAndNotifyParent(newQuestions);
    } else {
      onQuizCoverImageChange(imageUrl, localFile ?? null);
    }
    setIsImageModalOpen(false);
  };

  const addQuestion = (questionToDuplicate?: Question) => {
    if (!quizOverallType) {
        addToast("Please ensure an overall quiz type is set before adding questions.", { variant: 'warning'});
        return;
    }
    
    let newQuestionData: Omit<Question, 'id'>; 

    if (questionToDuplicate) {
        newQuestionData = {
            ...questionToDuplicate,
            tempId: `new-${Date.now()}-${Math.random()}`,
            question: `${questionToDuplicate.question} (Copy)`,
        };
    } else {
        let newQuestionAnswers: string[];
        let newQuestionCorrectAnswer: string;

        switch (quizOverallType) {
          case QuestionType.MATCHING:
            newQuestionAnswers = []; // Answers for matching are derived from correct pairs
            newQuestionCorrectAnswer = JSON.stringify([{ left: '', right: '' }]);
            break;
          case QuestionType.SORTING:
            newQuestionAnswers = []; // Answers for sorting are the items themselves in correct order
            newQuestionCorrectAnswer = JSON.stringify(['', '', '']); 
            break;
          // case QuestionType.TRUE_FALSE:
          //   newQuestionAnswers = ['True', 'False']; 
          //   newQuestionCorrectAnswer = 'True'; 
          //   break;
          // case QuestionType.SHORT_ANSWER:
          //   newQuestionAnswers = []; 
          //   newQuestionCorrectAnswer = ''; 
          //   break;
          default: // MULTIPLE_CHOICE
            newQuestionAnswers = ['', '', '', ''];
            newQuestionCorrectAnswer = '';
            break;
        }
        newQuestionData = { 
          tempId: `new-${Date.now()}-${Math.random()}`,
          question: '', 
          answers: newQuestionAnswers, 
          correctAnswer: newQuestionCorrectAnswer, 
          imageUrl: PLACEHOLDER_IMAGE, 
          imageFile: null,
          type: quizOverallType,
        };
    }
    
    const finalNewQuestion = newQuestionData as Question; 
    updateQuestionsAndNotifyParent([...questions, finalNewQuestion]);
    setOpenAccordionItems([finalNewQuestion.tempId!]); 
    addToast(questionToDuplicate ? 'Question duplicated.' : 'Question added.', { variant: 'success', position: 'top-center' });
  };

  const duplicateQuestion = (indexToDuplicate: number) => {
    const questionToDup = questions[indexToDuplicate];
    addQuestion(questionToDup);
  };

  const MultipleChoiceForm = ({ questionIndex }: { questionIndex: number }) => {
    const question = questions[questionIndex];
    
    // Local state for each answer input to avoid lag
    const [localAnswers, setLocalAnswers] = useState<string[]>(() => {
      // Ensure we have at least 4 answer slots for multiple choice
      const answers = question.answers || [];
      while (answers.length < 4) {
        answers.push('');
      }
      return answers;
    });

    useEffect(() => {
      // Sync localAnswers if the question.answers prop changes from parent
      // This might happen if questions are reordered, added, or overall type changes.
      // Ensure we always have at least 4 answer slots for multiple choice
      const answers = question.answers || [];
      const paddedAnswers = [...answers];
      while (paddedAnswers.length < 4) {
        paddedAnswers.push('');
      }
      
      setLocalAnswers(paddedAnswers);
    }, [question.answers, questionIndex, question.tempId]);

    const handleLocalAnswerChange = (aIndex: number, value: string) => {
      const updatedLocalAnswers = [...localAnswers];
      updatedLocalAnswers[aIndex] = value;
      setLocalAnswers(updatedLocalAnswers);
    };

    const saveAnswerTextOnBlur = (aIndex: number) => {
      const value = localAnswers[aIndex];
      const currentGlobalAnswers = questions[questionIndex].answers || [];
      
      // Ensure we have a proper answers array with at least 4 slots
      const newAnswers = [...currentGlobalAnswers];
      while (newAnswers.length < 4) {
        newAnswers.push('');
      }
      
      // Only update global state if the value actually changed from what's in global state
      if (value !== newAnswers[aIndex]) {
        newAnswers[aIndex] = value;
        let newCorrectAnswer = question.correctAnswer;
        // If the edited answer was the correct one, update the correctAnswer string as well
        if (currentGlobalAnswers[aIndex] === question.correctAnswer) {
          newCorrectAnswer = value;
        }
        updateQuestion(questionIndex, { answers: newAnswers, correctAnswer: newCorrectAnswer });
      }
    };
    
    const selectCorrectAnswer = (answerText: string) => {
      // Ensure the answerText for correctAnswer is from the global state perspective
      // or from localAnswers if it's being selected *before* blur potentially.
      // For simplicity, we assume answerText is one of the current localAnswers.
      updateQuestion(questionIndex, { correctAnswer: answerText });
    };
    
    // answer section //////////////////////////////////////////////////////////
    return (
      <div className="space-y-4 grandstander text-lg text-[--text-color]">
        <h3 className='font-bold text-xl ml-4 -mb-3'>Answers</h3>
        <div className='grid gap-2 grid-cols-2'>
          {localAnswers.map((localAnswer, aIndex) => (
            <div key={`answer-container-${question.tempId}-${aIndex}`} className="relative">
              <Textarea
                rows={1}
                className='bg-white text-base text-[--text-color] border-2 border-slate-200 pl-6 py-4 pr-12 w-full'
                key={`answer-${question.tempId}-${aIndex}`}
                name={`question-${question.tempId}-answer-${aIndex}`}
                value={localAnswer} // Use local state for value
                onChange={(e) => handleLocalAnswerChange(aIndex, e.target.value)} // Update local state on change
                onBlur={() => saveAnswerTextOnBlur(aIndex)} // Update global state on blur
                onKeyDown={(e) => {
                  // Also save on Enter key for better UX
                  if (e.key === 'Enter') {
                    saveAnswerTextOnBlur(aIndex);
                  }
                }}
                placeholder={`Answer ${aIndex + 1}`}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => selectCorrectAnswer(localAnswer)} // Use localAnswer for selection
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full h-8 w-8 flex items-center justify-center
                            ${question.correctAnswer === localAnswer ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-600'}`}
                title={question.correctAnswer === localAnswer ? "Mark as incorrect" : "Mark as correct"}
              >
                {question.correctAnswer === localAnswer ? <Check size={20} strokeWidth={4} /> : <X size={20} strokeWidth={4} color="white"/>}
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // const TrueFalseForm = ({ questionIndex }: { questionIndex: number }) => {
  //   const question = questions[questionIndex];
  //   return (
  //     <div className="space-y-4">
  //       <h3 className='font-bold ml-2 -my-2'>Correct Answer</h3>
  //       <div className="flex space-x-4">
  //         {['True', 'False'].map(val => (
  //           <Button 
  //             key={val}
  //             variant={question.correctAnswer === val ? "default" : "outline"}
  //             onClick={() => updateQuestion(questionIndex, { correctAnswer: val })}
  //             className={question.correctAnswer === val ? "bg-[--primary-accent]" : ""}
  //           >
  //             {val}
  //           </Button>
  //         ))}
  //       </div>
  //     </div>
  //   );
  // };

  // const ShortAnswerForm = ({ questionIndex }: { questionIndex: number }) => {
  //   const question = questions[questionIndex];
  //   return (
  //     <div className="space-y-4">
  //       <h3 className='font-bold ml-2 -my-2'>Accepted Answer(s)</h3>
  //       <Textarea
  //         rows={2}
  //         className='bg-white h-16 text-[--text-color] border-2 border-slate-200 px-6 py-4'
  //         key={`short-answer-${question.tempId}`}
  //         name={`question-${question.tempId}-short-answer`}
  //         defaultValue={question.correctAnswer} 
  //         onBlur={(e) => updateQuestion(questionIndex, { correctAnswer: e.target.value })}
  //         placeholder="Enter the accepted answer(s), comma-separated for multiple"
  //       />
  //     </div>
  //   );
  // };

  const renderQuestionForm = (questionIndex: number) => {
    const question = questions[questionIndex];
    if (!question) return null; 
    switch (question.type) {
      case QuestionType.MATCHING:
        let initialPairs: MatchingPair[] = [{left: '', right: ''}];
        try {
            const parsed = JSON.parse(question.correctAnswer);
            if (Array.isArray(parsed) && parsed.every(p => typeof p === 'object' && 'left' in p && 'right' in p)) {
                initialPairs = parsed;
            }
        } catch (e) { console.error("Failed to parse matching pairs from correctAnswer", e); }
        return <QuestionFormMatching 
                    initialPairs={initialPairs} 
                    onSave={(pairs) => updateQuestion(questionIndex, { correctAnswer: JSON.stringify(pairs), answers: pairs.flatMap(p => [p.left, p.right]) })} 
                />;
      case QuestionType.SORTING:
        let initialItems: string[] = ['', '', ''];
        try {
            const parsed = JSON.parse(question.correctAnswer);
            if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
                initialItems = parsed;
            }
        } catch (e) { console.error("Failed to parse sorting items from correctAnswer", e); }
        return <QuestionFormSorting 
                    initialItems={initialItems} 
                    onSave={(items) => updateQuestion(questionIndex, { correctAnswer: JSON.stringify(items), answers: [...items]})} 
                />;
      // case QuestionType.TRUE_FALSE:
      //   return <TrueFalseForm questionIndex={questionIndex} />;
      // case QuestionType.SHORT_ANSWER:
      //   return <ShortAnswerForm questionIndex={questionIndex} />;
      case QuestionType.MULTIPLE_CHOICE:
      default:
        return <MultipleChoiceForm questionIndex={questionIndex} />;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("QuizForm internal submit (if used):");
    if (onConfirmQuestions) {
      onConfirmQuestions(); 
    } else {
      console.warn("QuizForm submitted but no onConfirmQuestions handler was provided.");
    }
  };

  const deleteQuestion = (indexToDelete: number) => {
    const questionToDelete = questions[indexToDelete];
    const newQuestions = questions.filter((_, index) => index !== indexToDelete);
    updateQuestionsAndNotifyParent(newQuestions);
    setOpenAccordionItems(prevOpen => prevOpen.filter(id => id !== questionToDelete.tempId));
    addToast('Question deleted.', { variant: 'error', position: 'top-center' })
  };

  // Function to sync all local answers to global state before submission
  const syncAllAnswersToGlobalState = () => {
    // Force blur on all active textarea elements to trigger saveAnswerTextOnBlur
    const activeElement = document.activeElement;
    if (activeElement && activeElement.tagName === 'TEXTAREA') {
      (activeElement as HTMLElement).blur();
    }
    
    // Force blur on all answer textareas for multiple choice questions
    questions.forEach((question) => {
      if (question.type === QuestionType.MULTIPLE_CHOICE) {
        const answerTextareas = document.querySelectorAll(`textarea[name*="question-${question.tempId}-answer"]`);
        answerTextareas.forEach((textarea) => {
          (textarea as HTMLElement).blur();
        });
      }
    });
  };

  // Expose triggerSubmit function using useImperativeHandle
  useImperativeHandle(ref, () => ({
    triggerSubmit: () => {
      // Sync all answers to global state before submission
      syncAllAnswersToGlobalState();
      
      // This directly calls the onConfirmQuestions prop if it exists,
      // which in CreatePage is handleQuestionsConfirmed (validation + step change)
      if (onConfirmQuestions) {
        onConfirmQuestions();
      } else {
        console.warn("QuizForm's triggerSubmit called but no onConfirmQuestions handler was provided.");
      }
    }
  }));

  return (
    <form onSubmit={handleSubmit} className={`space-y-8 pt-4 p-6 ${className} border-none shadow-none`}>

      {/* {onConfirmQuestions && questions.length > 0 && (
        <div className="flex justify-end -mt-10 -mb-4">
          <Button type="button" onClick={onConfirmQuestions} className="flex items-center pt-1 gap-2 p-4 bg-violet-100 text-[--text-color] border border-violet-500 shadow-[4px_4px_0px_0px_#8b5cf6] hover:bg-violet-200 hover:border-violet-600 hover:shadow-[4px_6px_0px_0px_#8b5cf6] hover:scale-105 transition-all duration-300">
            Next Step <CircleArrowRight className="ml-2 -mt-0.5" size={20} />
          </Button>
        </div>
      )} */}

      <Accordion type="multiple" value={openAccordionItems} onValueChange={setOpenAccordionItems} className="mt-4 s border-none">
        {questions.map((question, index) => (
          <AccordionItem value={question.tempId || `q-${index}`} key={question.tempId || `q-${index}`} className="border-b border-[--border-light]">
            <Card className="p-0 relative border-none rounded-none overflow-hidden">
              <div className="flex items-center px-2 bg-[--background] border-none ">
                <AccordionTrigger className="flex w-full px-4 py-2 text-left hover:no-underline focus:no-underline">
                  <div className="flex items-center gap-3 w-full">
                    {/* Image container - always rendered, visibility toggled by class */}
                    <div className={`relative ml-2 h-14 w-full max-w-20 bg-slate-300 rounded-sm overflow-hidden ${openAccordionItems.includes(question.tempId || '') ? 'hidden' : 'block'}`}>
                      <Image 
                        src={question.imageFile ? URL.createObjectURL(question.imageFile) : question.imageUrl} 
                        alt="Question image thumbnail"
                        width={84}
                        height={84}
                        className="rounded-md object-cover bg-slate-300"
                      />
                    </div>
                    <h2 className="text-xl flex  pt-1 font-semibold text-[--text-color] text-left">
                      {openAccordionItems.includes(question.tempId || '') ? <></> : <> 
                        <div className="flex text-lg items-center gap-2">
                          <span className="text-lg">Question {index + 1}</span>
                          {question.question ? <span>- {question.question.substring(0,50)}{question.question.length > 50 ? '...' : ''}</span> : ''}
                        </div>
                      </>}
                    </h2>
                  </div>
                </AccordionTrigger>
                <div className="flex items-center text-[--text-color] gap-1 pl-2 justify-end">
                    <Button type="button" size="icon" variant="ghost" onClick={() => openImageModal(index)} title="Duplicate Question">
                      <Picture className="h-5 w-5 " />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => { duplicateQuestion(index); }} title="Duplicate Question">
                      <Copy className="h-5 w-5" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => { deleteQuestion(index); }} title="Delete Question">
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </Button>
                </div>
              </div>
              <AccordionContent className="px-6 py-4 bg-slate-100 rounded-lg">
                <h3 className="font-bold text-xl ml-4 grandstander text-[--text-color]">Question {index + 1}</h3>
                <div className="flex gap-4">
                  <div className="basis-1/5 relative flex flex-col">
                    {/* <Label className="text-md font-semibold text-[--text-color] mb-1">Image (Optional)</Label> */}
                    <div className="relative w-full">
                      <Image 
                        src={question.imageFile ? URL.createObjectURL(question.imageFile) : question.imageUrl} 
                        alt={`Question ${index + 1} image`} 
                        width={240}
                        height={120}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="rounded-md h-24 object-cover bg-slate-200"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => openImageModal(index)} 
                        className="absolute bottom-1 right-1 text-xs p-1 px-2 h-auto bg-white/80 hover:bg-white"
                      >
                        Change Image
                      </Button>
                    </div>
                  </div>
                  <div className="basis-4/5 space-y-1 flex flex-col text-base">
                    {/* <Label htmlFor={`question-${index}-text`} className="text-md font-semibold text-[--text-color]">Question Text</Label> */}
                    <Textarea
                      rows={2}
                      id={`question-${index}-text`}
                      value={question.question}
                      onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                      placeholder="Enter your question here"
                      className="bg-white font-semibold p-6 text-[--text-color] grandstander border-2 border-slate-200 w-full flex-grow"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4">
                  {renderQuestionForm(index)}
                </div>
              </AccordionContent>
            </Card>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="flex w-full items-center justify-center">
        <Button type="button" onClick={() => addQuestion()} className="bg-white text-lg hover:border hover:border-[--border-dark] font-semibold px-6 py-3 text-[--text-color] rounded-full">
          <Plus className="h-5 w-5 mr-2 mb-0.5" /> Add New Question
        </Button>
      </div>

      {isImageModalOpen && (
        <ImageSelectModal 
          isOpen={isImageModalOpen} 
          onClose={() => setIsImageModalOpen(false)} 
          onImageSelect={handleImageSelect} 
        />
      )}
    </form>
  );
});

// Add display name for better debugging
QuizForm.displayName = "QuizForm";

export default QuizForm;