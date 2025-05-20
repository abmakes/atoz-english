'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QuestionType } from '@/types/question_types'

interface UploadFormProps {
  quizTitle: string;
  quizDescription?: string;
  quizCoverImageUrl?: string;
  quizOverallType: QuestionType;
  quizTags?: string[];
  className?: string;
}

export default function UploadForm({
  quizTitle,
  quizDescription,
  quizCoverImageUrl,
  quizOverallType,
  quizTags,
  className
}: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [warmingUp, setWarmingUp] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (success) {
      timeoutId = setTimeout(() => {
        router.push('/quizzes')
      }, 3000)
    }
    return () => clearTimeout(timeoutId)
  }, [success, router])

  const warmupDatabase = async () => {
    try {
      console.log('Warming up database...');
      setWarmingUp(true);
      
      const response = await fetch('/api/warmup');
      const data = await response.json();
      
      console.log('Database warm-up result:', data);
      return true;
    } catch (error) {
      console.error('Database warm-up failed:', error);
      return false;
    } finally {
      setWarmingUp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) {
      setError('Please provide a CSV file.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await warmupDatabase();
      
      const formData = new FormData()
      formData.append('title', quizTitle)
      if (quizDescription) {
        formData.append('description', quizDescription)
      }
      if (quizCoverImageUrl) {
        formData.append('quizCoverImageUrl', quizCoverImageUrl)
      }
      formData.append('quizType', quizOverallType)
      if (quizTags && quizTags.length > 0) {
        quizTags.forEach(tag => formData.append('tags[]', tag))
      }
      
      formData.append('csv', file)

      const response = await fetch('/api/upload-quiz', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload quiz');
      }

      const result = await response.json()
      console.log('Upload successful, result:', result)
      setSuccess(true)
    } catch (error) {
      console.error(error)
      setError(error instanceof Error ? error.message : 'Failed to upload quiz. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`flex flex-col w-full gap-4 items-center align-middle max-w-4xl ${className ? className : ''}`}>
      <h2 className="text-xl font-semibold mb-2">Uploading CSV for: {quizTitle}</h2>
      <p className="text-sm text-gray-600 mb-1">Quiz Type: {quizOverallType.replace('_', ' ')}</p>
      {quizDescription && <p className="text-sm text-gray-600 mb-1">Description: {quizDescription}</p>}
      {quizTags && quizTags.length > 0 && (
        <p className="text-sm text-gray-600 mb-4">Tags: {quizTags.join(', ')}</p>
      )}
      {success ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 " role="alert">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> Your quiz &quot;{quizTitle}&quot; has been uploaded. Redirecting...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 p-4 border rounded-lg shadow">
          <div>
            <label htmlFor="csv" className="block text-md font-medium text-gray-800">
              Select CSV File to Upload
            </label>
            <input
              type="file"
              id="csv"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-2 block w-full text-sm text-gray-600
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-violet-100 file:text-violet-700
                hover:file:bg-violet-200 transition-colors cursor-pointer"
              required
            />
            <p className="mt-1 text-xs text-gray-500">Ensure your CSV format is correct (e.g., Question,Answer1,Answer2,...,CorrectAnswer,ImageType,ImageURL).</p>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">Error: {error}</p>}
          <button
            type="submit"
            disabled={loading || success || warmingUp || !file}
            className="w-full inline-flex justify-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 transition-colors"
          >
            {loading ? 'Uploading...' : warmingUp ? 'Preparing Database...' : 'Upload Quiz CSV'}
          </button>
        </form>
      )}
    </div>
  )
}