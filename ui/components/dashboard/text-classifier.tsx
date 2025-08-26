'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Prediction = {
  category: string;
  probability: number;
};

export function TextClassifier() {
  const [abstractText, setAbstractText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Prediction[] | null>(null);

  const topPrediction = useMemo(() => {
    if (!predictions || predictions.length === 0) return null;
    // Safe: array is non-empty here; assert the first element is defined for TS
    return predictions.reduce(
      (max, p) => (p.probability > max.probability ? p : max),
      predictions[0]!
    );
  }, [predictions]);

  async function handleClassify() {
    setErrorMsg(null);
    setPredictions(null);

    const text = abstractText.trim();
    if (!text) {
      setErrorMsg('Please enter an abstract to classify.');
      return;
    }

    setLoading(true);
    const startedAt = performance.now();

    try {
      // In Docker, ui/next.config.js rewrites /api to the FastAPI backend
      console.log('[TextClassifier] Sending classify request to /api/classify-text');
      const res = await fetch('/api/classify-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const elapsedMs = Math.round(performance.now() - startedAt);

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        console.error('[TextClassifier] Backend error', res.status, detail);
        setErrorMsg(`Classification failed (${res.status}). ${detail || 'Please check backend logs.'}`);
        return;
        }

      const data: Prediction[] = await res.json();
      console.log('[TextClassifier] Received predictions in', elapsedMs, 'ms:', data);
      setPredictions(data);
    } catch (err) {
      console.error('[TextClassifier] Network or parsing error', err);
      setErrorMsg('Network error while calling the classification service.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-nous-sage/20 bg-white/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-nous-navy flex items-center gap-2">
          <div className="w-2 h-2 bg-nous-green rounded-full"></div>
          Classify a Single Abstract
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Textarea */}
        <div>
          <label className="block text-sm font-medium text-nous-navy mb-2">
            Abstract Text
          </label>
          <textarea
            value={abstractText}
            onChange={(e) => setAbstractText(e.target.value)}
            placeholder="Paste the abstract text here..."
            rows={6}
            className="w-full rounded-md border border-nous-sage/40 bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-nous-teal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-nous-green"
          />
          <div className="mt-1 text-xs text-nous-teal">
            {abstractText.length} characters
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleClassify}
            disabled={loading || abstractText.trim().length === 0}
            className="bg-nous-green hover:bg-nous-teal text-white px-6"
          >
            {loading ? 'Classifying…' : 'Classify Abstract'}
          </Button>
          <button
            type="button"
            onClick={() => {
              setAbstractText('');
              setPredictions(null);
              setErrorMsg(null);
            }}
            className="text-sm text-nous-teal underline hover:text-nous-green"
          >
            Clear
          </button>
        </div>

        {/* Error */}
        {errorMsg && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{errorMsg}</AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {predictions && (
          <div className="space-y-4">
            {topPrediction && (
              <div className="p-4 rounded-lg bg-nous-green/10 border border-nous-green/30">
                <div className="text-sm text-nous-teal">Top Prediction</div>
                <div className="text-xl font-semibold text-nous-navy">
                  {topPrediction.category}{' '}
                  <span className="text-nous-teal text-base font-normal">
                    ({Math.round(topPrediction.probability * 100)}%)
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {predictions.map((p) => {
                const pct = Math.round(p.probability * 100);
                return (
                  <div key={p.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-nous-navy">{p.category}</span>
                      <span className="text-nous-teal">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-nous-green transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}