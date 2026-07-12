import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { QuestionType } from '@/types/question_types';
import wordlistData from '@/json/wordlist.json';
import macmillanData from '@/json/macmillan_academy_stars .json';
import cambridgeData from '@/json/cambridge_primary_path.json';
import { requireAuth, isUnauthorized } from '@/lib/auth';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_QUIZ_API_KEY!);

interface GenerateQuestionsRequest {
  tags: string[];
  level: string;
  unit?: string;
  book?: string;
  questionType: QuestionType;
  numberOfQuestions: number;
  quizTitle: string;
  quizDescription: string;
  language: string;
}

interface GeneratedQuestion {
  question: string;
  answers: string[];
  correctAnswer: string;
  type: QuestionType;
  imageUrl: string;
  imageFile: File | null;
}

// Helper function to get vocabulary based on level and tags
function getVocabularyForLevel(level: string, tags: string[]): string[] {
  const levelMap: { [key: string]: string } = {
    'PRE_A1': 'Starters',
    'A1': 'Movers', 
    'A2': 'Flyers'
  };

  const wordlistLevel = levelMap[level] || 'Starters';
  const levelData = wordlistData[wordlistLevel as keyof typeof wordlistData];
  
  if (!levelData) return [];

  // Filter vocabulary based on selected tags
  const relevantWords: string[] = [];
  
  tags.forEach(tag => {
    // Map tags to wordlist categories
    const categoryMap: { [key: string]: string } = {
      'Nouns': 'Nouns',
      'Verbs': 'Verbs regular',
      'Adjectives': 'Adjectives',
      'Grammar': 'Grammar',
      'Animals': 'Nouns', // Animals are typically nouns
      'Food': 'Nouns',
      'Family': 'Nouns',
      'Colors': 'Adjectives',
      'Numbers': 'Nouns'
    };

    const category = categoryMap[tag] || 'Nouns';
    if (levelData[category as keyof typeof levelData]) {
      relevantWords.push(...(levelData[category as keyof typeof levelData] as string[]));
    }
  });

  return relevantWords.slice(0, 50); // Limit to 50 words for context
}

// Helper function to get book/unit content
function getBookUnitContent(book: string, unit: string): Record<string, unknown> | null {
  if (book.startsWith('academy_stars')) {
    const bookIndex = book === 'academy_stars_starters' ? 0 : 
                     book === 'academy_stars_1' ? 1 :
                     book === 'academy_stars_2' ? 2 :
                     book === 'academy_stars_3' ? 3 : 4;
    
    if (macmillanData[bookIndex] && macmillanData[bookIndex][parseInt(unit) - 1]) {
      return macmillanData[bookIndex][parseInt(unit) - 1];
    }
  } else if (book === 'cambridge_primary_path') {
    if (cambridgeData[parseInt(unit) - 1]) {
      return cambridgeData[parseInt(unit) - 1];
    }
  }
  return null;
}

// Create prompt for multiple choice questions
function createMultipleChoicePrompt(
  vocabulary: string[],
  level: string,
  tags: string[],
  quizTitle: string,
  quizDescription: string,
  numberOfQuestions: number,
  bookContent?: Record<string, unknown>
): string {
  const levelDescriptions = {
    'PRE_A1': 'Pre-A1 (Starters) - Very basic English for young learners',
    'A1': 'A1 (Movers) - Basic English for elementary learners', 
    'A2': 'A2 (Flyers) - Elementary English for young learners'
  };

  const levelDesc = levelDescriptions[level as keyof typeof levelDescriptions] || levelDescriptions['PRE_A1'];

  const prompt = `You are an expert ESL teacher creating multiple choice questions for ${levelDesc} level students.

CONTEXT:
- Quiz Title: "${quizTitle}"
- Quiz Description: "${quizDescription}"
- Target Level: ${levelDesc}
- Focus Areas: ${tags.join(', ')}
- Available Vocabulary: ${vocabulary.slice(0, 20).join(', ')} (and more)

REQUIREMENTS:
1. Create exactly ${numberOfQuestions} multiple choice questions
2. Each question should have 4 answer options (A, B, C, D)
3. Only ONE correct answer per question
4. Use vocabulary appropriate for ${level} level
5. Questions should test understanding of: ${tags.join(', ')}
6. Make questions engaging and educational
7. Use simple, clear language appropriate for the level

${bookContent ? `
BOOK CONTEXT:
- Book: ${bookContent.vocabulary || 'General vocabulary'}
- Grammar Focus: ${bookContent.grammar || 'General grammar'}
- Examples: ${bookContent.examples || 'General examples'}
` : ''}

OUTPUT FORMAT:
Return a JSON array with this exact structure:
[
  {
    "question": "What color is the sun?",
    "answers": ["A) Blue", "B) Yellow", "C) Green", "D) Red"],
    "correctAnswer": "B) Yellow"
  }
]

IMPORTANT:
- Use ONLY the vocabulary provided
- Keep questions simple and clear
- Ensure correct answers are obvious to students at this level
- Make wrong answers plausible but clearly incorrect
- Return ONLY the JSON array, no other text`;

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isUnauthorized(authResult)) return authResult;

    const body: GenerateQuestionsRequest = await request.json();
    
    const {
      tags,
      level,
      unit,
      book,
      questionType,
      numberOfQuestions,
      quizTitle,
      quizDescription,
      language: _language // eslint-disable-line @typescript-eslint/no-unused-vars
    } = body;

    // Validate required fields
    if (!tags || tags.length === 0) {
      return NextResponse.json(
        { error: 'At least one tag is required' },
        { status: 400 }
      );
    }

    if (!level) {
      return NextResponse.json(
        { error: 'Level is required' },
        { status: 400 }
      );
    }

    if (numberOfQuestions < 1 || numberOfQuestions > 20) {
      return NextResponse.json(
        { error: 'Number of questions must be between 1 and 20' },
        { status: 400 }
      );
    }

    // Get vocabulary for the specified level and tags
    const vocabulary = getVocabularyForLevel(level, tags);
    
    // Get book/unit content if specified
    let bookContent: Record<string, unknown> | undefined = undefined;
    if (book && unit) {
      bookContent = getBookUnitContent(book, unit) || undefined;
    }

    // Create the prompt based on question type
    let prompt: string;
    
    if (questionType === QuestionType.MULTIPLE_CHOICE) {
      prompt = createMultipleChoicePrompt(
        vocabulary,
        level,
        tags,
        quizTitle,
        quizDescription,
        numberOfQuestions,
        bookContent
      );
    } else {
      return NextResponse.json(
        { error: 'Only multiple choice questions are currently supported' },
        { status: 400 }
      );
    }

    // Generate questions using Gemini AI
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let generatedQuestions: Record<string, unknown>[];
    try {
      // Clean the response text (remove any markdown formatting)
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      generatedQuestions = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', text);
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      );
    }

    // Validate and format the generated questions
    const formattedQuestions: GeneratedQuestion[] = generatedQuestions.map((q: Record<string, unknown>, index: number) => ({
      question: (q.question as string) || `Generated question ${index + 1}`,
      answers: (q.answers as string[]) || ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4'],
      correctAnswer: (q.correctAnswer as string) || 'A) Option 1',
      type: QuestionType.MULTIPLE_CHOICE,
      imageUrl: '/images/placeholder.webp',
      imageFile: null
    }));

    return NextResponse.json({
      success: true,
      questions: formattedQuestions,
      metadata: {
        level,
        tags,
        book,
        unit,
        numberOfQuestions: formattedQuestions.length
      }
    });

  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions. Please try again.' },
      { status: 500 }
    );
  }
}
