"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, FileText, Lightbulb,
  Search, Link as LinkIcon, ExternalLink, Languages, 
  Download
} from 'lucide-react';
import { GeneratedScript } from '@/components/GeneratedScript';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface GenerationParams {
  topic?: string;
  ideaTitle?: string;
  duration_minutes?: number;
  length?: number;
}

type GeneratedScriptData = {
  script: string;
  estimated_word_count: number;
  source_urls: string[];
  analysis: {
    examples_count: number;
    research_facts_count: number;
    proverbs_count: number;
    emotional_depth: string;
  };
  title?: string;
  metrics?: {
    totalWords: number;
    videoLength: number;
    emotionalDepth: number;
    generalExamples: number;
    proverbs: number;
    historicalExamples: number;
    historicalFacts: number;
    researchFacts: number;
    lawsIncluded: number;
    keywords: string[];
  };
  structure?: Array<{
    id: string;
    title: string;
    duration: string;
    words: number;
  }>;
  synopsis?: string;
};

export default function ScriptPage() {
  const router = useRouter();
  const [data, setData] = useState<GeneratedScriptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [genParams, setGenParams] = useState<GenerationParams | null>(null);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError(null);

      let paramsJson: string | null = null;
      try {
        paramsJson = sessionStorage.getItem('generate_params');
      } catch (e) {
        console.warn('sessionStorage not available', e);
      }

      if (!paramsJson) {
        // Also try reading from URL query (for older flows like /script/:id?duration=...)
        const search = window.location.search;
        const urlParams = new URLSearchParams(search);
        if (urlParams.has('topic') || urlParams.has('duration')) {
          const topic = urlParams.get('topic') || undefined;
          const duration = urlParams.get('duration') || undefined;
          const payload: GenerationParams = {
            topic: topic,
            duration_minutes: duration ? parseInt(duration) : undefined
          };
          // show summary immediately
          setGenParams(payload);
          try {
            const res = await fetch('/api/generate-script', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });

            if (!res.ok) {
              const txt = await res.text();
              throw new Error(txt || 'API request failed');
            }

            const json = await res.json();
            setData(json as GeneratedScriptData);
            setGenParams(payload);
            setIsLoading(false);
            return;
          } catch (err) {
            const error = err as Error;
            console.error('Failed to generate script from URL params:', error);
            setError(error.message || 'Failed to generate script from URL params');
            setIsLoading(false);
            return;
          }
        }

        setError('No generation parameters found. Please go back and create a script from a topic.');
        setIsLoading(false);
        return;
      }

      let params;
      try {
        params = JSON.parse(paramsJson);
        // show summary immediately
        setGenParams(params);
      } catch {
        setError('Invalid generation parameters.');
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/generate-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || 'API request failed');
        }

        const json = await res.json();
        setData(json as GeneratedScriptData);
        setGenParams(params);
        // optionally clear params so reload won't re-run
        try {
          sessionStorage.removeItem('generate_params');
        } catch {}
      } catch (err) {
        const error = err as Error;
        console.error('Failed to generate script:', error);
        setError(error.message || 'Failed to generate script');
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, []);

  const [showSourcesDialog, setShowSourcesDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <Header />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-lg">Generating your script...</p>
            <p className="text-gray-600">This may take up to a couple minutes</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <Header />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <p className="text-red-600">{error}</p>
            <Button onClick={() => router.back()} variant="outline">Go Back</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <Header />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg">No script data available. Please try generating a new script.</p>
            <Button onClick={() => router.push('/')}>Go Home</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {genParams && (
            <Card className="mb-8">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Topic</div>
                    <div className="font-medium">{genParams.topic || genParams.ideaTitle || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Duration</div>
                    <div className="font-medium">{genParams.duration_minutes ?? genParams.length ?? '—'} min</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Script Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Script Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Words</span>
                    <span className="font-medium">{data.estimated_word_count}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Examples</span>
                    <span className="font-medium">{data.analysis?.examples_count || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Research Facts</span>
                    <span className="font-medium">{data.analysis?.research_facts_count || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Proverbs</span>
                    <span className="font-medium">{data.analysis?.proverbs_count || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Structure Flow */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Emotional Depth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{data.analysis?.emotional_depth || 'Not analyzed'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Research Sources & Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Sources & Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    onClick={() => setShowSourcesDialog(true)}
                    disabled={!data.source_urls?.length}
                  >
                    <LinkIcon className="h-4 w-4 mr-2" /> View Research Sources
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" /> Download as PDF
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Languages className="h-4 w-4 mr-2" /> Translate
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Script Content */}
          <Card>
            <CardContent className="p-6">
              <GeneratedScript
                script={data.script}
                estimated_word_count={data.estimated_word_count}
                source_urls={data.source_urls || []}
                analysis={data.analysis}
              />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />

      {/* Research Sources Dialog */}
      <Dialog open={showSourcesDialog} onOpenChange={setShowSourcesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Research Sources</DialogTitle>
            <DialogDescription>
              Sources used to generate this script.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {data.source_urls?.map((url, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                    >
                      {url} <ExternalLink className="h-3 w-3" />
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
