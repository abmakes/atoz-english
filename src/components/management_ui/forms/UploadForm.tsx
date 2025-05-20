'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UploadForm() {
  const [title, setTitle] = useState('')
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
        router.push('/') // Redirect to home page after showing success message
      }, 3000) // Wait for 3 seconds before redirecting
    }
    return () => clearTimeout(timeoutId)
  }, [success, router])

  // Function to warm up the database
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
    if (!file || !title) {
      setError('Please provide both a title and a CSV file.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // First, attempt to warm up the database
      await warmupDatabase();
      
      // Now proceed with the upload
      const formData = new FormData()
      formData.append('title', title)
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
      console.log(result)
      setSuccess(true)
      // Note: We're not immediately redirecting here anymore
    } catch (error) {
      console.error(error)
      setError(error instanceof Error ? error.message : 'Failed to upload quiz. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex flex-col w-full gap-4 items-center align-middle max-w-4xl'>
      {success ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 " role="alert">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> Your quiz has been uploaded. Redirecting to home page...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-md font-medium text-black">
              Quiz Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block text-md p-2 w-full max-w-[700px] rounded-md border border-gray-400 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
            />
          </div>
          <div>
            <label htmlFor="csv" className="block text-sm font-medium text-gray-700">
              CSV File
            </label>
            <input
              type="file"
              id="csv"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-violet-50 file:text-violet-700
                hover:file:bg-violet-100"
              required
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading || success || warmingUp}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md shadow-solid text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {loading ? 'Uploading...' : warmingUp ? 'Preparing Database...' : 'Upload Quiz'}
          </button>
        </form>
      )}
    </div>
  )
}