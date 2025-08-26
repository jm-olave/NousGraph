"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ExternalLink, BookOpen } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Sample data based on your images
const targetDistributionData = [
  { name: 'neurological', count: 1058, percentage: 29.7, color: '#82ca9d' },
  { name: 'cardiovascular', count: 645, percentage: 18.1, color: '#8884d8' },
  { name: 'hepatorenal', count: 533, percentage: 15.0, color: '#ffc658' },
  { name: 'oncological', count: 308, percentage: 8.6, color: '#ff7300' },
  { name: 'neurological|cardiovascular', count: 237, percentage: 6.6, color: '#00ff00' },
  { name: 'neurological|hepatorenal', count: 202, percentage: 5.7, color: '#ff00ff' },
  { name: 'cardiovascular|hepatorenal', count: 190, percentage: 5.3, color: '#00ffff' },
  { name: 'neurological|oncological', count: 143, percentage: 4.0, color: '#ffff00' }
];

const classImbalanceData = [
  { category: 'Most Frequent', percentage: 29.7, color: '#ff6b6b' },
  { category: 'Least Frequent', percentage: 0.2, color: '#e8e8e8' }
];

// Word cloud data for different classes
const wordCloudData: Record<string, string[]> = {
  neurological: [
    'patient', 'treatment', 'therapy', 'induced', 'renal', 'associated',
    'group', 'day', 'seizure', 'mutations', 'study', 'treatment'
  ],
  cardiovascular: [
    'elderly', 'patients', 'adult', 'population', 'conducted',
    'cardiac', 'hypertension', 'group', 'effect', 'cancer', 'patients'
  ],
  hepatorenal: [
    'cardiac', 'transplant', 'therapy', 'diabetic', 'patients',
    'outcomes', 'disease', 'organ', 'interplay', 'via'
  ],
  oncological: [
    'patient', 'tumor', 'effect', 'prostate cancer', 'BRCA1',
    'gene', 'ovarian cancer', 'families', 'mutation'
  ]
};

// Simple Word Display component
interface SimpleWordDisplayProps {
  words: string[];
  className?: string;
}

const SimpleWordDisplay: React.FC<SimpleWordDisplayProps> = ({ words, className }) => (
  <div className={`flex flex-wrap gap-2 p-4 ${className}`}>
    {words.map((word, index) => {
      const sizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl'];
      const colors = ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800', 'bg-orange-100 text-orange-800'];
      const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      return (
        <span
          key={index}
          className={`px-3 py-1 rounded-full font-medium transition-all hover:scale-105 ${randomSize} ${randomColor}`}
        >
          {word}
        </span>
      );
    })}
  </div>
);

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      percentage: number;
    };
  }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length > 0 && payload[0]) {
    return (
      <div className="bg-white p-3 border rounded shadow-lg">
        <p className="font-medium">{`${label}`}</p>
        <p className="text-blue-600">{`Count: ${payload[0].value}`}</p>
        <p className="text-green-600">{`Percentage: ${payload[0].payload.percentage}%`}</p>
      </div>
    );
  }
  return null;
};

