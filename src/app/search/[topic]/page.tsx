'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { ApiService } from '@/services/api';
import { ScriptGenerationModal, ScriptGenerationParams } from '@/components/ScriptGenerationModal';


interface ScriptIdea {
  id: number;
  title: string;
  description: string;
  category: string;
}

// Cache both in memory and localStorage to persist between visits
const resultsCache = new Map<string, { scriptIdeas: ScriptIdea[]; error: string | null; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours - topics don't change that often

interface CacheItem {
  scriptIdeas: ScriptIdea[];
  error: string | null;
  timestamp: number;
}

const getFromLocalStorage = (topic: string): CacheItem | null => {
  try {
    const item = localStorage.getItem(`topic_${topic}`);
    if (!item) return null;
    const parsed = JSON.parse(item) as CacheItem;
    const now = Date.now();
    if (now - parsed.timestamp > CACHE_DURATION) {
      localStorage.removeItem(`topic_${topic}`);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const saveToCache = (topic: string, data: CacheItem) => {
  // Save to memory cache
  resultsCache.set(topic, data);
  // Save to localStorage
  try {
    localStorage.setItem(`topic_${topic}`, JSON.stringify(data));
  } catch {
    // If localStorage is full, clean up old items
    const keys = Object.keys(localStorage);
    const topicKeys = keys.filter(k => k.startsWith('topic_'));
    if (topicKeys.length > 0) {
      localStorage.removeItem(topicKeys[0]); // Remove oldest
      try {
        localStorage.setItem(`topic_${topic}`, JSON.stringify(data));
      } catch {
        console.warn('Failed to save to localStorage after cleanup');
      }
    }
  }
};

const cleanupCache = () => {
  const now = Date.now();
  // Clean memory cache
  for (const [key, value] of resultsCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      resultsCache.delete(key);
    }
  }
  // Clean localStorage
  try {
    const keys = Object.keys(localStorage);
    const topicKeys = keys.filter(k => k.startsWith('topic_'));
    topicKeys.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item) as CacheItem;
        if (now - parsed.timestamp > CACHE_DURATION) {
          localStorage.removeItem(key);
        }
      }
    });
  } catch {
    // Ignore localStorage errors
  }
};

