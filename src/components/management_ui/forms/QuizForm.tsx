'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import ImageSelectModal from '@/components/management_ui/ImageSelectModal'
import { QuestionFormMatching } from "./QuestionFormMatching";
import { QuestionFormSorting } from "./QuestionFormSorting";
import { QuestionType } from "@/types/question_types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Trash2 } from "lucide-react"

interface Question {
  id?: string
  question: string
  answers: string[]
  correctAnswer: string
  imageUrl: string
  imageFile: File | null
  type?: QuestionType
}

// Define a type for questions as they come in via initialData (without imageFile)
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
  initialData?: {
    title: string;
    imageUrl: string;
    questions: InitialQuestionData[]; // Use InitialQuestionData here
  };
}

const PLACEHOLDER_IMAGE = '/images/placeholder.webp'

export default function QuizForm({ quizId, initialData }: QuizFormProps = {}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || '');
  const [quizImageUrl, setQuizImageUrl] = useState(initialData?.imageUrl || PLACEHOLDER_IMAGE);
  const [quizImageFile, setQuizImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mode = quizId && initialData ? 'edit' : 'create';
  
  // Map InitialQuestionData to the internal Question state, adding imageFile: null
  const initialQuestions: Question[] = initialData?.questions?.map(q => ({ 
    ...q, 
    id: q.id || undefined,
    imageFile: null, // Explicitly add imageFile as null for internal state
    type: q.type // Ensure type is carried over
  })) || [];
  
  const initialQuestionType = initialQuestions?.[0]?.type || undefined;
  const [questionType, setQuestionType] = useState<QuestionType | undefined>(initialQuestionType);
  const [typeConfirmed, setTypeConfirmed] = useState(!!initialQuestions?.length);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions); // This state now correctly holds Question[]
  
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

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
      setQuizImageUrl(imageUrl);
      setQuizImageFile(file || null);
    }
    setIsImageModalOpen(false);
  };

  const confirmQuestionType = () => {
    if (!questionType) return;
    
    setTypeConfirmed(true);
    // Add the first empty question of the selected type
    addQuestion();
  };

  const addQuestion = () => {
    // Use the existing quiz type from the first question, or fall back to the selected type
    const currentType = questions[0]?.type || questionType;
    if (!currentType) return;
    
    let newQuestion: Question;
    
    // Create appropriate empty question based on the quiz type
    switch (currentType) {
      case QuestionType.MATCHING:
        newQuestion = { 
          question: '', 
          answers: ['', '', '', ''], 
          correctAnswer: JSON.stringify([{ left: '', right: '' }]),
          imageUrl: PLACEHOLDER_IMAGE, 
          imageFile: null,
          type: QuestionType.MATCHING
        };
        break;
      case QuestionType.SORTING:
        newQuestion = { 
          question: '', 
          answers: ['', '', ''], 
          correctAnswer: JSON.stringify(['', '', '']),
          imageUrl: PLACEHOLDER_IMAGE, 
          imageFile: null,
          type: QuestionType.SORTING
        };
        break;
      case QuestionType.TRUE_FALSE:
        newQuestion = { 
          question: '', 
          answers: ['True', 'False'], 
          correctAnswer: 'True', 
          imageUrl: PLACEHOLDER_IMAGE, 
          imageFile: null,
          type: QuestionType.TRUE_FALSE
        };
        break;
      case QuestionType.SHORT_ANSWER:
        newQuestion = { 
          question: '', 
          answers: [''], 
          correctAnswer: '', 
          imageUrl: PLACEHOLDER_IMAGE, 
          imageFile: null,
          type: QuestionType.SHORT_ANSWER
        };
        break;
      default:
        newQuestion = { 
          question: '', 
          answers: ['', '', '', ''], 
          correctAnswer: '', 
          imageUrl: PLACEHOLDER_IMAGE, 
          imageFile: null,
          type: currentType
        };
    }
    
    setQuestions([...questions, newQuestion]);
  };

  const MultipleChoiceForm = ({ questionIndex }: { questionIndex: number }) => {
    const question = questions[questionIndex];
    
    // Check if correct answer matches one of the answers
    const isCorrectAnswerValid = question.correctAnswer === '' || question.answers.includes(question.correctAnswer);
    
    // Use direct DOM manipulation with ref to avoid focus issues
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

  const TrueFalseForm = ({ questionIndex }: { questionIndex: number }) => {
    const question = questions[questionIndex];
    
    return (
      <div className="space-y-4">
        <h3 className='font-bold ml-2 -my-2'>Options</h3>
        <RadioGroup 
          value={question.correctAnswer}
          onValueChange={(value) => handleQuestionChange(questionIndex, 'correctAnswer', value)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="True" id={`true-${questionIndex}`} />
            <Label htmlFor={`true-${questionIndex}`}>True</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="False" id={`false-${questionIndex}`} />
            <Label htmlFor={`false-${questionIndex}`}>False</Label>
          </div>
        </RadioGroup>
        
        {/* Set fixed answers for True/False */}
        {question.answers.length !== 2 && (
          <Button 
            type="button" 
            onClick={() => {
              const newQuestions = [...questions];
              newQuestions[questionIndex].answers = ['True', 'False'];
              setQuestions(newQuestions);
            }}
            className="mt-2"
          >
            Set Options
          </Button>
        )}
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
      <div className="space-y-4">
        <h3 className='font-bold ml-2 -my-2'>Correct Answer</h3>
        <Input
          key={`short-answer-${questionIndex}-${question.correctAnswer}`}
          name={`question-${questionIndex}-short-answer`}
          defaultValue={question.correctAnswer}
          onBlur={(e) => saveCorrectAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Tab' || e.key === 'Enter') {
              saveCorrectAnswer(e.currentTarget.value);
            }
          }}
          placeholder="Correct Answer"
          required
        />
        <p className="text-sm text-gray-500 ml-2">
          For short answer questions, only provide the correct answer. The student will need to type this exactly.
        </p>
        
        {/* Set empty answers array - not used for short answer */}
        {question.answers.some(a => a.length > 0) && (
          <Button 
            type="button" 
            onClick={() => {
              const newQuestions = [...questions];
              newQuestions[questionIndex].answers = [''];
              setQuestions(newQuestions);
            }}
            className="mt-2"
          >
            Clear Options
          </Button>
        )}
      </div>
    );
  };

  const renderQuestionForm = (questionIndex: number) => {
    const question = questions[questionIndex];
    const type = question.type || questionType;
    
    switch (type) {
      case QuestionType.MATCHING:
        try {
          const matchingPairs = question.correctAnswer 
            ? JSON.parse(question.correctAnswer)
            : [{ left: "", right: "" }];
          
          return (
            <QuestionFormMatching
              initialPairs={matchingPairs}
              onSave={(pairs) => {
                const flatAnswers = pairs.flatMap(pair => [pair.left, pair.right]);
                const correctAnswer = JSON.stringify(pairs);
                
                updateQuestion(questionIndex, {
                  ...question,
                  answers: flatAnswers,
                  correctAnswer
                });
              }}
            />
          );
        } catch {
          return <MultipleChoiceForm questionIndex={questionIndex} />;
        }
      
      case QuestionType.SORTING:
        try {
          const sortingItems = question.correctAnswer
            ? JSON.parse(question.correctAnswer)
            : [""];
          
          return (
            <QuestionFormSorting
              initialItems={sortingItems}
              onSave={(items) => {
                updateQuestion(questionIndex, {
                  ...question,
                  answers: [...items],
                  correctAnswer: JSON.stringify(items)
                });
              }}
            />
          );
        } catch {
          return <MultipleChoiceForm questionIndex={questionIndex} />;
        }
        
      case QuestionType.TRUE_FALSE:
        return <TrueFalseForm questionIndex={questionIndex} />;
        
      case QuestionType.SHORT_ANSWER:
        return <ShortAnswerForm questionIndex={questionIndex} />;
      
      default:
        return <MultipleChoiceForm questionIndex={questionIndex} />;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (questions.length === 0 && typeConfirmed) {
      alert('Please add at least one question to the quiz.');
      setIsSubmitting(false);
      return;
    }
    if (!typeConfirmed && questions.length === 0) {
        alert('Please select a question type and add questions.');
        setIsSubmitting(false);
        return;
    }

    const formData = new FormData();
    formData.append('title', title);

    // Handle quiz cover image
    if (quizImageFile) {
      formData.append('quizImage', quizImageFile);
    } else if (quizImageUrl !== PLACEHOLDER_IMAGE) {
      // If no new file, but an existing URL (not placeholder), send it
      formData.append('quizImageUrl', quizImageUrl);
    } else {
      // If it is the placeholder and no new file, explicitly send placeholder
      formData.append('quizImageUrl', PLACEHOLDER_IMAGE);
    }
    
    // Append defaultQuestionType, determined by the first question or selected type
    const defaultQuestionType = questions[0]?.type || questionType || QuestionType.MULTIPLE_CHOICE;
    formData.append('questionType', defaultQuestionType);

    // Append questions data
    // This needs to match the structure expected by the API: `questions[index][field]`
    // And ensure IDs are passed for existing questions in edit mode.
    questions.forEach((q, index) => {
      formData.append(`questions[${index}][question]`, q.question);
      q.answers.forEach((ans, ansIndex) => {
        formData.append(`questions[${index}][answers][${ansIndex}]`, ans);
      });
      formData.append(`questions[${index}][correctAnswer]`, q.correctAnswer);
      formData.append(`questions[${index}][type]`, q.type || defaultQuestionType);
      
      if (q.id && mode === 'edit') { // Crucial for PUT: include question ID
        formData.append(`questions[${index}][id]`, q.id);
      }

      if (q.imageFile) {
        formData.append(`questions[${index}][image]`, q.imageFile);
      } else if (q.imageUrl && q.imageUrl !== PLACEHOLDER_IMAGE) {
        formData.append(`questions[${index}][imageUrl]`, q.imageUrl);
      } else {
        formData.append(`questions[${index}][imageUrl]`, PLACEHOLDER_IMAGE);
      }
    });

    try {
      let response;
      if (mode === 'edit') {
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

      if (response.ok) {
        const result = await response.json();
        console.log('Quiz submission successful:', result);
        router.push('/quizzes'); // Navigate to quiz list or the created/edited quiz page
      } else {
        const errorData = await response.json();
        console.error('Failed to submit quiz:', errorData);
        alert(`Error: ${errorData.error || 'Failed to save quiz. Check console for details.'}`);
      }
    } catch (error) {
      console.error('Network or other error submitting quiz:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add reset function
  const resetQuizType = () => {
    if (questions.length > 0) {
      if (!confirm("Resetting quiz type will remove all your current questions. Are you sure?")) {
        return;
      }
    }
    setTypeConfirmed(false);
    setQuestionType(undefined);
    setQuestions([]);
  };

  const deleteQuestion = (indexToDelete: number) => {
    setQuestions(prevQuestions => prevQuestions.filter((_, index) => index !== indexToDelete));
  };

  return (
    <form onSubmit={handleSubmit} className="h-full space-y-6 bg-white p-8 rounded-lg shadow-lg w-full">
      {/* Quiz Title input */}
      <div>
        <label htmlFor="title" className="block text-lg font-medium text-gray-700 mb-1">Quiz Title</label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter the quiz title"
          required
          className="w-full"
        />
      </div>

      {/* Quiz Cover Image */}
      <div>
        <label className="block text-lg font-medium text-gray-700 mb-1">Quiz Cover Image</label>
        <div className="mt-2 flex items-center">
          <Image 
            src={quizImageFile ? URL.createObjectURL(quizImageFile) : quizImageUrl} 
            alt="Quiz Cover" 
            width={128} 
            height={128} 
            className="h-32 w-32 object-cover rounded-md mr-4" 
          />
          <Button type="button" variant="outline" onClick={() => openImageModal()}>
            {quizImageUrl === PLACEHOLDER_IMAGE && !quizImageFile ? 'Add Image' : 'Change Image'}
          </Button>
        </div>
      </div>
      
      {/* Type selection only if not typeConfirmed */}
      {!typeConfirmed && (
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">Select Question Type for the Quiz</label>
          <RadioGroup value={questionType} onValueChange={(value) => setQuestionType(value as QuestionType)} className="flex flex-wrap gap-4 mb-2">
            {Object.values(QuestionType).map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <RadioGroupItem value={type} id={type} />
                <Label htmlFor={type}>{type.replace(/_/g, ' ')}</Label>
              </div>
            ))}
          </RadioGroup>
          <Button type="button" onClick={confirmQuestionType} disabled={!questionType}>Confirm Type & Add Questions</Button>
        </div>
      )}

      {typeConfirmed && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800">Questions ({questions[0]?.type?.replace(/_/g, ' ') || 'Not Set'})</h2>
            {questions.length > 0 && (
               <Button type="button" variant="outline" size="sm" onClick={resetQuizType} className="ml-4">
                 Change Quiz Type (will clear questions)
               </Button>
            )}
          </div>
          {questions.map((question, index) => (
            <Card key={index} className="p-6 space-y-4 bg-slate-50">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-700">Question {index + 1}</h3>
                <Button type="button" variant="ghost" size="icon" onClick={() => deleteQuestion(index)} aria-label="Delete question">
                  <Trash2 className="h-5 w-5 text-red-500" />
                </Button>
              </div>
              <div>
                <label htmlFor={`question-${index}-text`} className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                <Input
                  id={`question-${index}-text`}
                  type="text"
                  value={question.question}
                  onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                  placeholder="Enter the question"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Image (Optional)</label>
                <div className="mt-1 flex items-center">
                  <Image 
                    src={question.imageFile ? URL.createObjectURL(question.imageFile) : question.imageUrl} 
                    alt={`Question ${index + 1} Image`} 
                    width={100} 
                    height={100} 
                    className="h-24 w-24 object-cover rounded-md mr-4" 
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => openImageModal(index)}>
                    {question.imageUrl === PLACEHOLDER_IMAGE && !question.imageFile ? 'Add Image' : 'Change Image'}
                  </Button>
                </div>
              </div>

              {/* Render specific form based on question type */}
              {renderQuestionForm(index)}
              
            </Card>
          ))}

          {typeConfirmed && (
            <Button type="button" variant="outline" onClick={addQuestion} className="mt-4 w-full">
              Add Another Question
            </Button>
          )}
        </>
      )}

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSubmitting} className="bg-pink-500 hover:bg-pink-600 text-white text-lg px-8 py-3">
          {isSubmitting ? 'Submitting...' : (mode === 'edit' ? 'Update Quiz' : 'Create Quiz')}
        </Button>
      </div>

      <ImageSelectModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onImageSelect={handleImageSelect}
      />
    </form>
  )
}
