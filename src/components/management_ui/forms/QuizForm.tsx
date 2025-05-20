'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import ImageSelectModal from '@/components/management_ui/ImageSelectModal'
import { QuestionFormMatching } from './QuestionFormMatching'
import { QuestionFormSorting } from './QuestionFormSorting'
import { QuestionType } from '@/types/question_types'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Trash2 } from 'lucide-react'

interface Question {
  id?: string
  question: string
  answers: string[]
  correctAnswer: string
  imageUrl: string
  imageFile: File | null
  type?: QuestionType
}

interface InitialQuestionData {
  id?: string;
  question: string;
  answers: string[];
  correctAnswer: string;
  imageUrl: string;
  type?: QuestionType;
}

interface QuizFormProps {
  quizId?: string;
  
  quizTitle: string;
  quizDescription?: string;
  quizCoverImageUrl: string;
  quizOverallType: QuestionType;
  quizTags?: string[];

  onQuizCoverImageChange: (newImageUrl: string, newImageFile?: File | null) => void;

  initialQuestions?: InitialQuestionData[];
  
  className?: string;
}

const PLACEHOLDER_IMAGE = '/images/placeholder.webp'

export default function QuizForm({ 
  quizId, 
  quizTitle,
  quizDescription,
  quizCoverImageUrl,
  quizOverallType,
  quizTags,
  onQuizCoverImageChange,
  initialQuestions: initialQuestionsData,
  className 
}: QuizFormProps) {
  const router = useRouter();
  const [currentQuizCoverImageUrl, setCurrentQuizCoverImageUrl] = useState(quizCoverImageUrl || PLACEHOLDER_IMAGE);
  const [currentQuizCoverImageFile, setCurrentQuizCoverImageFile] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mode = quizId ? 'edit' : 'create';
  
  const initialQuestionsInternal: Question[] = initialQuestionsData?.map(q => ({ 
    ...q, 
    id: q.id || undefined,
    imageFile: null,
    type: quizOverallType
  })) || [];
  
  const [questions, setQuestions] = useState<Question[]>(initialQuestionsInternal);
  
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (mode === 'create' && questions.length === 0 && quizOverallType) {
      addQuestion();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizOverallType, mode]);

  const handleQuestionChange = (index: number, field: string, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  }

  const updateQuestion = (index: number, updatedQuestion: Question) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
  }

  const openImageModal = (questionIndex?: number) => {
    setActiveImageIndex(questionIndex ?? null);
    setIsImageModalOpen(true);
  };

  const handleImageSelect = (imageUrl: string, file?: File | null) => {
    if (activeImageIndex !== null) {
      const newQuestions = [...questions];
      newQuestions[activeImageIndex].imageUrl = imageUrl;
      newQuestions[activeImageIndex].imageFile = file || null;
      setQuestions(newQuestions);
    } else {
      setCurrentQuizCoverImageUrl(imageUrl);
      setCurrentQuizCoverImageFile(file || null);
      onQuizCoverImageChange(imageUrl, file || null);
    }
    setIsImageModalOpen(false);
  };

  const addQuestion = () => {
    if (!quizOverallType) return;
    
    let newQuestion: Question;
    
    switch (quizOverallType) {
      case QuestionType.MATCHING:
        newQuestion = { 
          question: '', 
          answers: ['', '', '', ''], 
          correctAnswer: JSON.stringify([{ left: '', right: '' }]),
          imageUrl: PLACEHOLDER_IMAGE, 
          imageFile: null,
          type: quizOverallType
        };
        break;
      case QuestionType.SORTING:
        newQuestion = { 
          question: '', 
          answers: ['', '', ''], 
          correctAnswer: JSON.stringify(['', '', '']),
          imageUrl: PLACEHOLDER_IMAGE, 
          imageFile: null,
          type: quizOverallType
        };
        break;
      case QuestionType.TRUE_FALSE:
        newQuestion = { 
          question: '', 
          answers: ['True', 'False'], 
          correctAnswer: 'True', 
          imageUrl: PLACEHOLDER_IMAGE, 
          imageFile: null,
          type: quizOverallType
        };
        break;
      case QuestionType.SHORT_ANSWER:
        newQuestion = { 
          question: '', 
          answers: [''], 
          correctAnswer: '', 
          imageUrl: PLACEHOLDER_IMAGE, 
          imageFile: null,
          type: quizOverallType
        };
        break;
      default:
        newQuestion = { 
          question: '', 
          answers: ['', '', '', ''], 
          correctAnswer: '', 
          imageUrl: PLACEHOLDER_IMAGE, 
          imageFile: null,
          type: quizOverallType
        };
    }
    
    setQuestions([...questions, newQuestion]);
  };

  const MultipleChoiceForm = ({ questionIndex }: { questionIndex: number }) => {
    const question = questions[questionIndex];
    
    const isCorrectAnswerValid = question.correctAnswer === '' || question.answers.includes(question.correctAnswer);
    
    const saveAnswer = (aIndex: number, value: string) => {
      const newQuestions = [...questions];
      newQuestions[questionIndex].answers[aIndex] = value;
      setQuestions(newQuestions);
    };
    
    const saveCorrectAnswer = (value: string) => {
      const newQuestions = [...questions];
      newQuestions[questionIndex].correctAnswer = value;
      setQuestions(newQuestions);
    };
    
    return (
      <div className="space-y-4">
        <h3 className='font-bold ml-2 -my-2'>Answers</h3>
        <div className='grid gap-2 grid-cols-2'>            
          {question.answers.map((answer, aIndex) => (
            <Input
              key={`answer-${questionIndex}-${aIndex}-${answer}`}
              name={`question-${questionIndex}-answer-${aIndex}`}
              defaultValue={answer}
              onBlur={(e) => saveAnswer(aIndex, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Tab' || e.key === 'Enter') {
                  saveAnswer(aIndex, e.currentTarget.value);
                }
              }}
              placeholder={`Answer ${aIndex + 1}`}
              required
            />
          ))}
        </div>
        <div className="space-y-1">
          <h3 className='font-bold ml-2 -my-2'>Correct Answer</h3>
          <Input
            key={`correct-answer-${questionIndex}-${question.correctAnswer}`}
            name={`question-${questionIndex}-correct-answer`}
            defaultValue={question.correctAnswer}
            onBlur={(e) => saveCorrectAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Tab' || e.key === 'Enter') {
                saveCorrectAnswer(e.currentTarget.value);
              }
            }}
            placeholder="Correct Answer"
            required
            className={!isCorrectAnswerValid ? "border-red-500" : ""}
          />
          {!isCorrectAnswerValid && question.correctAnswer !== '' && (
            <p className="text-red-500 text-xs ml-2">
              Warning: The correct answer doesn&apos;t match any of the options. 
            </p>
          )}
        </div>
      </div>
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const TrueFalseForm = ({ questionIndex }: { questionIndex: number }) => {
    return (
      <div className="space-y-4">
        <h3 className='font-bold ml-2 -my-2'>Options (True/False - Placeholder)</h3>
        <p className="text-sm text-gray-500">To be implemented, potentially using RadioGroup.</p>
      </div>
    );
  };

  const ShortAnswerForm = ({ questionIndex }: { questionIndex: number }) => {
    const question = questions[questionIndex];
    
    const saveCorrectAnswer = (value: string) => {
      const newQuestions = [...questions];
      newQuestions[questionIndex].correctAnswer = value;
      setQuestions(newQuestions);
    };
    
    return (
      <div className="space-y-2">
        <Label htmlFor={`short-answer-${questionIndex}`}>Correct Answer</Label>
        <Input
          id={`short-answer-${questionIndex}`}
          name={`question-${questionIndex}-correct-answer`}
          key={`short-answer-correct-${questionIndex}-${question.correctAnswer}`}
          defaultValue={question.correctAnswer}
          onBlur={(e) => saveCorrectAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Tab' || e.key === 'Enter') {
              saveCorrectAnswer(e.currentTarget.value);
            }
          }}
          placeholder="Enter the correct short answer"
          required
        />
      </div>
    );
  };

  const renderQuestionForm = (questionIndex: number) => {
    const questionData = questions[questionIndex];
    switch (quizOverallType) {
      case QuestionType.MULTIPLE_CHOICE:
        return <MultipleChoiceForm questionIndex={questionIndex} />;
      case QuestionType.TRUE_FALSE:
        return <TrueFalseForm questionIndex={questionIndex} />;
      case QuestionType.SHORT_ANSWER:
        return <ShortAnswerForm questionIndex={questionIndex} />;
      case QuestionType.MATCHING:
        const matchingProps = {
          initialPairs: questionData.correctAnswer ? JSON.parse(questionData.correctAnswer) : [{ left: "", right: "" }],
          onSave: (pairs: {left: string, right: string}[]) => {
            const flatAnswers = pairs.flatMap((pair: {left: string, right: string}) => [pair.left, pair.right]);
            const correctAnswer = JSON.stringify(pairs);
            updateQuestion(questionIndex, { ...questionData, answers: flatAnswers, correctAnswer });
          },
        };
        return <QuestionFormMatching {...matchingProps} />;
      case QuestionType.SORTING:
        const sortingProps = {
          initialItems: questionData.correctAnswer ? JSON.parse(questionData.correctAnswer) : [""],
          onSave: (items: string[]) => {
            updateQuestion(questionIndex, { ...questionData, answers: [...items], correctAnswer: JSON.stringify(items) });
          },
        };
        return <QuestionFormSorting {...sortingProps} />;
      default:
        return <p>Unsupported question type: {quizOverallType}</p>;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (quizOverallType === QuestionType.MULTIPLE_CHOICE) {
      for (const q of questions) {
        if (q.type === QuestionType.MULTIPLE_CHOICE && !q.answers.includes(q.correctAnswer)) {
          alert(`Error: For question "${q.question}", the correct answer "${q.correctAnswer}" is not among the provided answer options. Please correct it before submitting.`);
          setIsSubmitting(false);
          return;
        }
      }
    }
    
    const formData = new FormData();
    
    formData.append('title', quizTitle);
    if (quizDescription) {
      formData.append('description', quizDescription);
    }
    if (currentQuizCoverImageFile) {
      formData.append('quizImage', currentQuizCoverImageFile);
    } else {
      formData.append('quizImageUrl', currentQuizCoverImageUrl);
    }
    formData.append('quizType', quizOverallType);
    if (quizTags && quizTags.length > 0) {
      quizTags.forEach(tag => formData.append('tags[]', tag));
    }

    questions.forEach((q, index) => {
      if (q.id) {
        formData.append(`questions[${index}][id]`, q.id);
      }
      formData.append(`questions[${index}][question]`, q.question);
      formData.append(`questions[${index}][correctAnswer]`, q.correctAnswer);
      formData.append(`questions[${index}][type]`, q.type || quizOverallType);

      q.answers.forEach((ans, ansIndex) => {
        formData.append(`questions[${index}][answers][${ansIndex}]`, ans);
      });

      if (q.imageFile) {
        formData.append(`questions[${index}][imageFile]`, q.imageFile);
      } else if (q.imageUrl && q.imageUrl !== PLACEHOLDER_IMAGE) {
        formData.append(`questions[${index}][imageUrl]`, q.imageUrl);
      }
    });

    try {
      let response;
      if (mode === 'edit' && quizId) {
        response = await fetch(`/api/quizzes/${quizId}`, {
          method: 'PUT',
          body: formData,
        });
      } else {
        response = await fetch('/api/quizzes', {
          method: 'POST',
          body: formData,
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      router.push(`/quizzes/${result.id}`);
    } catch (error) {
      console.error("Failed to save quiz:", error);
      alert(`Failed to save quiz: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteQuestion = (indexToDelete: number) => {
    setQuestions(questions.filter((_, index) => index !== indexToDelete));
  };

  return (
    <Card className={`p-6 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">{quizTitle}</h2>
          {quizDescription && <p className="text-sm text-muted-foreground">{quizDescription}</p>}
          
          <div className="space-y-2">
            <Label>Quiz Cover Image</Label>
            <div className="flex items-center gap-4">
              <Image
                src={currentQuizCoverImageUrl}
                alt="Quiz cover"
                width={100}
                height={100}
                className="rounded-md object-cover aspect-square"
              />
              <Button type="button" variant="outline" onClick={() => openImageModal()}>
                {currentQuizCoverImageUrl === PLACEHOLDER_IMAGE && !currentQuizCoverImageFile ? 'Add Quiz Image' : 'Change Quiz Image'}
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Quiz Type: <span className="font-semibold">{quizOverallType.replace('_', ' ')}</span>
          </p>
          {quizTags && quizTags.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Tags: {quizTags.join(', ')}
            </p>
          )}
        </div>

        {questions.map((question, index) => (
          <Card key={index} className="p-4 space-y-4 relative">
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
              onClick={() => deleteQuestion(index)}
              aria-label="Delete question"
            >
              <Trash2 size={18} />
            </Button>
            <div className="space-y-2">
              <Label htmlFor={`question-${index}`}>Question {index + 1}</Label>
              <Input
                id={`question-${index}`}
                name={`question-${index}-text`}
                value={question.question}
                onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                placeholder="Enter your question"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Question Image (Optional)</Label>
              <div className="flex items-center gap-4">
                <Image
                  src={question.imageUrl}
                  alt={`Question ${index + 1} image`}
                  width={80}
                  height={80}
                  className="rounded-md object-cover aspect-square"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => openImageModal(index)}>
                  {question.imageUrl === PLACEHOLDER_IMAGE ? 'Add Image' : 'Change Image'}
                </Button>
              </div>
            </div>
            
            {renderQuestionForm(index)}
          </Card>
        ))}

        <Button type="button" variant="outline" onClick={addQuestion} disabled={isSubmitting || !quizOverallType}>
          Add Question
        </Button>
        <Button type="submit" disabled={isSubmitting || questions.length === 0}>
          {isSubmitting ? (mode === 'edit' ? 'Saving...' : 'Creating...') : (mode === 'edit' ? 'Save Changes' : 'Create Quiz')}
        </Button>
      </form>

      {isImageModalOpen && (
        <ImageSelectModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          onImageSelect={handleImageSelect}
        />
      )}
    </Card>
  );
}
