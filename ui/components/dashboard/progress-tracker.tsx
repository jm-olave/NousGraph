'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface ProgressTrackerProps {
  uploadState: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
}

export function ProgressTracker({ uploadState, progress }: ProgressTrackerProps) {
  const getStatusColor = () => {
    switch (uploadState) {
      case 'uploading': return 'bg-blue-500';
      case 'processing': return 'bg-nous-green';
      case 'completed': return 'bg-nous-teal';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (uploadState) {
      case 'uploading': return 'Uploading file...';
      case 'processing': return 'AI model processing papers...';
      case 'completed': return 'Classification completed!';
      case 'error': return 'Error occurred during processing';
      default: return 'Waiting...';
    }
  };

  const steps = [
    {
      id: 'upload',
      title: 'File Upload',
      description: 'Uploading CSV file to server',
      icon: '📤',
      active: uploadState === 'uploading',
      completed: ['processing', 'completed'].includes(uploadState)
    },
    {
      id: 'validate',
      title: 'Data Validation',
      description: 'Validating CSV format and content',
      icon: '✓',
      active: uploadState === 'uploading' && progress > 30,
      completed: ['processing', 'completed'].includes(uploadState)
    },
    {
      id: 'process',
      title: 'AI Classification',
      description: 'PubMedBERT analyzing medical papers',
      icon: '🧠',
      active: uploadState === 'processing',
      completed: uploadState === 'completed'
    },
    {
      id: 'results',
      title: 'Generate Results',
      description: 'Compiling classification results',
      icon: '📊',
      active: uploadState === 'processing' && progress > 80,
      completed: uploadState === 'completed'
    }
  ];

  return (
    <Card className="border-nous-sage/20 bg-white/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-nous-navy flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
            Processing Status
          </div>
          <Badge
            variant="outline"
            className={`${
              uploadState === 'completed' ? 'bg-nous-green/10 text-nous-teal border-nous-green' :
              uploadState === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
              'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-nous-navy font-medium">Overall Progress</span>
            <span className="text-nous-teal">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Processing Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-4">

              {/* Step Icon */}
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                ${step.completed ? 'bg-nous-green border-nous-green text-white' :
                  step.active ? 'bg-nous-green/10 border-nous-green text-nous-green animate-pulse' :
                  'bg-gray-50 border-gray-200 text-gray-400'}
              `}>
                {step.completed ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-xl">{step.icon}</span>
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1">
                <h3 className={`font-medium ${
                  step.completed || step.active ? 'text-nous-navy' : 'text-gray-500'
                }`}>
                  {step.title}
                </h3>
                <p className={`text-sm ${
                  step.completed || step.active ? 'text-nous-teal' : 'text-gray-400'
                }`}>
                  {step.description}
                </p>
              </div>

              {/* Step Status */}
              <div className="flex items-center">
                {step.completed && (
                  <Badge variant="outline" className="bg-nous-green/10 text-nous-green border-nous-green">
                    Complete
                  </Badge>
                )}
                {step.active && !step.completed && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-nous-green rounded-full animate-pulse"></div>
                    <span className="text-sm text-nous-green font-medium">Processing...</span>
                  </div>
                )}
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-[54px] mt-16 w-0.5 h-6 bg-gray-200"></div>
              )}
            </div>
          ))}
        </div>

        {/* Processing Stats */}
        {uploadState === 'processing' && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-nous-sage/20">
            <div className="text-center">
              <div className="text-lg font-bold text-nous-green">
                {Math.floor((progress / 100) * 150)}
              </div>
              <div className="text-xs text-nous-teal">Papers Processed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-nous-green">
                {(progress * 0.23).toFixed(1)}s
              </div>
              <div className="text-xs text-nous-teal">Elapsed Time</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-nous-green">
                {Math.max(0, 23 - (progress * 0.23)).toFixed(0)}s
              </div>
              <div className="text-xs text-nous-teal">Remaining</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
