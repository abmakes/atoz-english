'use client'

import { useState, useCallback } from 'react'
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

interface Question {
  id?: string
  question: string
  answers: string[]
  correctAnswer: string
  imageUrl: string
  imageFile: File | null
  type?: QuestionType
}

interface QuizFormProps {
  quizId?: string;
  initialData?: {
    title: string;
    imageUrl: string;
    questions: Question[];
  };
}

const PLACEHOLDER_IMAGE = '/images/placeholder.webp'

export default function QuizForm({ quizId, initialData }: QuizFormProps = {}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || '');
  const [quizImageUrl, setQuizImageUrl] = useState(initialData?.imageUrl || PLACEHOLDER_IMAGE);
  const [quizImageFile, setQuizImageFile] = useState<File | null>(null);
  
  // Determine initial question type based on first question in initialData if available
  const initialQuestionType = initialData?.questions?.[0]?.type || undefined;
  const [questionType, setQuestionType] = useState<QuestionType | undefined>(initialQuestionType);
  const [typeConfirmed, setTypeConfirmed] = useState(!!initialData?.questions?.length);
  
  // Initialize with empty questions array or from initialData
  const [questions, setQuestions] = useState<Question[]>(initialData?.questions || []);
  
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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (questions.length < 1) { // Reduced minimum for testing
      alert('Please add at least 1 question.');
      return;
    }

    // Validate correct answers match the answer options for multiple choice questions
    const invalidQuestions = questions
      .filter(q => q.type === QuestionType.MULTIPLE_CHOICE)
      .map((q, index) => ({ 
        question: q, 
        index: index,
        valid: q.answers.includes(q.correctAnswer)
      }))
      .filter(item => !item.valid);

    if (invalidQuestions.length > 0) {
      const invalidQuestionNumbers = invalidQuestions.map(q => q.index + 1).join(', ');
      alert(`Error: The correct answer doesn't match any of the provided options in question(s) ${invalidQuestionNumbers}. Please make sure the correct answer exactly matches one of the options.`);
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      
      formData.append('quizImage', quizImageFile || new Blob());
      formData.append('quizImageUrl', quizImageUrl);
      
      // Add question type to form data
      if (questionType) {
        formData.append('questionType', questionType);
      }
      
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        formData.append(`questions[${i}][question]`, question.question);
        formData.append(`questions[${i}][correctAnswer]`, question.correctAnswer);
        formData.append(`questions[${i}][type]`, question.type || questionType || QuestionType.MULTIPLE_CHOICE);
        
        question.answers.forEach((answer, j) => {
          formData.append(`questions[${i}][answers][${j}]`, answer);
        });
        
        formData.append(`questions[${i}][image]`, question.imageFile || new Blob());
        formData.append(`questions[${i}][imageUrl]`, question.imageUrl);
      }
  
      const url = quizId ? `/api/quizzes/${quizId}` : '/api/quizzes';
      const method = quizId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        body: formData,
      });
      if (response.ok) {
        router.push('/');
      } else {
        throw new Error(`Failed to ${quizId ? 'update' : 'create'} quiz`);
      }
    } catch (error) {
      console.error(`Failed to ${quizId ? 'update' : 'create'} quiz:`, error);
    }
  }, [title, quizImageFile, quizImageUrl, questions, quizId, router, questionType]);

  // If editing, don't allow changing question type
  const isEditing = !!quizId;

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

  return (
    <form onSubmit={handleSubmit} className="container max-w-[1100px] w-full space-y-4">
      <div className="flex flex-col bg-white border border-black p-6 rounded-lg shadow-solid">
        <h3 className='font-bold ml-2 -mt-2 mb-2'>Quiz Title</h3>
        <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Quiz Title"
            required
            className="flex max-w-screen-sm"
          />
          <div className="flex items-center space-x-4">
            <Button type="button" onClick={() => openImageModal()}>
              Select Image
            </Button>
            <Image
              src={quizImageUrl}
              unoptimized
              alt="Quiz image preview"
              width={50}
              height={50}
              className="object-cover rounded h-12"
            />
          </div>
        </div>
      </div>
      
      {/* Question Type Selector - disabled when editing or after selection */}
      <div className="flex flex-col bg-white border border-black p-6 rounded-lg shadow-solid">
        <div className="flex justify-between items-center mb-4">
          <h3 className='font-bold ml-2 -mt-2'>Quiz Type</h3>
          {typeConfirmed && !isEditing && (
            <Button variant="outline" size="sm" onClick={resetQuizType} className="text-red-500 border-red-200 hover:bg-red-50">
              Reset Quiz Type
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Select the type of questions for this quiz. All questions in the quiz will be of this type.
          {typeConfirmed && !isEditing && " You've confirmed your selection and can't change it without resetting."}
        </p>
        
        <RadioGroup 
          value={questionType} 
          onValueChange={(value) => !typeConfirmed && setQuestionType(value as QuestionType)}
          disabled={isEditing || typeConfirmed}
          className="flex flex-wrap gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={QuestionType.MULTIPLE_CHOICE} id="multiple-choice" />
            <Label htmlFor="multiple-choice">Multiple Choice</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={QuestionType.MATCHING} id="matching" />
            <Label htmlFor="matching">Matching</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={QuestionType.SORTING} id="sorting" />
            <Label htmlFor="sorting">Sorting</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={QuestionType.TRUE_FALSE} id="true-false" />
            <Label htmlFor="true-false">True/False</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={QuestionType.SHORT_ANSWER} id="short-answer" />
            <Label htmlFor="short-answer">Short Answer</Label>
          </div>
        </RadioGroup>
        
        {!typeConfirmed && !isEditing && questionType && (
          <Button className="mt-4" onClick={confirmQuestionType}>
            Confirm Question Type
          </Button>
        )}
        
        {isEditing && (
          <p className="text-sm text-gray-500 mt-2">Question type cannot be changed when editing an existing quiz.</p>
        )}
      </div>
      
      {questions.map((q, qIndex) => (
        <div key={qIndex} className="space-y-2 border bg-white border-black p-6 rounded-lg relative shadow-solid">
          <h3 className='font-bold ml-2 -my-2'>Question {qIndex + 1}</h3>
          <div className="grid md:grid-cols-2 gap-2">
            <div className="flex justify-between items-center">
              <Input
                type="text"
                value={q.question}
                onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                placeholder="Question"
                required
              />
            </div>
            <div className="flex items-center space-x-4">
              <Button type="button" onClick={() => openImageModal(qIndex)}>
                Select Image
              </Button>
              <Image
                src={q.imageUrl}
                alt="Question image preview"
                width={100}
                height={100}
                className="object-cover rounded h-12"
                unoptimized
              />
            </div>
          </div>
          
          {/* Use the question's type or the selected type */}
          {renderQuestionForm(qIndex)}
          
        </div>
      ))}
      
      {(typeConfirmed || isEditing) && (
        <>
      <Button className="mx-6" type="button" onClick={addQuestion}>Add More Questions</Button>
      <Button type="submit">{quizId ? 'Update' : 'Create'} Quiz</Button>
        </>
      )}
      
      <ImageSelectModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onImageSelect={handleImageSelect}
      />
    </form>
  )
}