export default function SearchTopicPage() {
  const params = useParams();
  const router = useRouter();
  // Read raw param and decode safely so UI shows spaces (not "%20")
  const rawTopic = Array.isArray(params?.topic) ? params.topic[0] : params?.topic ?? '';
  const topic = (() => {
    try {
      // decodeURIComponent is safe if the value contains percent-escapes like %20
      return decodeURIComponent(rawTopic);
    } catch {
      // If decoding fails (malformed percent-encoding), fall back to raw value
      return rawTopic;
    }
  })();

  const [scriptIdeas, setScriptIdeas] = useState<ScriptIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [videoLengths, setVideoLengths] = useState<Record<number, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<ScriptIdea | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const initialLoadStartRef = useRef<number | null>(null);


  const handleModalSubmit = async (params: ScriptGenerationParams) => {
    // Save generation params and navigate to /script where the fetch will be performed
    setIsGenerating(true);
    try {
      const payload = {
        ...params,
        ideaTitle: selectedIdea?.title,
        ideaDescription: selectedIdea?.description,
        length: videoLengths[selectedIdea?.id || 0] || '10',
      };

      // Use sessionStorage so it's short-lived and per-tab
      try {
        sessionStorage.setItem('generate_params', JSON.stringify(payload));
      } catch (e) {
        console.warn('Failed to persist generate params to sessionStorage', e);
      }

      // Close modal and navigate to the script page which will perform the API call and show loader
      setIsModalOpen(false);
      router.push('/script');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    cleanupCache();
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      if (!topic) return;

      // Try localStorage first
      const localData = getFromLocalStorage(topic);
      if (localData) {
        setScriptIdeas(localData.scriptIdeas);
        setError(localData.error);
        setIsLoading(false);
        // Also update memory cache
        resultsCache.set(topic, localData);
        return;
      }

      // Try memory cache next
      const cached = resultsCache.get(topic);
      const now = Date.now();
      if (cached && now - cached.timestamp < CACHE_DURATION) {
        setScriptIdeas(cached.scriptIdeas);
        setError(cached.error);
        setIsLoading(false);
        // Update localStorage while we have the data
        saveToCache(topic, cached);
        return;
      }

      initialLoadStartRef.current = Date.now();
      setIsLoading(true);
      setError(null);
      setScriptIdeas([]);

      const maxWaitMs = 120000; // 2 minutes
      const retryDelayMs = 5000;

      while (!isCancelled) {
        try {
          const response = await ApiService.processTopic(topic);
          if (isCancelled) return;

          const ideas: ScriptIdea[] = response.ideas.map((idea, idx) => ({
            id: idx + 1,
            title: idea,
            description: response.descriptions[idx] || 'No description available.',
            category: getCategoryFromIndex(idx),
          }));

          const cacheData = { scriptIdeas: ideas, error: null, timestamp: Date.now() };
          saveToCache(topic, cacheData);
          setScriptIdeas(ideas);
          setIsLoading(false);
          return;
        } catch (err) {
          const elapsed = Date.now() - (initialLoadStartRef.current ?? Date.now());
          const message = err instanceof Error ? err.message : String(err);

          const isRetryable = message.includes('502') || message.toLowerCase().includes('temporarily unavailable');
          if (isRetryable && elapsed + retryDelayMs < maxWaitMs) {
            await new Promise((r) => setTimeout(r, retryDelayMs));
            continue;
          }

          if (elapsed > 120000 && !isCancelled) { // 120 seconds timeout
            setError("The server is taking a long time to respond. You can wait or try refreshing the page.");
          }

          // fallback sample data
          const fallbackIdeas: ScriptIdea[] = [
            {
              id: 1,
              title: `Understanding ${topic}: A Comprehensive Analysis`,
              description: `Dive deep into the world of ${topic} and explore its various aspects, implications, and real-world applications.`,
              category: 'Technology',
            },
            {
              id: 2,
              title: `The Impact of ${topic} on Modern Society`,
              description: `Explore how ${topic} is shaping our world today and what it means for the future.`,
              category: 'Social Impact',
            },
            {
              id: 3,
              title: `Future Trends: Where ${topic} is Heading`,
              description: `Get a glimpse into the future of ${topic} and discover what experts predict will happen next.`,
              category: 'Future Analysis',
            },
          ];

          const errorMessage = message.includes('timeout')
            ? 'API request timed out after waiting. Using sample data.'
            : message.includes('502')
            ? 'API server returned 502 for an extended period. Using sample data.'
            : 'API temporarily unavailable. Using sample data.';

          const cacheData = { scriptIdeas: fallbackIdeas, error: errorMessage, timestamp: Date.now() };
          saveToCache(topic, cacheData);
          if (isCancelled) return;
          setScriptIdeas(fallbackIdeas);
          setError(errorMessage);
          setIsLoading(false);
          return;
        }
      }
    };

    run();
    return () => {
      isCancelled = true;
    };
  }, [topic]);

  const getCategoryFromIndex = (index: number) => {
    const categoryMap = ['Technology', 'Social Impact', 'Economic Analysis', 'Historical', 'Future Analysis'];
    return categoryMap[index % categoryMap.length];
  };

  const filtered = scriptIdeas.filter((s) => selectedCategory === 'all' || s.category === selectedCategory);

  const handleGenerateScript = async (idea: ScriptIdea) => {
    if (!videoLengths[idea.id]) {
      console.warn('No length specified for this script');
      return;
    }
    setSelectedIdea(idea);
    setIsModalOpen(true);
  };

  const handleVideoLengthChange = (id: number, value: string) => {
    setVideoLengths((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div className="min-h-screen bg-[#E9EBF0]/20">
      <Header />

      <ScriptGenerationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        topic={selectedIdea?.title || ''}
        initialDuration={videoLengths[selectedIdea?.id || 0] || '10'}
        onGenerate={handleModalSubmit}
        isGenerating={isGenerating}
      />


      <div className="container mx-auto px-16 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Script Ideas for:{" "}
            <span className="bg-black text-white px-2 py-1 rounded font-semibold">
              {topic}
            </span>
          </h1>
          <p className="text-gray-600">Choose from various problem statements and perspectives for your YouTube script</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-lg">
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block pt-6">Category</label>
                  <div className="space-y-2">
                    {['all', 'Technology', 'Social Impact', 'Economic Analysis', 'Historical', 'Future Analysis'].map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'outline'}
                        onClick={() => setSelectedCategory(category)}
                        className="w-full justify-start"
                        size="sm"
                      >
                        {category === 'all' ? 'All Categories' : category}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button onClick={() => setSelectedCategory('all')} variant="outline" className="w-full">
                  Reset Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">{isLoading ? 'Loading script ideas...' : `Found ${filtered.length} script ideas`}</p>
            </div>

            {isLoading && (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-black" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Script Ideas</h3>
                      <p className="text-gray-600">Our AI is analyzing &quot;{topic}&quot; and creating personalized script ideas for you...</p>
                      <p className="text-sm text-gray-500 mt-2">This may take up to 2 minutes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {error && (
              <Card className="text-center py-8 border-black-200 bg-black-50 mb-6">
                <CardContent>
                  <div className="flex flex-col items-center space-y-4">
                    <AlertCircle className="w-6 h-6 text-black" />
                    <div>
                      <h3 className="text-lg font-semibold text-black mb-2">API Temporarily Unavailable</h3>
                      <p className="text-black mb-4">{error}</p>
                      <Button onClick={() => window.location.reload()} variant="outline" className="border-black text-black hover:bg-gray-100">
                        Try Again
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isLoading && (
              <div className="space-y-6">
                {filtered.map((statement) => (
                  <Card key={statement.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <CardTitle className="text-xl mr-3">
                              {statement.title}
                            </CardTitle>
                            <Badge variant="secondary" className="bg-black text-white">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Trending
                            </Badge>
                          </div>
                          <CardDescription className="text-gray-600 leading-relaxed">{statement.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{statement.category}</Badge>

                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <label className="text-sm font-medium text-gray-700">Length (min):</label>
                              <Input type="number" placeholder="10" value={videoLengths[statement.id] || ''} onChange={(e) => handleVideoLengthChange(statement.id, e.target.value)} className="w-20" min={1} max={60} />
                            </div>
                            <Button onClick={() => handleGenerateScript(statement)} className="bg-gradient-to-r from-gray-500 to-black hover:from-gray-600 hover:to-black text-white font-semibold" disabled={!videoLengths[statement.id]?.trim()} size="sm">
                              <Clock className="w-4 h-4 mr-2" />
                              Generate Script
                            </Button>
                          </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filtered.length === 0 && (
                  <Card className="text-center py-12">
                    <CardContent>
                      <p className="text-gray-500 text-lg mb-4">No scripts match your current filters</p>
                      <Button onClick={() => setSelectedCategory('all')} variant="outline">Reset Filters</Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
