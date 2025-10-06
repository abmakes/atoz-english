'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { TagDrawer } from '@/components/management_ui/TagDrawer'
import { ALL_TAG_CATEGORIES } from '@/lib/tags'
import { QuestionType } from '@/types/question_types'
import { useCustomToast } from '@/components/ui/CustomToast'
import { Sparkles, Loader2, BookOpen, Users, Target } from 'lucide-react'
import type { Question } from '@/components/management_ui/QuizEditor'
import macmillanData from '@/json/macmillan_academy_stars .json'
import cambridgeData from '@/json/cambridge_primary_path.json'
import { Badge } from '@/components/ui/badge'

interface AIGenerationFormProps {
  onQuestionsGenerated: (questions: Question[]) => void
  quizType: QuestionType
  quizTitle: string
  quizDescription: string
  existingTags: string[]
}

// Book and unit data structure
const BOOKS = [
  {
    id: 'academy_stars_starters',
    name: 'Academy Stars Starters',
    units: 8
  },
  {
    id: 'academy_stars_1',
    name: 'Academy Stars 1',
    units: 10
  },
  {
    id: 'academy_stars_2',
    name: 'Academy Stars 2',
    units: 10
  },
  {
    id: 'academy_stars_3',
    name: 'Academy Stars 3',
    units: 10
  },
  {
    id: 'academy_stars_4',
    name: 'Academy Stars 4',
    units: 10
  },
  {
    id: 'cambridge_primary_path',
    name: 'Cambridge Primary Path',
    units: 9
  }
]

// Unit names for each book
const UNIT_NAMES = {
  academy_stars_starters: [
    'Numbers and personal questions',
    'Feelings',
    'Classroom objects',
    'Colours',
    'Clothes',
    'Parts of the face and body',
    'Family members',
    'Farm animals'
  ],
  academy_stars_1: [
    'People, Describing words',
    'Classroom objects',
    'Family members',
    'Feelings',
    'Action verbs',
    'Play things',
    'Parts of the body',
    'Clothes',
    'Furniture',
    'Food'
  ],
  academy_stars_2: [
    'Animals, Countries',
    'Days of the week, Activities',
    'Personal possessions',
    'Buildings, Places',
    'Weather and natural features',
    'Transport',
    'Seasons, Activities',
    'Fruits, Vegetables',
    'Rooms, Furniture',
    'Places in a town'
  ],
  academy_stars_3: [
    'School subjects, Rooms and activities',
    'Chores and free time, Buildings and breakfast',
    'Places around town, Adjectives to describe people',
    'Food and tableware, Safari',
    'Family and musical instruments, Action verbs',
    'Sea animals, Adjectives',
    'Stories and fairy tales, Past simple irregular verbs',
    'Objects in a history museum, Materials and objects',
    'Sports clothes and equipment, Healthy eating',
    'Months and dates, Festivals, Languages'
  ],
  academy_stars_4: [
    'The world around us',
    'Prepositions of movement',
    'Bikes and cycling',
    'Jobs, Adjectives, Animals',
    'At the doctor\'s, Adjectives and verbs',
    'The natural world, Verbs and pronouns',
    'Technology, Inventions',
    'Parts of plants and animals, Science and technology',
    'Using water, The water cycle',
    'Physical descriptions, Pronouns and detective words'
  ],
  cambridge_primary_path: [
    'Family members',
    'School-related terms',
    'Living things',
    'Friendship activities',
    'Fun activities',
    'Community service terms',
    'Plants and animals',
    'Imaginative concepts',
    'Clothing terms'
  ]
}

const CEFR_LEVELS = [
  { value: 'PRE_A1', label: 'Pre-A1 (Starters)', description: 'Very basic English for young learners' },
  { value: 'A1', label: 'A1 (Movers)', description: 'Basic English for elementary learners' },
  { value: 'A2', label: 'A2 (Flyers)', description: 'Elementary English for young learners' }
]

