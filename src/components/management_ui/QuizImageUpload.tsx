import React, { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';

interface QuizImageUploadProps {
  quizId: string;
  currentImageUrl: string | null;
}

const QuizImageUpload: React.FC<QuizImageUploadProps> = ({ quizId, currentImageUrl }) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showUploadDiv, setShowUploadDiv] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('quizImage', file);

    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update quiz image');
      }

      // Refresh the page to show the updated image
      router.reload();
    } catch (error) {
      console.log(error)
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mb-4">
      <Button onClick={() => setShowUploadDiv(!showUploadDiv)}>
        {showUploadDiv ? 'Hide Image Upload' : 'Change Quiz Image'}
      </Button>
      
      {showUploadDiv && (
        <div className="mt-4 p-4 border rounded-md">
          <Input type="file" onChange={handleFileChange} accept="image/*" />
          <Button onClick={handleUpload} disabled={isUploading} className="mt-2">
            {isUploading ? 'Uploading...' : 'Upload New Image'}
          </Button>
          {error && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {currentImageUrl && (
            <div className="mt-4">
              <p>Current Image:</p>
              <Image src={currentImageUrl} alt="Current Quiz Image" className="mt-2 max-w-xs" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizImageUpload;