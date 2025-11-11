'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, Clock, TrendingUp, Search } from 'lucide-react';
import { ApiService } from '@/services/api';
import { ScriptGenerationModal, ScriptGenerationParams } from '@/components/ScriptGenerationModal';


interface ScriptIdea {
  id: number;
  title: string;
  description: string;
  category: string;
}

const overviewProducts = [
  { id: '001', name: 'Product A', category: 'Electronics', price: '$299', stock: 45, status: 'Active' },
  { id: '002', name: 'Product B', category: 'Furniture', price: '$599', stock: 23, status: 'Active' },
  { id: '003', name: 'Product C', category: 'Clothing', price: '$89', stock: 120, status: 'Active' },
  { id: '004', name: 'Product D', category: 'Electronics', price: '$449', stock: 67, status: 'Low Stock' },
  { id: '005', name: 'Product E', category: 'Home', price: '$159', stock: 89, status: 'Active' },
] as const;

const overviewMetrics = [
  { metric: 'Total Sales', value: '$45,231', change: '+12.5%' },
  { metric: 'Orders', value: '1,234', change: '+8.2%' },
  { metric: 'Customers', value: '892', change: '+15.3%' },
  { metric: 'Revenue', value: '$89,432', change: '+10.1%' },
  { metric: 'Conversion', value: '3.24%', change: '+2.4%' },
] as const;

const performanceVideos = [
  { id: 'V001', title: 'Introduction Tutorial', views: '12,345', duration: '5:23', rating: '4.8' },
  { id: 'V002', title: 'Advanced Features', views: '8,901', duration: '8:15', rating: '4.6' },
  { id: 'V003', title: 'Best Practices Guide', views: '15,678', duration: '6:42', rating: '4.9' },
  { id: 'V004', title: 'Tips and Tricks', views: '10,234', duration: '7:11', rating: '4.7' },
] as const;

const performanceCategories = [
  { category: 'Tutorials', count: 45 },
  { category: 'Reviews', count: 32 },
  { category: 'Guides', count: 28 },
  { category: 'Comparisons', count: 24 },
  { category: 'Interviews', count: 18 },
  { category: 'Behind the Scenes', count: 14 },
] as const;

const performanceKeywords = [
  { keyword: 'Tutorial', value: 100 },
  { keyword: 'Review', value: 70 },
  { keyword: 'Guide', value: 60 },
  { keyword: 'Tips', value: 45 },
  { keyword: 'Demo', value: 40 },
] as const;

const monthlyReports = [
  { month: 'January', revenue: '$24,500', growth: '+5.2%' },
  { month: 'February', revenue: '$28,900', growth: '+18.0%' },
  { month: 'March', revenue: '$31,200', growth: '+8.0%' },
] as const;

const regionalSales = [
  { region: 'North America', sales: '$145,230' },
  { region: 'Europe', sales: '$98,450' },
  { region: 'Asia Pacific', sales: '$123,890' },
  { region: 'Latin America', sales: '$56,780' },
  { region: 'Middle East', sales: '$34,210' },
] as const;

