"use client"
import React from 'react';
import { DownloadIcon } from 'lucide-react';

const DownloadButton: React.FC = () => {
  const handleDownload = async () => {
    const response = await fetch('/api/download');
    if (!response.ok) {
      console.error('Failed to download file');
      return;
    }

    // Create a blob from the response data
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'quiz_template.csv'; // Specify the filename for download
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <button onClick={handleDownload} className="inline-flex justify-center py-2 px-4 border-2 border-transparent text-base font-medium rounded-md bg-violet-200 text-[--text-color]  border-violet-200 shadow-[4px_4px_0px_0px_#6366f1] hover:bg-white transition-colors"
    >
     <DownloadIcon className='w-6 h-6 mr-2' /> Download Quiz Template
    </button>
  );
};

export default DownloadButton;