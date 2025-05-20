"use client"
import React from 'react';

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
    <button onClick={handleDownload} className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md shadow-solid text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      Download Quiz Template
    </button>
  );
};

export default DownloadButton;