'use client';

import { useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUploadProps {
  uploadState: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  setUploadState: (state: 'idle' | 'uploading' | 'processing' | 'completed' | 'error') => void;
  setProgress: (progress: number) => void;
  setResults: (results: {
    totalPapers: number;
    processed: number;
    categories: {
      neurological: number;
      cardiovascular: number;
      hepatorenal: number;
      oncological: number;
    };
    accuracy: number;
    processingTime: string;
  } | null) => void;
}

export function FileUpload({ uploadState, setUploadState, setProgress, setResults }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelection = (file: File) => {
    setErrorMessage('');

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Please select a CSV file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const simulateUpload = async () => {
    if (!selectedFile) return;

    setUploadState('uploading');
    setProgress(0);

    // Simulate file upload progress
    for (let i = 0; i <= 50; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setUploadState('processing');

    // Simulate processing
    for (let i = 50; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Mock results
    const mockResults = {
      totalPapers: 150,
      processed: 150,
      categories: {
        neurological: 45,
        cardiovascular: 38,
        hepatorenal: 32,
        oncological: 35
      },
      accuracy: 99.2,
      processingTime: '23.4s'
    };

    setResults(mockResults);
    setUploadState('completed');
  };

  return (
    <Card className="border-nous-sage/20 bg-white/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-nous-navy flex items-center gap-2">
          <div className="w-2 h-2 bg-nous-green rounded-full"></div>
          Upload Medical Papers Dataset
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Drag & Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
            dragActive
              ? 'border-nous-green bg-nous-green/10'
              : 'border-nous-sage/40 hover:border-nous-green/60 hover:bg-nous-green/5'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-nous-green/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-nous-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-nous-navy">
                Drop your CSV file here, or{' '}
                <label className="text-nous-green hover:text-nous-teal cursor-pointer underline">
                  browse files
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="text-sm text-nous-teal mt-2">
                Supports CSV files up to 10MB with title and abstract columns
              </p>
            </div>
          </div>
        </div>

        {/* Selected File Info */}
        {selectedFile && (
          <div className="flex items-center justify-between p-4 bg-nous-cream/50 rounded-lg border border-nous-sage/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-nous-green/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-nous-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-nous-navy">{selectedFile.name}</p>
                <p className="text-sm text-nous-teal">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedFile(null)}
              className="text-nous-teal border-nous-sage hover:bg-nous-sage/10"
            >
              Remove
            </Button>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Button */}
        <div className="flex justify-center">
          <Button
            onClick={simulateUpload}
            disabled={!selectedFile || uploadState !== 'idle'}
            className="bg-nous-green hover:bg-nous-teal text-white px-8 py-2 text-lg font-medium"
          >
            {uploadState === 'idle' ? 'Start Classification' : 'Processing...'}
          </Button>
        </div>

        {/* Requirements */}
        <div className="text-xs text-nous-teal space-y-1 bg-nous-navy/5 p-4 rounded-lg">
          <p className="font-medium text-nous-navy">CSV Requirements:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Must contain 'title' and 'abstract' columns</li>
            <li>UTF-8 encoding recommended</li>
            <li>Maximum 10,000 papers per file</li>
            <li>File size limit: 10MB</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
