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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ApiService, GenerationParams, GeneratedScriptData } from '@/services/api';

// Format script text: *** becomes <hr/>, *word* becomes <strong>word</strong>
function formatScript(text: string): React.ReactNode[] {
  if (!text) return [];
  
  const nodes: React.ReactNode[] = [];
  
  // First, split by triple asterisks (***) to create sections separated by <hr/>
  const sections = text.split(/\*\*\*/);
  
  sections.forEach((section, sectionIndex) => {
    if (!section) {
      // Empty section, just add an hr (will happen between consecutive ***)
      if (sectionIndex < sections.length - 1) {
        nodes.push(<hr key={`hr-${sectionIndex}`} className="my-4 border-gray-300" />);
      }
      return;
    }
    
    // Process each section for single asterisk patterns (*word* -> <strong>word</strong>)
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let keyCounter = 0;
    
    // Match *word* pattern (but not *** since we already split on that)
    // Pattern: * followed by one or more non-asterisk characters, followed by *
    const singleAsteriskRegex = /\*([^*\n]+?)\*/g;
    let match: RegExpExecArray | null;
    
    while ((match = singleAsteriskRegex.exec(section)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const beforeText = section.slice(lastIndex, match.index);
        if (beforeText) {
          // Preserve newlines in the text
          const lines = beforeText.split('\n');
          lines.forEach((line, lineIdx) => {
            if (line) parts.push(line);
            if (lineIdx < lines.length - 1) {
              parts.push(<br key={`br-${sectionIndex}-${keyCounter++}`} />);
            }
          });
        }
      }
      
      // Add the bold text (content between single asterisks)
      parts.push(
        <strong key={`strong-${sectionIndex}-${keyCounter++}`}>
          {match[1]}
        </strong>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after last match
    if (lastIndex < section.length) {
      const afterText = section.slice(lastIndex);
      if (afterText) {
        // Preserve newlines
        const lines = afterText.split('\n');
        lines.forEach((line, lineIdx) => {
          if (line) parts.push(line);
          if (lineIdx < lines.length - 1) {
            parts.push(<br key={`br-${sectionIndex}-${keyCounter++}`} />);
          }
        });
      }
    }
    
    // If no matches, add the whole section as-is (with preserved newlines)
    if (parts.length === 0) {
      const lines = section.split('\n');
      lines.forEach((line, lineIdx) => {
        if (line) parts.push(line);
        if (lineIdx < lines.length - 1) {
          parts.push(<br key={`br-${sectionIndex}-${keyCounter++}`} />);
        }
      });
    }
    
    // Add this section's content
    if (parts.length > 0) {
      nodes.push(
        <span key={`section-${sectionIndex}`} className="whitespace-pre-wrap">
          {parts}
        </span>
      );
    }
    
    // Add <hr/> between sections (but not after the last section)
    if (sectionIndex < sections.length - 1) {
      nodes.push(<hr key={`hr-${sectionIndex}`} className="my-4 border-gray-300" />);
    }
  });
  
  return nodes;
}

// Helper function to generate a localStorage key from topic/idea
function getStorageKey(topic?: string, ideaTitle?: string): string {
  const identifier = ideaTitle || topic || 'default';
  // Create a safe key by replacing special characters
  const safeKey = identifier.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  return `script_${safeKey}`;
}

// Cache interface for stored script data
interface CachedScriptData {
  data: GeneratedScriptData;
  params: GenerationParams;
  timestamp: number;
  pageTitle?: string;
}

// Cache duration: 24 hours
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Save script to localStorage
function saveScriptToStorage(topic: string | undefined, ideaTitle: string | undefined, data: GeneratedScriptData, params: GenerationParams, pageTitle?: string): void {
  try {
    const key = getStorageKey(topic, ideaTitle);
    const cacheData: CachedScriptData = {
      data,
      params,
      timestamp: Date.now(),
      pageTitle,
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
    
    // Also store a reference to the latest script for quick access
    localStorage.setItem('script_latest_key', key);
  } catch (error) {
    console.warn('Failed to save script to localStorage:', error);
    // If localStorage is full, try to clean up old entries
    try {
      const keys = Object.keys(localStorage);
      const scriptKeys = keys.filter(k => k.startsWith('script_') && k !== 'script_latest_key');
      if (scriptKeys.length > 10) {
        // Remove oldest entries
        const sortedKeys = scriptKeys.sort((a, b) => {
          try {
            const dataA = JSON.parse(localStorage.getItem(a) || '{}') as CachedScriptData;
            const dataB = JSON.parse(localStorage.getItem(b) || '{}') as CachedScriptData;
            return (dataA.timestamp || 0) - (dataB.timestamp || 0);
          } catch {
            return 0;
          }
        });
        sortedKeys.slice(0, scriptKeys.length - 10).forEach(k => localStorage.removeItem(k));
      }
      // Retry saving
      const key = getStorageKey(topic, ideaTitle);
      const cacheData: CachedScriptData = {
        data,
        params,
        timestamp: Date.now(),
        pageTitle,
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
      localStorage.setItem('script_latest_key', key);
    } catch {
      console.warn('Failed to cleanup and save script to localStorage');
    }
  }
}

// Load script from localStorage
function loadScriptFromStorage(topic?: string, ideaTitle?: string): CachedScriptData | null {
  try {
    // Try specific key first
    const specificKey = getStorageKey(topic, ideaTitle);
    const specificData = localStorage.getItem(specificKey);
    if (specificData) {
      const cached = JSON.parse(specificData) as CachedScriptData;
      const now = Date.now();
      if (cached.timestamp && now - cached.timestamp < CACHE_DURATION) {
        return cached;
      } else {
        // Cache expired, remove it
        localStorage.removeItem(specificKey);
      }
    }
    
    // Fallback: try latest script if no specific match
    const latestKey = localStorage.getItem('script_latest_key');
    if (latestKey && latestKey !== specificKey) {
      const latestData = localStorage.getItem(latestKey);
      if (latestData) {
        const cached = JSON.parse(latestData) as CachedScriptData;
        const now = Date.now();
        if (cached.timestamp && now - cached.timestamp < CACHE_DURATION) {
          return cached;
        } else {
          localStorage.removeItem(latestKey);
          localStorage.removeItem('script_latest_key');
        }
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to load script from localStorage:', error);
    return null;
  }
}

export default function ScriptPage() {
  const router = useRouter();
  const [data, setData] = useState<GeneratedScriptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [pageTitle, setPageTitle] = useState('Generated Script');

  useEffect(() => {
    const token = localStorage.getItem('sb-xncfghdikiqknuruurfh-auth-token');
    if (!token) {
      setIsRedirecting(true);
      router.push('/auth');
      return;
    }
    
    // Validate token structure before proceeding
    try {
      const parsedToken = JSON.parse(token);
      if (!parsedToken.access_token) {
        // Invalid token structure, redirect immediately
        setIsRedirecting(true);
        localStorage.removeItem('sb-xncfghdikiqknuruurfh-auth-token');
        router.push('/auth');
        return;
      }
    } catch {
      // Invalid token format, redirect immediately
      setIsRedirecting(true);
      localStorage.removeItem('sb-xncfghdikiqknuruurfh-auth-token');
      router.push('/auth');
      return;
    }

    setShouldRender(true);

    const run = async () => {
      setIsLoading(true);
      setError(null);

      let paramsJson: string | null = null;
      let params: GenerationParams | null = null;
      
      // First, try to load from localStorage (for page reloads)
      try {
        // Try to get params from sessionStorage first to identify which script to load
        paramsJson = sessionStorage.getItem('generate_params');
        if (paramsJson) {
          try {
            params = JSON.parse(paramsJson);
          } catch {
            // Invalid params, continue to check localStorage with topic from URL
          }
        }
        
        // If we have params, try loading from localStorage first
        if (params) {
          const cached = loadScriptFromStorage(params.topic, params.ideaTitle);
          if (cached) {
            setData(cached.data);
            if (cached.pageTitle) {
              setPageTitle(cached.pageTitle);
            }
            setIsLoading(false);
            return; // Successfully loaded from cache
          }
        }
        
        // Also check URL params for topic-based loading
        const search = window.location.search;
        const urlParams = new URLSearchParams(search);
        if (urlParams.has('topic')) {
          const topic = urlParams.get('topic') || undefined;
          const cached = loadScriptFromStorage(topic, undefined);
          if (cached) {
            setData(cached.data);
            if (cached.pageTitle) {
              setPageTitle(cached.pageTitle);
            }
            setIsLoading(false);
            return; // Successfully loaded from cache
          }
        }
        
        // If no params found but sessionStorage was also empty, try loading latest script
        // This handles the case where user reloads the page after sessionStorage was cleared
        if (!paramsJson) {
          const latestKey = localStorage.getItem('script_latest_key');
          if (latestKey) {
            const latestData = localStorage.getItem(latestKey);
            if (latestData) {
              const cached = JSON.parse(latestData) as CachedScriptData;
              const now = Date.now();
              if (cached.timestamp && now - cached.timestamp < CACHE_DURATION) {
                setData(cached.data);
                if (cached.pageTitle) {
                  setPageTitle(cached.pageTitle);
                }
                setIsLoading(false);
                return; // Successfully loaded latest script
              }
            }
          }
        }
      } catch (e) {
        console.warn('Error checking localStorage:', e);
      }

      // If not found in localStorage, try sessionStorage or URL params for new generation
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
            const json = await ApiService.generateScript(payload);
            const scriptTitle = json.title || topic || 'Generated Script';
            // Save to localStorage for future reloads
            saveScriptToStorage(payload.topic, payload.ideaTitle, json as GeneratedScriptData, payload, scriptTitle);
            setData(json as GeneratedScriptData);
            setPageTitle(scriptTitle);
            setIsLoading(false);
            return;
          } catch (err) {
            const error = err as Error;
            // Handle unauthorized errors immediately - redirect without showing error
            if (error.message.includes('Unauthorized') || error.message.includes('Not authenticated')) {
              setIsRedirecting(true);
              localStorage.removeItem('sb-xncfghdikiqknuruurfh-auth-token');
              router.push('/auth');
              return;
            }
            console.error('Failed to generate script from URL params:', error);
            setError(error.message || 'Failed to generate script from URL params');
            setIsLoading(false);
            return;
          }
        }

        // If we reach here, no cached script was found and no params available
        // This should only happen on first visit or if cache expired
        setError('No generation parameters found. Please go back and create a script from a topic.');
        setIsLoading(false);
        return;
      }

      if (!params) {
        try {
          params = JSON.parse(paramsJson);
        } catch {
          setError('Invalid generation parameters.');
          setIsLoading(false);
          return;
        }
      }

      // At this point, params is guaranteed to be non-null
      if (!params) {
        setError('Invalid generation parameters.');
        setIsLoading(false);
        return;
      }

      if (params.ideaTitle) {
        setPageTitle(params.ideaTitle);
      }

      try {
        const json = await ApiService.generateScript(params);
        // Use the title from response if available, otherwise use ideaTitle or topic
        const scriptTitle = json.title || params.ideaTitle || params.topic || 'Generated Script';
        // Save to localStorage for future reloads
        saveScriptToStorage(params.topic, params.ideaTitle, json as GeneratedScriptData, params, scriptTitle);
        setData(json as GeneratedScriptData);
        setPageTitle(scriptTitle);
        // optionally clear params so reload won't re-run (but we keep localStorage for reloads)
        try {
          sessionStorage.removeItem('generate_params');
        } catch {
          // Ignore sessionStorage errors
        }
      } catch (err) {
        const error = err as Error;
        // Handle unauthorized errors immediately - redirect without showing error state
        if (error.message.includes('Unauthorized') || error.message.includes('Not authenticated')) {
          setIsRedirecting(true);
          localStorage.removeItem('sb-xncfghdikiqknuruurfh-auth-token');
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

  // Don't render anything if redirecting or not yet validated
  if (!shouldRender || isRedirecting) {
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
      <main className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 sm:py-6 md:py-8">
        {/* Header Section */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 break-words">{data.title || pageTitle}</h1>
          <p className="text-sm sm:text-base text-gray-600">Generated script with comprehensive research and strategic structure</p>
        </div>

        {/* Metrics card */}
        <Card className="shadow-lg mb-4 sm:mb-6">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl">Script Metrics</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Comprehensive analysis of your generated script</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
              <div className="text-center p-2 sm:p-3 bg-gray-50/50 rounded-lg">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-black" />
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{data.metrics?.totalWords ?? data.estimated_word_count ?? 0}</div>
                <div className="text-xs sm:text-sm text-gray-600">Total Words</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-gray-50/50 rounded-lg">
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-black" />
                <div className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate">{data.metrics?.emotionalDepth ?? data.analysis?.emotional_depth ?? '—'}</div>
                <div className="text-xs sm:text-sm text-gray-600">Emotional Depth</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-gray-50/50 rounded-lg">
                <Lightbulb className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-black" />
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{data.metrics?.generalExamples ?? data.analysis?.examples_count ?? 0}</div>
                <div className="text-xs sm:text-sm text-gray-600">Examples</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-gray-50/50 rounded-lg">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-black" />
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{data.metrics?.proverbs ?? 0}</div>
                <div className="text-xs sm:text-sm text-gray-600">Proverbs</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-gray-50/50 rounded-lg">
                <History className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-black" />
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{data.metrics?.historicalFacts ?? 0}</div>
                <div className="text-xs sm:text-sm text-gray-600">Historical Facts</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-gray-50/50 rounded-lg">
                <Search className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-black" />
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{data.metrics?.researchFacts ?? data.analysis?.research_facts_count ?? 0}</div>
                <div className="text-xs sm:text-sm text-gray-600">Research Facts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Left Column - Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-4 sm:gap-6 order-2 lg:order-1">
            {/* Structure - Always visible */}
            <Card className="shadow-lg flex flex-col flex-1 min-h-[250px] lg:min-h-0">
              <CardHeader className="p-4 sm:p-6 pb-3 flex-shrink-0">
                <CardTitle className="text-base sm:text-lg">Script Structure Flow</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Visual representation of your script&apos;s flow and structure</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 flex-1 min-h-0 overflow-hidden flex flex-col">
                {data.structure && data.structure.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3 flex-1 overflow-y-auto pr-2">
                    {data.structure.map((section, index) => (
                      <div key={section.id ?? index} className="flex items-start">
                        <div className="flex flex-col items-center mr-2 sm:mr-3 flex-shrink-0">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-600 text-white flex items-center justify-center text-xs sm:text-sm font-medium">{index + 1}</div>
                          {index < data.structure!.length - 1 && (
                            <div className="w-px bg-gray-200 mt-1 flex-1 min-h-[1rem]" />
                          )}
                        </div>
                        <div className="flex-1 bg-white/50 rounded-lg p-2 sm:p-3 border border-gray-200 min-w-0">
                          <div className="font-medium text-sm sm:text-base break-words">{section.title}</div>
                          <div className="text-xs text-gray-500 mt-1">{section.duration} • {section.words ?? '—'} words</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-6">
                    <div className="text-gray-400 text-sm">
                      <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No structure data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sources - Always visible */}
            <Card className="shadow-lg flex flex-col flex-1 min-h-[250px] lg:min-h-0">
              <CardHeader className="p-4 sm:p-6 pb-3 flex-shrink-0">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Research Sources
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Credible sources and references used in this script</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 flex-1 min-h-0 overflow-hidden flex flex-col">
                {data.source_urls && data.source_urls.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3 flex-1 overflow-y-auto pr-2">
                    {data.source_urls.map((url, index) => (
                      <div key={index} className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-black mt-0.5 sm:mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm text-gray-800 hover:underline break-all">
                            {url}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-6">
                    <div className="text-gray-400 text-sm">
                      <LinkIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No sources available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <Card className="shadow-lg">
              <CardHeader className="p-4 sm:p-6 pb-3">
                <div className="flex flex-col space-y-3 sm:space-y-4">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Script Synopsis</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Comprehensive overview of your script content and approach
                    </CardDescription>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <Button size="sm" className="bg-gradient-to-r from-gray-600 to-gray-800 text-white hover:from-gray-700 hover:to-black text-xs sm:text-sm" onClick={() => { /* view full script action */ }}>
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden sm:inline">View Full Script</span>
                      <span className="sm:hidden">View</span>
                    </Button>

                    <Button size="sm" variant="outline" className="text-xs sm:text-sm">
                      Translate
                    </Button>

                    <Button size="sm" variant="outline" className="text-xs sm:text-sm" onClick={() => { /* teleprompter */ }}>
                      <Monitor className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden sm:inline">Teleprompter</span>
                      <span className="sm:hidden">Prompt</span>
                    </Button>

                    <Button size="sm" variant="outline" className="text-xs sm:text-sm" onClick={() => { /* download */ }}>
                      <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="min-h-[600px] sm:min-h-[700px] md:min-h-[800px] lg:min-h-[900px] max-h-[90vh] overflow-y-auto pr-2">5
                  <div className="prose prose-sm max-w-none">
                    <div className="text-gray-700 leading-relaxed text-sm sm:text-base">
                      {formatScript(data.synopsis || data.script || 'No synopsis available.')}
                    </div>
                  </div>
                </div>
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
