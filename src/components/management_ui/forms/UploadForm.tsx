'use client'

import { useState, useEffect } from 'react'
import { QuestionType } from '@/types/question_types'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import { parse } from 'csv-parse/sync'

// Assuming Question interface is available (e.g., from CreatePage or a shared types file)
// If not, define it here or import it.
// For this example, let's assume it's similar to the one in CreatePage/QuizForm
interface Question {
  id?: string;
  question: string;
  answers: string[];
  correctAnswer: string;
  imageUrl: string;
  imageFile: File | null;
  type: QuestionType;
}

// Define the shape of a raw CSV row after parsing with headers
interface CsvRow {
  question: string;
  answer1?: string;
  answer2?: string;
  answer3?: string;
  answer4?: string; // Assuming up to 4 answers for multiple choice
  correctAnswer: string;
  type?: string; // Optional type from CSV
  imageUrl?: string; // Optional imageUrl from CSV
  // Add other potential CSV columns as needed
}

interface UploadFormProps {
  quizOverallType: QuestionType; // To set default type for parsed questions
  onAddQuestions: (newlyParsedQuestions: Question[]) => void; // Callback to add questions to parent
  className?: string;
}

const PLACEHOLDER_IMAGE_UPLOAD = '/images/placeholder.webp'

export default function UploadForm({
  quizOverallType,
  onAddQuestions,
  className
}: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (success) {
      timeoutId = setTimeout(() => {
        setSuccess(false); // Reset success message
        setFile(null); // Clear the file input
        // Optionally, clear the visual file input display if you have one
        const fileInput = document.getElementById('csv-upload-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }, 3000);
    }
    return () => clearTimeout(timeoutId);
  }, [success]);

  const handleFileParseAndAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError('Please provide a CSV file.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const csvString = buffer.toString('utf-8');
      
      // Parse CSV content
      // Ensure your CSV has headers that match CsvRow interface keys, or adjust parsing options.
      const parsedRows = parse(csvString, {
        columns: true, // Assumes first row is header
        skip_empty_lines: true,
        trim: true,
      }) as CsvRow[];

      if (!parsedRows || parsedRows.length === 0) {
        throw new Error("CSV file is empty or could not be parsed correctly.");
      }

      // Transform parsedRows to Question[]
      const newQuestions: Question[] = parsedRows.map((row, index) => {
        const answers = [row.answer1, row.answer2, row.answer3, row.answer4]
          .filter(ans => ans !== undefined && ans !== null && ans.trim() !== '') as string[];
        
        let questionTypeFromCsv: QuestionType | undefined;
        if (row.type && Object.values(QuestionType).includes(row.type.toUpperCase().replace(/ /g, '_') as QuestionType)) {
          questionTypeFromCsv = row.type.toUpperCase().replace(/ /g, '_') as QuestionType;
        }

        return {
          // id is not generated here; parent will handle if it's for a new quiz
          question: row.question || `Question from CSV row ${index + 1}`,
          answers: answers.length > 0 ? answers : ['Default Answer'], // Ensure answers array is not empty for some types
          correctAnswer: row.correctAnswer || '',
          imageUrl: row.imageUrl || PLACEHOLDER_IMAGE_UPLOAD,
          imageFile: null, // Files from CSV are not handled here, expect URLs or placeholders
          type: questionTypeFromCsv || quizOverallType,
        };
      });

      onAddQuestions(newQuestions); // Pass new questions to the parent
      setSuccess(true);
      // setFile(null); // Clear file after successful processing - moved to useEffect for timed reset

    } catch (err) {
      console.error("Error parsing CSV or adding questions:", err);
      setError(err instanceof Error ? err.message : 'Failed to process CSV file. Please check format and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col w-full gap-4 items-center align-middle max-w-4xl ${className || ''}`}>
      {success && ( // Simplified success message
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 " role="alert">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> Questions from the CSV have been added.</span>
        </div>
      )}
      {/* Keep form tag for structure and onSubmit */}
      <form onSubmit={handleFileParseAndAdd} className="space-y-6 flex flex-col p-4 w-full">
        <div className='flex flex-col gap-2'>
          <label htmlFor="csv-upload-input" className="block text-lg mb-3 font-medium text-gray-800">
            Select CSV File to Add Questions
          </label>
          <div className='flex gap-2'>
            <Input
                type="file"
                id="csv-upload-input" // Unique ID for the input
                accept=".csv"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setError(null); // Clear previous error on new file selection
                setSuccess(false); // Clear previous success message
              }}
              className="w-full h-full text-sm text-gray-600
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-violet-100 file:text-violet-700
                hover:file:bg-violet-200 hover:bg-violet-50 transition-colors cursor-pointer
                border border-violet-400 shadow-[4px_4px_0px_0px_#8b5cf6)]
                p-0
                "
              required
            />
            <button
              type="submit"
              disabled={loading || !file} // Removed warmingUp and success from disabled condition here
              className="w-full inline-flex items-center justify-center px-4 border-transparent text-base font-medium rounded-md text-violet-700 bg-violet-200 shadow-[4px_4px_0px_0px_#6366f1] hover:bg-violet-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-white disabled:text-gray-400 border  border-violet-400 disabled:shadow-[4px_4px_0px_0px_#6366f1] transition-colors"
              >
              {loading ? 'Processing CSV...' : 'Add Questions from CSV'}
            </button>
          </div>
 
          <p className="mt-1 text-xs text-gray-500">Expected CSV columns: question, answer1, answer2, answer3, answer4, correctAnswer, type (optional), imageUrl (optional).</p>

        </div>
        {error && <p className="text-red-500 text-sm mt-2">Error: {error}</p>}

        <div className='w-full flex justify-center'>
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
        </div>

      </form>
    </div>
  )
}