export default function AIGenerationForm({
  onQuestionsGenerated,
  quizType,
  quizTitle,
  quizDescription,
  existingTags
}: AIGenerationFormProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(existingTags)
  const [selectedLevel, setSelectedLevel] = useState<string>('PRE_A1')
  const [selectedBook, setSelectedBook] = useState<string>('')
  const [selectedUnit, setSelectedUnit] = useState<string>('')
  const [selectedUnitData, setSelectedUnitData] = useState<{
    vocabulary: string;
    grammar: string;
    examples: string;
    language_in_use: string;
  } | null>(null)
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(5)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const { addToast } = useCustomToast()

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleBookChange = (bookId: string) => {
    setSelectedBook(bookId === 'none' ? '' : bookId)
    setSelectedUnit('') // Reset unit when book changes
    setSelectedUnitData(null) // Reset unit data
  }

  const handleUnitChange = (unitIndex: string) => {
    if (unitIndex === 'any') {
      setSelectedUnit('')
      setSelectedUnitData(null)
      return
    }

    const unitNum = parseInt(unitIndex)
    setSelectedUnit(unitIndex)
    
    // Get unit data from the JSON files
    if (selectedBook.startsWith('academy_stars')) {
      const bookIndex = selectedBook === 'academy_stars_starters' ? 0 : 
                       selectedBook === 'academy_stars_1' ? 1 :
                       selectedBook === 'academy_stars_2' ? 2 :
                       selectedBook === 'academy_stars_3' ? 3 : 4
      
      if (macmillanData[bookIndex] && macmillanData[bookIndex][unitNum - 1]) {
        setSelectedUnitData(macmillanData[bookIndex][unitNum - 1])
      }
    } else if (selectedBook === 'cambridge_primary_path') {
      if (cambridgeData[unitNum - 1]) {
        setSelectedUnitData(cambridgeData[unitNum - 1])
      }
    }
  }

  const getAvailableUnits = () => {
    if (!selectedBook) return []
    const unitNames = UNIT_NAMES[selectedBook as keyof typeof UNIT_NAMES] || []
    return unitNames.map((name, index) => ({
      value: (index + 1).toString(),
      label: `U${index + 1} - ${name}`
    }))
  }

  const handleGenerateQuestions = async () => {
    if (selectedTags.length === 0) {
      addToast('Please select at least one tag', { variant: 'error', position: 'top-center' })
      return
    }

    if (!selectedLevel) {
      addToast('Please select a CEFR level', { variant: 'error', position: 'top-center' })
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags: selectedTags,
          level: selectedLevel,
          unit: selectedUnit || undefined,
          book: selectedBook || undefined,
          questionType: quizType,
          numberOfQuestions,
          quizTitle,
          quizDescription,
          language: 'English'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate questions')
      }

      const result = await response.json()
      
      if (result.success && result.questions) {
        onQuestionsGenerated(result.questions)
        addToast(`Successfully generated ${result.questions.length} questions!`, { 
          variant: 'success', 
          position: 'top-center' 
        })
      } else {
        throw new Error('Invalid response from AI service')
      }

    } catch (error) {
      console.error('Error generating questions:', error)
      addToast(`Failed to generate questions: ${error instanceof Error ? error.message : 'Unknown error'}`, { 
        variant: 'error', 
        position: 'top-center' 
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[--text-color] mb-2 flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-[--primary-accent]" />
          AI Question Generator
        </h2>
        <p className="text-gray-600">
          Generate multiple choice questions based on your quiz content and selected criteria
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* All Form Elements in One Card */}
        <Card className="p-4">
          <div className="space-y-4">
            {/* CEFR Level Selection */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
                <Target className="h-5 w-5 text-[--primary-accent]" />
                <Label className="text-base font-semibold whitespace-nowrap">CEFR Level:</Label>
              </div>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-full max-w-64 bg-white">
                  <SelectValue placeholder="Select CEFR level" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {CEFR_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div>
                        <div className="font-medium">{level.label}</div>
                        <div className="text-sm text-gray-500">{level.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Book Selection */}
            <div className="flex flex-row items-center gap-3">
              <div className="flex w-full items-center gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
                  <BookOpen className="h-5 w-5 text-[--primary-accent]" />
                  <Label className="text-base font-semibold whitespace-nowrap">Book:</Label>
                </div>
                <Select value={selectedBook || 'none'} onValueChange={handleBookChange}>
                  <SelectTrigger className="w-full max-w-64 bg-white">
                    <SelectValue placeholder="Select a book" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="none">No specific book</SelectItem>
                    {BOOKS.map((book) => (
                      <SelectItem key={book.id} value={book.id}>
                        {book.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Unit Selection */}
              {selectedBook && (
              <div className="flex w-full items-center gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
                    <Label className="text-base font-semibold whitespace-nowrap">Unit:</Label>
                </div>
                <Select value={selectedUnit || 'any'} onValueChange={handleUnitChange}>
                  <SelectTrigger className="w-full max-w-64 bg-white">
                    <SelectValue placeholder="Select a unit" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="any">Any unit</SelectItem>
                    {getAvailableUnits().map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              )}
            </div>

            {/* Number of Questions */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
                <Users className="h-5 w-5 text-[--primary-accent]" />
                <Label className="text-base font-semibold whitespace-nowrap">Questions:</Label>
              </div>
              <div className="flex w-full flex-row items-center">
                <span className="text-sm text-gray-600 pr-2 pt-1">1</span>
                <Slider
                  value={[numberOfQuestions]}
                  onValueChange={(value) => setNumberOfQuestions(value[0])}
                  max={20}
                  min={1}
                  step={1}
                  className="w-full bg-[var(--primary-light)] border border-[var(--border-dark)] rounded-lg shadow-[2px_2px_0px_0px_var(--border-dark)]"
                />
                <span className="text-sm text-gray-600 pl-2 pt-1">20</span>
              </div>
            </div>

            {/* Tag Selection */}
            <div className="flex flex-row items-center gap-3">
              <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
                <Label className="text-base font-semibold whitespace-nowrap">Tags:</Label>
              </div>
              <div className="flex flex-row items-center w-full">
                <TagDrawer
                  allTags={ALL_TAG_CATEGORIES}
                  selectedTags={selectedTags}
                  onTagToggle={handleTagToggle}
                  triggerElement={
                    <Button variant="outline" className="w-full max-w-40">
                      Select Tags
                    </Button>
                  }
                  title="Select Tags for AI Generation"
                  description="Choose tags that will help the AI generate relevant questions for your quiz."
                />
                <div className="pl-2 flex w-full justify-start items-center text-sm text-gray-600">
                  <div className="flex justify-start flex-wrap w-full gap-2 items-center">
                    {selectedTags.length > 0 ? (
                      selectedTags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="cursor-pointer px-2 pt-1 h-6 text-sm transition-all text-nowrap text-[--text-color] duration-150 border-[--primary-accent] shadow-[2px_2px_0px_0px_var(--primary-accent-hover)] ease-in-out hover:shadow-md">
                          {tag}
                          <button 
                            type="button"
                            onClick={() => handleTagToggle(tag)} 
                            className="ml-2 text-xs font-bold hover:text-red-500"
                          >
                            &times;
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No tags selected yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Quiz Context Display */}
        <Card className="p-4 bg-gray-50">
          <Label className="text-lg font-semibold mb-3 block">Quiz Context</Label>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Title:</span> {quizTitle || 'No title set'}
            </div>
            <div>
              <span className="font-medium">Description:</span> {quizDescription || 'No description set'}
            </div>
            <div>
              <span className="font-medium">Type:</span> {quizType.replace(/_/g, ' ')}
            </div>
            <div>
              <span className="font-medium">Level:</span> {CEFR_LEVELS.find(l => l.value === selectedLevel)?.label}
            </div>
            <div>
              <span className="font-medium">Tags:</span> {selectedTags.length > 0 ? selectedTags.join(', ') : 'None selected'}
            </div>
            {selectedBook && (
              <div>
                <span className="font-medium">Book:</span> {BOOKS.find(b => b.id === selectedBook)?.name}
              </div>
            )}
            {selectedUnit && selectedUnitData && (
              <div className="mt-3 p-3 bg-white rounded-lg border">
                <div className="font-medium mb-2">Unit Details:</div>
                <div className="space-y-1 text-xs">
                  <div><strong>Unit:</strong> U{selectedUnit} - {getAvailableUnits().find(u => u.value === selectedUnit)?.label.split(' - ')[1]}</div>
                  <div><strong>Vocabulary:</strong> {selectedUnitData.vocabulary}</div>
                  <div><strong>Grammar:</strong> {selectedUnitData.grammar}</div>
                  <div><strong>Examples:</strong> {selectedUnitData.examples}</div>
                  <div><strong>Language in Use:</strong> {selectedUnitData.language_in_use}</div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleGenerateQuestions}
          disabled={isGenerating || selectedTags.length === 0}
          className="bg-[--primary-accent] hover:bg-[--primary-accent-hover] text-white px-8 py-3 text-lg font-semibold"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Generating Questions...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Generate {numberOfQuestions} Question{numberOfQuestions !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </div>

      {/* Generation Info */}
      <div className="text-center text-sm text-gray-600">
        <p>
          Questions will be generated based on your selected level ({CEFR_LEVELS.find(l => l.value === selectedLevel)?.label}), 
          tags ({selectedTags.join(', ')}), and quiz context.
        </p>
        {selectedBook && (
          <p className="mt-1">
            Using content from {BOOKS.find(b => b.id === selectedBook)?.name}
            {selectedUnit && selectedUnitData && ` - U${selectedUnit}: ${getAvailableUnits().find(u => u.value === selectedUnit)?.label.split(' - ')[1]}`}
          </p>
        )}
      </div>
    </div>
  )
}