const monthlyHighlights = [
  'Revenue increased by 15% compared to last quarter',
  'New customer acquisition grew by 23%',
  'Average order value increased to $342',
  'Customer satisfaction rate reached 94%',
  'Product returns decreased by 8%',
] as const;

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
  const [searchQuery, setSearchQuery] = useState(topic);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'monthly'>('overview');

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
      } catch {
        console.warn('Failed to persist generate params to sessionStorage');
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
    setSearchQuery(topic);
  }, [topic]);

  const handleSearchSubmit = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    router.push(`/search/${encodeURIComponent(trimmed)}`);
  };

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

      const maxWaitMs = 300000; // 5 minutes
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

          if (elapsed > 300000 && !isCancelled) { // 5 minutes timeout
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

      {/* Search Section */}
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 mt-4">
        <div className="w-full shadow-lg border border-gray-400 rounded-lg">
          <div className="relative flex items-center">
                 <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 z-10" />
                 <Input
                   type="text"
                   placeholder="Search for topics, current events, and documentary ideas"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') {
                       e.preventDefault();
                       handleSearchSubmit();
                     }
                   }}
                   className="pl-10 sm:pl-12 md:pl-14 pr-20 sm:pr-24 md:pr-32 py-4 sm:py-5 md:py-7 text-xs sm:text-sm md:text-lg rounded-lg border-0 bg-white text-black placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-gray-400 font-sans w-full"
                 />
                 <Button
                   onClick={handleSearchSubmit}
                   className="absolute right-1.5 sm:right-2 top-1/2 transform -translate-y-1/2 rounded-lg bg-black text-white hover:bg-gray-800 hover:shadow-xl hover:scale-105 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-xs sm:text-sm md:text-lg font-medium font-sans transition-all duration-300 ease-in-out"
                 >
                   <span className="hidden sm:inline">Generate Ideas</span>
                   <span className="sm:hidden">Generate</span>
                 </Button>
          </div>
        </div>
      </div>

      {/* Dashboard Analytics Section */}
      <section className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 mt-8">
        <Card className="shadow-xl border border-gray-200 bg-white h-[600px] overflow-hidden flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-2 mb-2">
              <CardTitle className="text-xs sm:text-sm font-semibold text-gray-900 bg-gray-100 p-2 rounded-lg">Summary:</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {[
                { key: 'overview', label: 'Overview Dashboard' },
                { key: 'performance', label: 'Performance Analytics' },
                { key: 'monthly', label: 'Monthly Reports' },
              ].map((tab) => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? 'default' : 'outline'}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`rounded-full px-4 sm:px-6 ${
                    activeTab === tab.key
                      ? 'bg-[#3B5BFF] text-white hover:bg-[#2E47CC]'
                      : 'border border-gray-200 text-gray-600 hover:text-gray-900'
                  }`}
                  size="sm"
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden pr-1 pb-6">
            <div className="flex h-full flex-col overflow-hidden">
              {activeTab === 'overview' && (
              <div className="flex h-full flex-col space-y-6 overflow-hidden">
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" className="rounded-full border-gray-200 text-gray-600 hover:text-gray-900">
                    Filter by Category
                  </Button>
                  <Button variant="outline" className="rounded-full border-gray-200 text-gray-600 hover:text-gray-900">
                    Filter by Status
                  </Button>
                </div>
                 <div className="grid gap-6 xl:grid-cols-[2fr_1fr] flex-1 min-h-0">
                   <div className="rounded-2xl border border-gray-100 shadow-inner flex flex-col overflow-hidden min-h-0">
                     <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-[#F5F7FB]">
                          <tr className="text-left text-xs sm:text-sm text-gray-500">
                            <th className="px-4 sm:px-6 py-4 font-semibold">ID</th>
                            <th className="px-4 sm:px-6 py-4 font-semibold">Name</th>
                            <th className="px-4 sm:px-6 py-4 font-semibold">Category</th>
                            <th className="px-4 sm:px-6 py-4 font-semibold">Price</th>
                            <th className="px-4 sm:px-6 py-4 font-semibold">Stock</th>
                            <th className="px-4 sm:px-6 py-4 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm sm:text-base text-gray-700">
                          {overviewProducts.map((product) => (
                            <tr key={product.id} className="bg-white hover:bg-[#F9FAFE] transition">
                              <td className="px-4 sm:px-6 py-4 font-semibold text-gray-900">{product.id}</td>
                              <td className="px-4 sm:px-6 py-4">{product.name}</td>
                              <td className="px-4 sm:px-6 py-4">{product.category}</td>
                              <td className="px-4 sm:px-6 py-4">{product.price}</td>
                              <td className="px-4 sm:px-6 py-4">{product.stock}</td>
                              <td className="px-4 sm:px-6 py-4">
                                <Badge
                                  className={`px-3 py-1 rounded-full ${
                                    product.status === 'Active'
                                      ? 'bg-[#E9F2FF] text-[#2F6BFF]'
                                      : 'bg-[#FFE6E6] text-[#D64545]'
                                  }`}
                                >
                                  {product.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                   <div className="rounded-2xl border border-gray-100 shadow-inner flex flex-col min-h-0">
                     <div className="p-4 sm:p-6 flex-1 overflow-y-auto min-h-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Metrics</h3>
                      <div className="space-y-4">
                        {overviewMetrics.map((metric) => (
                          <div key={metric.metric} className="flex items-center justify-between text-sm sm:text-base">
                            <div className="flex-1">
                              <p className="font-medium text-gray-700">{metric.metric}</p>
                              <p className="text-gray-900 text-lg font-semibold">{metric.value}</p>
                            </div>
                            <span className="text-[#288B4A] font-semibold">{metric.change}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="flex h-full flex-col space-y-6 overflow-hidden">
                <div className="grid flex-1 min-h-0 gap-6 md:grid-cols-2 md:grid-rows-2">
                  <div className="rounded-2xl border border-gray-100 shadow-inner flex flex-col overflow-hidden min-h-0">
                    <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-[#F5F7FB] text-xs sm:text-sm text-gray-500">
                          <tr>
                            <th className="px-4 sm:px-6 py-4 font-semibold text-left">Video ID</th>
                            <th className="px-4 sm:px-6 py-4 font-semibold text-left">Title</th>
                            <th className="px-4 sm:px-6 py-4 font-semibold text-left">Views</th>
                            <th className="px-4 sm:px-6 py-4 font-semibold text-left">Duration</th>
                            <th className="px-4 sm:px-6 py-4 font-semibold text-left">Rating</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm sm:text-base text-gray-700">
                          {performanceVideos.map((video) => (
                            <tr key={video.id} className="bg-white hover:bg-[#F9FAFE] transition">
                              <td className="px-4 sm:px-6 py-4 font-semibold text-gray-900">{video.id}</td>
                              <td className="px-4 sm:px-6 py-4">{video.title}</td>
                              <td className="px-4 sm:px-6 py-4">{video.views}</td>
                              <td className="px-4 sm:px-6 py-4">{video.duration}</td>
                              <td className="px-4 sm:px-6 py-4">{video.rating}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-100 shadow-inner flex flex-col overflow-hidden min-h-0">
                    <div className="p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Category</h3>
                      <div className="space-y-3 text-sm sm:text-base">
                        {performanceCategories.map((item) => (
                          <div key={item.category} className="flex items-center justify-between rounded-lg bg-[#F7F9FE] px-4 py-3">
                            <span className="text-gray-600">{item.category}</span>
                            <span className="font-semibold text-gray-900">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-100 shadow-inner flex flex-col overflow-hidden min-h-0">
                    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
                      <div className="grid gap-4 sm:grid-cols-3">
                        {[1, 2, 3].map((number) => (
                          <div
                            key={number}
                            className="rounded-2xl border border-dashed border-[#AEB8FF] bg-gradient-to-br from-[#E8EDFF] to-white p-6 text-center shadow-md"
                          >
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-inner">
                              <div className="h-0 w-0 border-l-[12px] border-l-transparent border-t-[18px] border-t-[#3B5BFF] border-r-[12px] border-r-transparent" />
                            </div>
                            <p className="text-lg font-semibold text-gray-900">Video {number}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-100 shadow-inner flex flex-col overflow-hidden min-h-0">
                    <div className="p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Keywords</h3>
                      <div className="space-y-3">
                        {performanceKeywords.map((keyword) => (
                          <div key={keyword.keyword} className="space-y-2">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>{keyword.keyword}</span>
                              <span className="font-medium text-gray-900">{keyword.value}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-[#E6ECFF] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#3B5BFF]"
                                style={{ width: `${keyword.value}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'monthly' && (
              <div className="flex h-full flex-col space-y-6 overflow-hidden">
                <div className="grid flex-1 min-h-0 gap-6 md:grid-cols-2 md:grid-rows-2">
                  <div className="rounded-2xl border border-gray-100 shadow-inner flex flex-col overflow-hidden min-h-0">
                    <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-[#F5F7FB] text-xs sm:text-sm text-gray-500">
                          <tr>
                            <th className="px-4 sm:px-6 py-4 font-semibold text-left">Month</th>
                            <th className="px-4 sm:px-6 py-4 font-semibold text-left">Revenue</th>
                            <th className="px-4 sm:px-6 py-4 font-semibold text-left">Growth</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm sm:text-base text-gray-700">
                          {monthlyReports.map((report) => (
                            <tr key={report.month} className="bg-white hover:bg-[#F9FAFE] transition">
                              <td className="px-4 sm:px-6 py-4 font-semibold text-gray-900">{report.month}</td>
                              <td className="px-4 sm:px-6 py-4">{report.revenue}</td>
                              <td className="px-4 sm:px-6 py-4 text-[#288B4A] font-semibold">{report.growth}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-100 shadow-inner flex flex-col overflow-hidden min-h-0">
                    <div className="p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Region</h3>
                      <div className="space-y-3 text-sm sm:text-base">
                        {regionalSales.map((region) => (
                          <div key={region.region} className="flex items-center justify-between rounded-lg bg-[#F7F9FE] px-4 py-3">
                            <span className="text-gray-600">{region.region}</span>
                            <span className="font-semibold text-gray-900">{region.sales}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-100 shadow-inner flex flex-col overflow-hidden min-h-0">
                    <div className="flex flex-1 min-h-0 flex-col items-center justify-center p-8 overflow-y-auto">
                      <div className="relative flex items-center justify-center">
                        <div className="h-40 w-40 rounded-full border-[18px] border-[#EFF2FF] shadow-inner" />
                        <div className="absolute h-28 w-28 rounded-full border-[12px] border-[#3B5BFF]/80 shadow-md" />
                        <div className="absolute flex h-16 w-16 items-center justify-center rounded-full bg-white shadow">
                          <span className="text-lg font-semibold text-gray-900">100%</span>
                        </div>
                      </div>
                      <p className="mt-4 text-sm sm:text-base text-gray-600">Total Allocation</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-100 shadow-inner flex flex-col overflow-hidden min-h-0">
                    <div className="p-6 flex-1 min-h-0 overflow-y-auto">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Highlights</h3>
                      <ul className="space-y-3 text-sm sm:text-base text-gray-600">
                        {monthlyHighlights.map((highlight) => (
                          <li key={highlight} className="flex items-start gap-2">
                            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#3B5BFF]" />
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </CardContent>
        </Card>
      </section>


      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Script Ideas for:{" "}
            <br className="sm:hidden" />
            <span className="inline-block bg-black text-white px-2 py-1 rounded font-semibold mt-2 sm:mt-0">
              {topic}
            </span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Choose from various problem statements and perspectives for your YouTube script</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Card className="shadow-lg lg:sticky lg:top-24">
              <CardContent className="space-y-6 pt-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">Category</label>
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
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <p className="text-sm sm:text-base text-gray-600">{isLoading ? 'Loading script ideas...' : `Found ${filtered.length} script ideas`}</p>
            </div>

            {isLoading && (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-black" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Script Ideas</h3>
                      <p className="text-gray-600">Our AI is analyzing &quot;{topic}&quot; and creating personalized script ideas for you...</p>
                      <p className="text-sm text-gray-500 mt-2">This may take up to 5 minutes</p>
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
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
                        <div className="flex-1 w-full">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-2">
                            <CardTitle className="text-lg sm:text-xl">
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
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <Badge variant="secondary">{statement.category}</Badge>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                          <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium text-gray-700">Length (min):</label>
                            <Input type="number" placeholder="10" value={videoLengths[statement.id] || ''} onChange={(e) => handleVideoLengthChange(statement.id, e.target.value)} className="w-20" min={1} max={60} />
                          </div>
                          <Button onClick={() => handleGenerateScript(statement)} className="bg-gradient-to-r from-gray-500 to-black hover:from-gray-600 hover:to-black text-white font-semibold w-full sm:w-auto" disabled={!videoLengths[statement.id]?.trim()} size="sm">
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
