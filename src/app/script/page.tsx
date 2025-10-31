"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, FileText, Lightbulb, Heart, BookOpen, History, 
  Search, Link as LinkIcon, ExternalLink, 
  Eye, Monitor, Download
} from 'lucide-react';
// Note: GeneratedScript component exists in the project but is not used in this detailed view
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  const [shouldRender, setShouldRender] = useState(false);
  const [pageTitle, setPageTitle] = useState('Generated Script');

  const getAuthToken = (): string | null => {
    const tokenData = localStorage.getItem('sb-xncfghdikiqknuruurfh-auth-token');
    if (tokenData) {
      try {
        const parsedToken = JSON.parse(tokenData);
        return parsedToken.access_token || null;
      } catch (error) {
        console.error('Failed to parse auth token:', error);
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/auth');
      return;
    }
    setShouldRender(true);

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
          try {
            const token = getAuthToken();
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch('/api/generate-script', {
              method: 'POST',
              headers,
              body: JSON.stringify(payload),
            });

            if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.error || 'API request failed');
            }

            const json = await res.json();
            setData(json as GeneratedScriptData);
            setIsLoading(false);
            return;
          } catch (err) {
            const error = err as Error;
            if (error.message.includes('Not authenticated')) {
              router.push('/auth');
              return;
            }
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
        if (params.ideaTitle) {
          setPageTitle(params.ideaTitle);
        }
        // show summary immediately
      } catch {
        setError('Invalid generation parameters.');
        setIsLoading(false);
        return;
      }

      try {
        const token = getAuthToken();
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch('/api/generate-script', {
          method: 'POST',
          headers,
          body: JSON.stringify(params),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'API request failed');
        }

        const json = await res.json();
        setData(json as GeneratedScriptData);
        // optionally clear params so reload won't re-run
        try {
          sessionStorage.removeItem('generate_params');
        } catch {}
      } catch (err) {
        const error = err as Error;
        if (error.message.includes('Not authenticated')) {
          router.push('/auth');
          return;
        }
        if (error.message.includes('Insufficient credits')) {
          router.push('/pricing');
          return;
        }
        console.error('Failed to generate script:', error);
        setError(error.message || 'Failed to generate script');
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [router]);

  const [showSourcesDialog, setShowSourcesDialog] = useState(false);

  if (!shouldRender) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#E9EBF0]/20">
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
      <div className="min-h-screen bg-[#E9EBF0]/20">
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
      <div className="min-h-screen bg-[#E9EBF0]/20">
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
    <div className="min-h-screen bg-[#E9EBF0]/20">
      <Header />
      <main className="container mx-auto px-16 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.title || pageTitle}</h1>
          <p className="text-gray-600">Generated script with comprehensive research and strategic structure</p>
        </div>

        {/* Metrics card */}
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>Script Metrics</CardTitle>
            <CardDescription>Comprehensive analysis of your generated script</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              <div className="text-center">
                <FileText className="w-8 h-8 mx-auto mb-2 text-black" />
                <div className="text-2xl font-bold text-gray-900">{data.metrics?.totalWords ?? data.estimated_word_count ?? 0}</div>
                <div className="text-sm text-gray-600">Total Words</div>
              </div>
              <div className="text-center">
                <Heart className="w-8 h-8 mx-auto mb-2 text-black" />
                <div className="text-2xl font-bold text-gray-900">{data.metrics?.emotionalDepth ?? data.analysis?.emotional_depth ?? '—'}</div>
                <div className="text-sm text-gray-600">Emotional Depth</div>
              </div>
              <div className="text-center">
                <Lightbulb className="w-8 h-8 mx-auto mb-2 text-black" />
                <div className="text-2xl font-bold text-gray-900">{data.metrics?.generalExamples ?? data.analysis?.examples_count ?? 0}</div>
                <div className="text-sm text-gray-600">Examples</div>
              </div>
              <div className="text-center">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-black" />
                <div className="text-2xl font-bold text-gray-900">{data.metrics?.proverbs ?? 0}</div>
                <div className="text-sm text-gray-600">Proverbs</div>
              </div>
              <div className="text-center">
                <History className="w-8 h-8 mx-auto mb-2 text-black" />
                <div className="text-2xl font-bold text-gray-900">{data.metrics?.historicalFacts ?? 0}</div>
                <div className="text-sm text-gray-600">Historical Facts</div>
              </div>
              <div className="text-center">
                <Search className="w-8 h-8 mx-auto mb-2 text-black" />
                <div className="text-2xl font-bold text-gray-900">{data.metrics?.researchFacts ?? data.analysis?.research_facts_count ?? 0}</div>
                <div className="text-sm text-gray-600">Research Facts</div>
              </div>
            </div>

            {/* <div>
              <h4 className="font-semibold text-gray-900 mb-3">Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {data.metrics?.keywords?.map((k, i) => (
                  <Badge key={i} variant="secondary" className="bg-blue-100 text-gray-800 px-4 py-2">{k}</Badge>
                ))}
              </div>
            </div> */}
          </CardContent>
        </Card>

        {/* Main two-column layout */}
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            {/* Structure */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Script Structure Flow</CardTitle>
                <CardDescription>{`Visual representation of your script's flow and structure`}</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3 pr-4">
                    {data.structure?.map((section, index) => (
                      <div key={section.id ?? index} className="flex items-center">
                        <div className="flex flex-col items-center mr-3">
                          <div className="w-8 h-8 rounded-full bg-gray-600 text-white flex items-center justify-center">{index + 1}</div>
                          <div className="h-full w-px bg-gray-200" />
                        </div>
                        <div className="flex-1 bg-white/50 rounded-lg p-3 border border-gray-200">
                          <div className="font-medium">{section.title}</div>
                          <div className="text-xs text-gray-500">{section.duration} • {section.words ?? '—'} words</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Sources */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg"><LinkIcon className="w-5 h-5 mr-2" />Research Sources</CardTitle>
                <CardDescription>Credible sources and references used in this script</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4 pr-4">
                    {(data.source_urls || []).map((url, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <ExternalLink className="w-5 h-5 text-black mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-sm break-all"><a href={url} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:underline">{url}</a></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex flex-col space-y-4">
                  <div>
                    <CardTitle className="text-lg">Script Synopsis</CardTitle>
                    <CardDescription>
                      Comprehensive overview of your script content and approach
                    </CardDescription>
                  </div>

                  <div className="flex space-x-3">
                    <Button size="sm" className="flex-1 bg-gradient-to-r from-gray-600 to-gray-800 text-white hover:from-gray-700 hover:to-black" onClick={() => { /* view full script action */ }}>
                      <Eye className="w-4 h-4 mr-1" />
                      View Full Script
                    </Button>

                    <div className="relative flex-1">
                      <Button size="sm" variant="outline" className="w-full">
                        Translate
                      </Button>
                    </div>

                    <Button size="sm" variant="outline" className="flex-1" onClick={() => { /* teleprompter */ }}>
                      <Monitor className="w-4 h-4 mr-1" /> Teleprompter
                    </Button>

                    <Button size="sm" variant="outline" className="flex-1" onClick={() => { /* download */ }}>
                      <Download className="w-4 h-4 mr-1" /> Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex-1">
                <ScrollArea className="h-[640px]">
                  <div className="prose prose-sm max-w-none">
                    <div className="text-gray-700 leading-relaxed whitespace-pre-line text-base">
                      {data.synopsis || data.script || 'No synopsis available.'}
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />

      {/* Research Sources Dialog - kept for compatibility */}
      <Dialog open={showSourcesDialog} onOpenChange={setShowSourcesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Research Sources</DialogTitle>
            <DialogDescription>Sources used to generate this script.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {data.source_urls?.map((url, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
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