export default function MedicalEDADashboard() {
  const [selectedClass, setSelectedClass] = useState('neurological');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-nous-navy mb-2">Medical Dataset - Exploratory Data Analysis</h1>
        <p className="text-nous-teal">
          Interactive visualization of target variable distribution and class characteristics
        </p>
      </div>

      <Tabs defaultValue="distribution" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="distribution">Distribution Analysis</TabsTrigger>
          <TabsTrigger value="wordclouds">Word Analysis</TabsTrigger>
          <TabsTrigger value="insights">Key Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="space-y-6">
          {/* Class Counts Bar Chart */}
          <Card className="border-nous-sage/20 bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-nous-navy">Target Variable Distribution - Class Counts</CardTitle>
              <CardDescription className="text-nous-teal">Number of samples per medical category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={targetDistributionData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card className="border-nous-sage/20 bg-white/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-nous-navy">Class Distribution (%)</CardTitle>
                <CardDescription className="text-nous-teal">Percentage breakdown of medical categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={targetDistributionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="percentage"
                      label={({ percentage }) => `${percentage}%`}
                    >
                      {targetDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Class Imbalance */}
            <Card className="border-nous-sage/20 bg-white/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-nous-navy">Class Imbalance Analysis</CardTitle>
                <CardDescription className="text-nous-teal">Ratio: 151.14:1 (Most vs Least Frequent)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={classImbalanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                    <Bar dataKey="percentage">
                      {classImbalanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">3,568</div>
                <p className="text-xs text-muted-foreground">Total Samples</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">13</div>
                <p className="text-xs text-muted-foreground">Unique Classes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">151.14:1</div>
                <p className="text-xs text-muted-foreground">Imbalance Ratio</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">29.7%</div>
                <p className="text-xs text-muted-foreground">Largest Class</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="wordclouds" className="space-y-6">
          <Card className="border-nous-sage/20 bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-nous-navy">Word Analysis by Medical Category</CardTitle>
              <CardDescription className="text-nous-teal">
                Key terms and concepts associated with each medical category
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium">Select Category:</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neurological">Neurological</SelectItem>
                    <SelectItem value="cardiovascular">Cardiovascular</SelectItem>
                    <SelectItem value="hepatorenal">Hepatorenal</SelectItem>
                    <SelectItem value="oncological">Oncological</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-3 capitalize">
                  {selectedClass} - Key Terms
                  <Badge variant="secondary" className="ml-2">
                    {targetDistributionData.find(d => d.name === selectedClass)?.count || 'N/A'} samples
                  </Badge>
                </h4>
                <SimpleWordDisplay 
                  words={wordCloudData[selectedClass] || []} 
                  className="min-h-[200px]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6">
            <Card className="border-nous-sage/20 bg-white/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-nous-navy">Key Findings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Badge variant="destructive">⚠️</Badge>
                    <div>
                      <h4 className="font-medium">Severe Class Imbalance</h4>
                      <p className="text-sm text-muted-foreground">
                        The dataset shows significant class imbalance with a ratio of 151.14:1 between 
                        the most and least frequent classes.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Badge variant="default">📊</Badge>
                    <div>
                      <h4 className="font-medium">Dominant Categories</h4>
                      <p className="text-sm text-muted-foreground">
                        Neurological (29.7%), Cardiovascular (18.1%), and Hepatorenal (15.0%) 
                        categories make up 62.8% of the dataset.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Badge variant="secondary">🔬</Badge>
                    <div>
                      <h4 className="font-medium">Multi-label Classification</h4>
                      <p className="text-sm text-muted-foreground">
                        The presence of combined categories (e.g., neurological|cardiovascular) 
                        suggests this is a multi-label classification problem.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-nous-sage/20 bg-white/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-nous-navy">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Consider using stratified sampling techniques</li>
                  <li>• Apply class balancing methods (SMOTE, class weights)</li>
                  <li>• Use appropriate metrics for imbalanced datasets (F1-score, AUC-ROC)</li>
                  <li>• Consider ensemble methods that handle imbalance well</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Model Training Information Section */}
      <Card className="border-nous-sage/20 bg-gradient-to-r from-nous-green/5 to-nous-teal/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-nous-navy flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Model Training Details
          </CardTitle>
          <CardDescription className="text-nous-teal">
            Learn more about how we trained our medical paper classification model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-nous-navy font-medium">
                Want to dive deeper into our model architecture and training process?
              </p>
              <p className="text-sm text-nous-teal">
                Explore our comprehensive training report including hyperparameters,
                performance metrics, and model evaluation details.
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <Button
                asChild
                className="bg-nous-green hover:bg-nous-teal text-white transition-colors"
              >
                <a
                  href="https://wandb.ai/dzience-nousgraph/huggingface/reports/NousGraph-Medical-Analytics--VmlldzoxNDEzMDAzMg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  View Training Report
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}