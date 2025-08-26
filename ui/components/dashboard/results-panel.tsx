'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ResultsPanelProps {
  results: {
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
  };
}

export function ResultsPanel({ results }: ResultsPanelProps) {
  const categories = [
    {
      name: 'Neurological',
      count: results.categories.neurological,
      percentage: ((results.categories.neurological / results.totalPapers) * 100).toFixed(1),
      color: 'bg-blue-500',
      lightColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      icon: '🧠'
    },
    {
      name: 'Cardiovascular',
      count: results.categories.cardiovascular,
      percentage: ((results.categories.cardiovascular / results.totalPapers) * 100).toFixed(1),
      color: 'bg-red-500',
      lightColor: 'bg-red-100',
      textColor: 'text-red-700',
      icon: '❤️'
    },
    {
      name: 'Hepatorenal',
      count: results.categories.hepatorenal,
      percentage: ((results.categories.hepatorenal / results.totalPapers) * 100).toFixed(1),
      color: 'bg-yellow-500',
      lightColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
      icon: '🫁'
    },
    {
      name: 'Oncological',
      count: results.categories.oncological,
      percentage: ((results.categories.oncological / results.totalPapers) * 100).toFixed(1),
      color: 'bg-purple-500',
      lightColor: 'bg-purple-100',
      textColor: 'text-purple-700',
      icon: '🎗️'
    }
  ];

  const handleExport = (format: 'csv' | 'json' | 'pdf') => {
    // Mock export functionality
    const data = { results, timestamp: new Date().toISOString() };
    console.log(`Exporting results as ${format}:`, data);

    // In a real app, this would trigger file download
    alert(`Exporting results as ${format.toUpperCase()}...`);
  };

  return (
    <div className="space-y-6">

      {/* Summary Header */}
      <Card className="border-nous-green/30 bg-gradient-to-r from-nous-green/5 to-nous-teal/5">
        <CardHeader>
          <CardTitle className="text-nous-navy flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-nous-green rounded-full"></div>
              Classification Results
            </div>
            <Badge className="bg-nous-green text-white">
              ✓ Completed
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-nous-green">{results.totalPapers}</div>
              <div className="text-sm text-nous-teal font-medium">Total Papers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-nous-green">{results.processed}</div>
              <div className="text-sm text-nous-teal font-medium">Successfully Classified</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-nous-green">{results.accuracy}%</div>
              <div className="text-sm text-nous-teal font-medium">Model Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-nous-green">{results.processingTime}</div>
              <div className="text-sm text-nous-teal font-medium">Processing Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="border-nous-sage/20 bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-nous-navy flex items-center gap-2">
            <div className="w-2 h-2 bg-nous-green rounded-full"></div>
            Category Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Visual Chart */}
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <span className="font-medium text-nous-navy">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-nous-navy">{category.count}</span>
                    <span className="text-sm text-nous-teal">({category.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${category.color}`}
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <div
                key={category.name}
                className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${category.lightColor} border-gray-200`}
              >
                <div className="text-center space-y-2">
                  <div className="text-3xl">{category.icon}</div>
                  <div className={`text-2xl font-bold ${category.textColor}`}>
                    {category.count}
                  </div>
                  <div className="text-sm font-medium text-gray-600">
                    {category.name}
                  </div>
                  <div className={`text-xs font-medium ${category.textColor}`}>
                    {category.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card className="border-nous-sage/20 bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-nous-navy flex items-center gap-2">
            <div className="w-2 h-2 bg-nous-green rounded-full"></div>
            Export Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* CSV Export */}
            <div className="p-4 border border-nous-sage/20 rounded-lg hover:bg-nous-cream/30 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-nous-green/10 rounded flex items-center justify-center">
                    📄
                  </div>
                  <span className="font-medium text-nous-navy">CSV Format</span>
                </div>
                <p className="text-sm text-nous-teal">
                  Detailed classification results with paper IDs, titles, and predicted categories
                </p>
                <Button
                  onClick={() => handleExport('csv')}
                  variant="outline"
                  className="w-full border-nous-sage hover:bg-nous-sage/10"
                >
                  Download CSV
                </Button>
              </div>
            </div>

            {/* JSON Export */}
            <div className="p-4 border border-nous-sage/20 rounded-lg hover:bg-nous-cream/30 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-nous-green/10 rounded flex items-center justify-center">
                    🔧
                  </div>
                  <span className="font-medium text-nous-navy">JSON Format</span>
                </div>
                <p className="text-sm text-nous-teal">
                  Machine-readable format with confidence scores and metadata
                </p>
                <Button
                  onClick={() => handleExport('json')}
                  variant="outline"
                  className="w-full border-nous-sage hover:bg-nous-sage/10"
                >
                  Download JSON
                </Button>
              </div>
            </div>

            {/* PDF Export */}
            <div className="p-4 border border-nous-sage/20 rounded-lg hover:bg-nous-cream/30 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-nous-green/10 rounded flex items-center justify-center">
                    📊
                  </div>
                  <span className="font-medium text-nous-navy">PDF Report</span>
                </div>
                <p className="text-sm text-nous-teal">
                  Professional report with charts, statistics, and summary
                </p>
                <Button
                  onClick={() => handleExport('pdf')}
                  variant="outline"
                  className="w-full border-nous-sage hover:bg-nous-sage/10"
                >
                  Download PDF
                </Button>
              </div>
            </div>
          </div>

          {/* Additional Actions */}
          <div className="flex justify-center mt-6 pt-6 border-t border-nous-sage/20">
            <Button
              className="bg-nous-green hover:bg-nous-teal text-white px-8"
              onClick={() => window.location.reload()}
            >
              Process Another File
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
