'use client'

import { useState, useEffect, forwardRef, useImperativeHandle, memo } from 'react'
import { Button } from '@/components/ui/button'
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

type Question = BaseQuestion & { tempId?: string };

interface QuizFormProps {
  quizId?: string;
  quizOverallType: QuestionType;
  onQuizCoverImageChange: (newImageUrl: string, newImageFile?: File | null) => void;
  initialQuestions: Omit<Question, 'tempId'>[] | Question[];
  onQuestionsChange: (updatedQuestions: Question[]) => void;
  onConfirmQuestions?: () => void;
  className?: string;
}

export interface QuizFormHandle {
  triggerSubmit: () => void;
}

const PLACEHOLDER_IMAGE = '/images/placeholder.webp'

const ensureTempId = (q: Omit<Question, 'tempId'> | Question): Question => {
  if ('tempId' in q && q.tempId) return q as Question;
  return { ...q, tempId: q.id || `new-${Date.now()}-${Math.random()}` } as Question;
};

function useObjectUrl(file: File | null | undefined, fallbackUrl: string): string {
  const [url, setUrl] = useState(fallbackUrl);

  useEffect(() => {
    if (!file) {
      setUrl(fallbackUrl);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, fallbackUrl]);

  return url;
}

function QuestionImage({
  file,
  imageUrl,
  alt,
  width,
  height,
  className,
}: {
  file?: File | null;
  imageUrl: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}) {
  const src = useObjectUrl(file, imageUrl);
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
}

interface MultipleChoiceFormProps {
  question: Question;
  questionIndex: number;
  onUpdate: (index: number, fields: Partial<Question>) => void;
}

const MultipleChoiceForm = memo(function MultipleChoiceForm({
  question,
  questionIndex,
  onUpdate,
}: MultipleChoiceFormProps) {
  const [localAnswers, setLocalAnswers] = useState<string[]>(() => {
    const answers = [...(question.answers || [])];
    while (answers.length < 4) answers.push('');
    return answers;
  });

  useEffect(() => {
    const answers = [...(question.answers || [])];
    while (answers.length < 4) answers.push('');
    setLocalAnswers(answers);
  }, [question.answers, question.tempId]);

  const handleLocalAnswerChange = (aIndex: number, value: string) => {
    const updatedLocalAnswers = [...localAnswers];
    updatedLocalAnswers[aIndex] = value;
    setLocalAnswers(updatedLocalAnswers);
  };

  const saveAnswerTextOnBlur = (aIndex: number) => {
    const value = localAnswers[aIndex];
    const currentGlobalAnswers = question.answers || [];
    const newAnswers = [...currentGlobalAnswers];
    while (newAnswers.length < 4) newAnswers.push('');

    if (value !== newAnswers[aIndex]) {
      newAnswers[aIndex] = value;
      let newCorrectAnswer = question.correctAnswer;
      if (currentGlobalAnswers[aIndex] === question.correctAnswer) {
        newCorrectAnswer = value;
      }
      onUpdate(questionIndex, { answers: newAnswers, correctAnswer: newCorrectAnswer });
    }
  };

  const selectCorrectAnswer = (answerText: string) => {
    onUpdate(questionIndex, { correctAnswer: answerText });
  };

  return (
    <div className="space-y-2 text-base text-[--text-color] grandstander md:space-y-4 md:text-lg">
      <h3 className="-mb-1 ml-1 text-lg font-bold md:-mb-3 md:ml-4 md:text-xl">Answers</h3>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {localAnswers.map((localAnswer, aIndex) => (
          <div key={`answer-container-${question.tempId}-${aIndex}`} className="relative">
            <Textarea
              rows={1}
              className="min-h-[44px] w-full border-2 border-slate-200 bg-white py-2 pl-3 pr-10 text-base text-[--text-color] md:min-h-[65px] md:py-4 md:pl-6 md:pr-12"
              name={`question-${question.tempId}-answer-${aIndex}`}
              value={localAnswer}
              onChange={(e) => handleLocalAnswerChange(aIndex, e.target.value)}
              onBlur={() => saveAnswerTextOnBlur(aIndex)}
              onKeyDown={(e) => {
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
              onClick={() => selectCorrectAnswer(localAnswer)}
              className={`absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 transform items-center justify-center rounded-full p-1 md:right-2
                          ${question.correctAnswer === localAnswer ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-slate-300 text-slate-600 hover:bg-slate-400'}`}
              title={question.correctAnswer === localAnswer ? "Marked as correct" : "Mark as correct"}
            >
              {question.correctAnswer === localAnswer ? (
                <Check className="h-4 w-4 md:h-5 md:w-5" strokeWidth={4} />
              ) : (
                <X className="h-4 w-4 md:h-5 md:w-5" strokeWidth={4} color="white" />
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
});

const QuizForm = forwardRef<QuizFormHandle, QuizFormProps>(({ 
  quizId, 
  quizOverallType,
  onQuizCoverImageChange,
  initialQuestions,
  onQuestionsChange,
  onConfirmQuestions,
  className 
}, ref) => {
  const { addToast } = useCustomToast()

  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);

  const mode = quizId ? 'edit' : 'create';
  
  const [questions, setQuestionsState] = useState<Question[]>(() => {
    return initialQuestions.map(ensureTempId);
  });
  
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  useEffect(() => {
    const processedQuestions = initialQuestions.map(ensureTempId);
    setQuestionsState(processedQuestions);
    if (mode === 'create' && processedQuestions.length > 0) {
        setOpenAccordionItems([processedQuestions[processedQuestions.length - 1].tempId!]);
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
            newQuestionAnswers = [];
            newQuestionCorrectAnswer = JSON.stringify([{ left: '', right: '' }]);
            break;
          case QuestionType.SORTING:
            newQuestionAnswers = [];
            newQuestionCorrectAnswer = JSON.stringify(['', '', '']); 
            break;
          default:
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
    addQuestion(questions[indexToDuplicate]);
  };

  const renderQuestionForm = (questionIndex: number) => {
    const question = questions[questionIndex];
    if (!question) return null; 
    switch (question.type) {
      case QuestionType.MATCHING: {
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
      }
      case QuestionType.SORTING: {
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
      }
      case QuestionType.MULTIPLE_CHOICE:
      default:
        return (
          <MultipleChoiceForm
            question={question}
            questionIndex={questionIndex}
            onUpdate={updateQuestion}
          />
        );
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (onConfirmQuestions) {
      onConfirmQuestions(); 
    }
  };

  const deleteQuestion = (indexToDelete: number) => {
    const questionToDelete = questions[indexToDelete];
    const newQuestions = questions.filter((_, index) => index !== indexToDelete);
    updateQuestionsAndNotifyParent(newQuestions);
    setOpenAccordionItems(prevOpen => prevOpen.filter(id => id !== questionToDelete.tempId));
    addToast('Question deleted.', { variant: 'error', position: 'top-center' })
  };

  const syncAllAnswersToGlobalState = () => {
    const activeElement = document.activeElement;
    if (activeElement && activeElement.tagName === 'TEXTAREA') {
      (activeElement as HTMLElement).blur();
    }
    
    questions.forEach((question) => {
      if (question.type === QuestionType.MULTIPLE_CHOICE) {
        const answerTextareas = document.querySelectorAll(`textarea[name*="question-${question.tempId}-answer"]`);
        answerTextareas.forEach((textarea) => {
          (textarea as HTMLElement).blur();
        });
      }
    });
  };

  useImperativeHandle(ref, () => ({
    triggerSubmit: () => {
      syncAllAnswersToGlobalState();
      if (onConfirmQuestions) {
        onConfirmQuestions();
      }
    }
  }));

  return (
    <>
    <form onSubmit={handleSubmit} className={`space-y-8 border-none p-3 pt-2 shadow-none md:p-6 md:pt-4 ${className}`}>
      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-[var(--surface-stone)] px-6 py-16 text-center">
          <p className="text-xl font-semibold text-[--text-color]">No questions yet</p>
          <p className="max-w-md text-sm text-slate-600">
            Add your first question manually, or use Upload / AI from the toolbar above.
          </p>
          <Button
            type="button"
            onClick={() => addQuestion()}
            className="rounded-full border border-[--border-dark] bg-white px-6 py-3 text-lg font-semibold text-[--text-color] shadow-[3px_3px_0px_0px_var(--border-dark)] hover:bg-[var(--surface-cloud)]"
          >
            <Plus className="mb-0.5 mr-2 h-5 w-5" /> Add New Question
          </Button>
        </div>
      ) : (
      <Accordion type="multiple" value={openAccordionItems} onValueChange={setOpenAccordionItems} className="mt-4 border-none">
        {questions.map((question, index) => (
          <AccordionItem value={question.tempId || `q-${index}`} key={question.tempId || `q-${index}`} className="border-b border-[--border-light]">
            <Card className="relative overflow-hidden rounded-none border-none p-0">
              <div className="flex items-center border-none bg-[--background] px-2">
                <AccordionTrigger className="flex min-w-0 flex-1 px-2 py-2 text-left hover:no-underline focus:no-underline md:px-4">
                  <div className="flex min-w-0 w-full items-center gap-2 md:gap-3">
                    <div className={`relative ml-2 h-14 w-full max-w-20 overflow-hidden rounded-sm bg-slate-300 ${openAccordionItems.includes(question.tempId || '') ? 'hidden' : 'hidden md:block'}`}>
                      <QuestionImage
                        file={question.imageFile}
                        imageUrl={question.imageUrl}
                        alt="Question image thumbnail"
                        width={84}
                        height={84}
                        className="rounded-md bg-slate-300 object-cover"
                      />
                    </div>
                    {openAccordionItems.includes(question.tempId || '') ? null : (
                      <>
                        <span className="w-6 shrink-0 text-center text-lg font-semibold tabular-nums text-[--text-color] md:hidden">
                          {index + 1}
                        </span>
                        <h2 className="hidden min-w-0 items-center gap-2 pt-1 text-left text-lg font-semibold text-[--text-color] md:flex">
                          <span>Question {index + 1}</span>
                          {question.question ? (
                            <span>
                              - {question.question.substring(0, 50)}
                              {question.question.length > 50 ? '...' : ''}
                            </span>
                          ) : null}
                        </h2>
                        <p className="min-w-0 flex-1 text-left text-base font-semibold leading-snug text-[--text-color] line-clamp-2 md:hidden">
                          {question.question || 'New question'}
                        </p>
                      </>
                    )}
                  </div>
                </AccordionTrigger>
                <div
                  className={`shrink-0 items-center justify-end gap-1 pl-2 text-[--text-color] ${
                    openAccordionItems.includes(question.tempId || '')
                      ? 'flex'
                      : 'hidden md:flex'
                  }`}
                >
                    <Button type="button" size="icon" variant="ghost" onClick={() => openImageModal(index)} title="Change question image">
                      <Picture className="h-4 w-4 md:h-5 md:w-5" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => { duplicateQuestion(index); }} title="Duplicate Question">
                      <Copy className="h-4 w-4 md:h-5 md:w-5" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => { deleteQuestion(index); }} title="Delete Question">
                      <Trash2 className="h-4 w-4 text-red-600 md:h-5 md:w-5" />
                    </Button>
                </div>
              </div>
              <AccordionContent className="rounded-lg bg-[var(--surface-stone)] px-2 py-2 md:px-6 md:py-4">
                <h3 className="ml-1 text-lg font-bold text-[--text-color] grandstander md:ml-4 md:text-xl">Question {index + 1}</h3>
                <div className="flex gap-2 md:gap-4">
                  <div className="relative flex basis-1/5 flex-col">
                    <div className="relative w-full">
                      <QuestionImage
                        file={question.imageFile}
                        imageUrl={question.imageUrl}
                        alt={`Question ${index + 1} image`}
                        width={240}
                        height={120}
                        className="h-20 rounded-md bg-slate-200 object-cover md:h-24"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => openImageModal(index)} 
                        className="absolute bottom-1 right-1 hidden h-auto bg-white/80 p-1 px-2 text-xs hover:bg-white md:inline-flex"
                      >
                        Change Image
                      </Button>
                    </div>
                  </div>
                  <div className="flex basis-4/5 flex-col space-y-1 text-base">
                    <Textarea
                      rows={2}
                      id={`question-${index}-text`}
                      value={question.question}
                      onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                      placeholder="Enter your question here"
                      className="min-h-[44px] w-full flex-grow border-2 border-slate-200 bg-white p-3 text-base font-semibold text-[--text-color] grandstander md:min-h-[65px] md:p-6"
                      required
                    />
                  </div>
                </div>
                <div className="mt-2 md:mt-4">
                  {renderQuestionForm(index)}
                </div>
              </AccordionContent>
            </Card>
          </AccordionItem>
        ))}
      </Accordion>
      )}

      {questions.length > 0 && (
        <div className="flex w-full items-center justify-center">
          <Button type="button" onClick={() => addQuestion()} className="rounded-full bg-white px-6 py-3 text-lg font-semibold text-[--text-color] hover:border hover:border-[--border-dark]">
            <Plus className="mb-0.5 mr-2 h-5 w-5" /> Add New Question
          </Button>
        </div>
      )}
    </form>

      {isImageModalOpen && (
        <ImageSelectModal 
          isOpen={isImageModalOpen} 
          onClose={() => setIsImageModalOpen(false)} 
          onImageSelect={handleImageSelect} 
        />
      )}
    </>
  );
});

QuizForm.displayName = "QuizForm";

export default QuizForm;
