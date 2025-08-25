'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, BarChart3, Download, CheckCircle, XCircle, Clock } from 'lucide-react'
import axios from 'axios'

interface ClassificationResult {
  id: number
  title: string
  abstract: string
  predictions: Array<{
    category: string
    confidence: number
  }>
  group: string
}

interface JobResult {
  job_id: string
  status: string
  results: ClassificationResult[]
  summary: {
    total_papers: number
    categories: Record<string, number>
    processed_at: string
  }
}

export default function Home() {
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<string>('idle')
  const [results, setResults] = useState<JobResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post('http://localhost:8000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setJobId(response.data.job_id)
      setJobStatus('processing')

      // Poll for results
      pollResults(response.data.job_id)

    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed')
      setIsUploading(false)
    }
  }, [])

  const pollResults = async (id: string) => {
    try {
      const response = await axios.get(`http://localhost:8000/results/${id}`)

      if (response.status === 202) {
        // Still processing
        setTimeout(() => pollResults(id), 2000)
      } else {
        // Completed
        setResults(response.data)
        setJobStatus('completed')
        setIsUploading(false)
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setTimeout(() => pollResults(id), 2000)
      } else {
        setError('Failed to get results')
        setIsUploading(false)
      }
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  const getCategoryColor = (category: string) => {
    const colors = {
      neurological: 'bg-purple-100 text-purple-800',
      cardiovascular: 'bg-red-100 text-red-800',
      hepatorenal: 'bg-green-100 text-green-800',
      oncological: 'bg-yellow-100 text-yellow-800',
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const exportResults = () => {
    if (!results) return

    const csvContent = [
      ['ID', 'Title', 'Abstract', 'Predictions', 'Group'].join(','),
      ...results.results.map(row => [
        row.id,
        `"${row.title.replace(/"/g, '""')}"`,
        `"${row.abstract.replace(/"/g, '""')}"`,
        `"${row.predictions.map(p => `${p.category}(${p.confidence})`).join(', ')}"`,
        row.group
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `classification_results_${results.job_id}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Medical Paper Classification
          </h1>
          <p className="text-lg text-gray-600">
            Upload your CSV file and get instant classification results using PubMedBERT
          </p>
        </div>

        {/* Upload Section */}
        {!results && (
          <div className="max-w-2xl mx-auto">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              {isUploading ? (
                <div className="flex items-center justify-center">
                  <Clock className="animate-spin h-5 w-5 mr-2" />
                  <p className="text-lg">Processing your file...</p>
                </div>
              ) : isDragActive ? (
                <p className="text-lg text-blue-600">Drop your CSV file here</p>
              ) : (
                <div>
                  <p className="text-lg mb-2">Drop your CSV file here, or click to select</p>
                  <p className="text-sm text-gray-500">
                    Supports CSV files up to 50MB with columns: title, abstract
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                <XCircle className="inline h-5 w-5 mr-2" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Results Section */}
        {results && (
          <div className="max-w-6xl mx-auto">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Papers</p>
                    <p className="text-2xl font-bold text-gray-900">{results.summary.total_papers}</p>
                  </div>
                </div>
              </div>

              {Object.entries(results.summary.categories).map(([category, count]) => (
                <div key={category} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className={`h-8 w-8 rounded-full ${getCategoryColor(category)} flex items-center justify-center text-sm font-bold`}>
                      {count}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 capitalize">{category}</p>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Export Button */}
            <div className="mb-6 flex justify-end">
              <button
                onClick={exportResults}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Download className="h-5 w-5 mr-2" />
                Export Results
              </button>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Classification Results</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Predictions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Group
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.results.map((result) => (
                      <tr key={result.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                          <div className="truncate" title={result.title}>
                            {result.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {result.predictions.map((pred, idx) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(pred.category)}`}
                              >
                                {pred.category} ({pred.confidence})
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {result.group}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p>Built with FastAPI, Next.js, and PubMedBERT</p>
        </div>
      </div>
    </div>
  )
}