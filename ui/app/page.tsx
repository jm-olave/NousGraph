'use client';

import { useState } from 'react';
import { Navigation } from '@/components/navigation';
import { FileUpload } from '@/components/dashboard/file-upload';
import { ProgressTracker } from '@/components/dashboard/progress-tracker';
import { ResultsPanel } from '@/components/dashboard/results-panel';
import { TextClassifier } from '@/components/dashboard/text-classifier';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
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
  } | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-nous-cream to-white">
      <Navigation />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Welcome Section */}
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-4xl font-bold text-nous-navy">
              Medical Paper Classification System
            </h1>
            <p className="text-lg text-nous-teal max-w-2xl mx-auto">
              Upload your CSV files containing medical paper data and receive instant AI-powered classification
              across four categories: neurological, cardiovascular, hepatorenal, and oncological.
            </p>
          </div>

          {/* Classification Categories */}
          <Card className="border-nous-sage/20 bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-nous-navy flex items-center gap-2">
                <div className="w-2 h-2 bg-nous-green rounded-full"></div>
                Classification Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'Neurological', color: 'bg-blue-100 text-blue-800', icon: '🧠' },
                  { name: 'Cardiovascular', color: 'bg-red-100 text-red-800', icon: '❤️' },
                  { name: 'Hepatorenal', color: 'bg-yellow-100 text-yellow-800', icon: '🫁' },
                  { name: 'Oncological', color: 'bg-purple-100 text-purple-800', icon: '🎗️' }
                ].map((category) => (
                  <div key={category.name}
                       className="flex items-center gap-2 p-3 rounded-lg bg-nous-cream/50 border border-nous-sage/20">
                    <span className="text-2xl">{category.icon}</span>
                    <span className="font-medium text-nous-navy">{category.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Single Abstract Classification */}
          <TextClassifier />

          {/* Upload Section */}
          <FileUpload
            uploadState={uploadState}
            setUploadState={setUploadState}
            setProgress={setProgress}
            setResults={setResults}
          />

          {/* Progress Section */}
          {uploadState !== 'idle' && (
            <ProgressTracker
              uploadState={uploadState}
              progress={progress}
            />
          )}

          {/* Results Section */}
          {uploadState === 'completed' && results && (
            <ResultsPanel results={results} />
          )}

          {/* System Info */}
          <Card className="border-nous-sage/20 bg-nous-navy/5">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-nous-green">PubMedBERT</div>
                  <div className="text-sm text-nous-teal">AI Model</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-nous-green">99.2%</div>
                  <div className="text-sm text-nous-teal">Accuracy Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-nous-green">&lt;30s</div>
                  <div className="text-sm text-nous-teal">Processing Time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
