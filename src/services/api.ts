// API service for StoryBit AI backend integration

export interface ProcessTopicRequest {
  topic: string;
}

export interface ProcessTopicResponse {
  ideas: string[];
  descriptions: string[];
}

export interface SignUpRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface SignUpResponse {
  id: string;
  aud: string;
  role: string;
  email: string;
  email_confirmed_at: string;
  phone: string;
  confirmed_at: string;
  last_sign_in_at: string;
  app_metadata: {
    provider: string;
    providers: string[];
  };
  user_metadata: {
    full_name: string;
  };
  identities: {
    identity_id: string;
    id: string;
    user_id: string;
    identity_data: {
      email: string;
      email_verified: boolean;
      phone_verified: boolean;
      sub: string;
    };
    provider: string;
    last_sign_in_at: string;
    created_at: string;
    updated_at: string;
  }[];
  created_at: string;
  updated_at: string;
}

export interface GenerationParams {
  topic?: string;
  ideaTitle?: string;
  duration_minutes?: number;
  length?: number;
}

export type GeneratedScriptData = {
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

export class ApiService {
  // Use Next.js API routes in both development and production
  private static readonly BASE_URL = '/api';
  
  // Check if we're in production and handle CORS issues
  private static isProduction = process.env.NODE_ENV === 'production';

  private static handleUnauthorized(): void {
    if (typeof window !== 'undefined') {
      // Clear authentication tokens from localStorage
      localStorage.removeItem('sb-xncfghdikiqknuruurfh-auth-token');
      
      // Redirect to the authentication page
      window.location.href = '/auth';
    }
  }

  private static getAuthToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
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
  }

  static async processTopic(topic: string, retryCount = 0): Promise<ProcessTopicResponse> {
    const maxRetries = 2;
    const retryDelay = 5000; // 5 seconds
    
    try {
      const apiUrl = `${this.BASE_URL}/process-topic`;
      console.log('Making API request to:', apiUrl);
      console.log('Request payload:', { topic });
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout
      
      let response;
      try {
        const token = this.getAuthToken();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        response = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ topic }),
          signal: controller.signal,
          mode: 'cors', // Explicitly set CORS mode
        });
      } catch (fetchError) {
        // Handle CORS errors specifically
        if (this.isProduction && fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
          console.warn('CORS error detected in production, using fallback data');
          return this.getFallbackData(topic);
        }
        throw fetchError;
      }
      
      clearTimeout(timeoutId);
      console.log('API Response status:', response.status);
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()));

      // Handle 502 Bad Gateway with retry
      if (response.status === 502 && retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.processTopic(topic, retryCount + 1);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        console.error('Full response:', response);
        
        // Special handling for different error types
        if (response.status === 405) {
          throw new Error('Method Not Allowed (405). The API endpoint may not support POST requests or the endpoint URL is incorrect. Please check your API configuration.');
        }
        
        if (response.status === 502) {
          throw new Error('Server temporarily unavailable (502 Bad Gateway). The API server may be starting up or overloaded. Please try again in a few minutes.');
        }
        
        if (response.status === 404) {
          throw new Error('API endpoint not found (404). Please check if the API URL is correct and the endpoint exists.');
        }
        
        if (response.status === 500) {
          throw new Error('Internal server error (500). The API server encountered an error processing your request.');
        }

        if (response.status === 401) {
          this.handleUnauthorized();
          throw new Error('Unauthorized');
        }
        
        throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const data = await response.json();
      
      // Return only the fields we need, excluding the unwanted ones
      return {
        ideas: data.ideas || [],
        descriptions: data.descriptions || [],
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - API took too long to respond (up to 2 minutes)');
      }
      
      // Handle CORS and network errors
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        if (this.isProduction) {
          console.warn('CORS/Network error in production, falling back to sample data');
          // Return sample data instead of throwing error in production
          return this.getFallbackData(topic);
        }
        throw new Error('Network error: Unable to connect to the API server. This might be a CORS issue or the server is down.');
      }
      
      if (error instanceof Error && error.message.includes('CORS')) {
        if (this.isProduction) {
          console.warn('CORS error in production, falling back to sample data');
          return this.getFallbackData(topic);
        }
        throw new Error('CORS error: The API server needs to allow requests from this domain. Please check your backend CORS configuration.');
      }
      
      throw error;
    }
  }

  static async generateScript(params: GenerationParams, retryCount = 0): Promise<GeneratedScriptData> {
    const maxRetries = 2;
    const retryDelay = 5000; // 5 seconds
    
    try {
      const apiUrl = `${this.BASE_URL}/generate-script`;
      console.log('Making API request to:', apiUrl);
      console.log('Request payload:', params);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout
      
      let response;
      try {
        const token = this.getAuthToken();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        response = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(params),
          signal: controller.signal,
          mode: 'cors', // Explicitly set CORS mode
        });
      } catch (fetchError) {
        // Handle CORS errors specifically
        if (this.isProduction && fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
          console.warn('CORS error detected in production, returning empty script');
          return { 
            script: 'Error generating script due to network issues.', 
            estimated_word_count: 0, 
            source_urls: [], 
            analysis: {
              examples_count: 0,
              research_facts_count: 0,
              proverbs_count: 0,
              emotional_depth: 'N/A'
            } 
          };
        }
        throw fetchError;
      }
      
      clearTimeout(timeoutId);
      console.log('API Response status:', response.status);
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()));

      // Handle 502 Bad Gateway with retry
      if (response.status === 502 && retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.generateScript(params, retryCount + 1);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        console.error('Full response:', response);
        
        // Special handling for different error types
        if (response.status === 405) {
          throw new Error('Method Not Allowed (405). The API endpoint may not support POST requests or the endpoint URL is incorrect. Please check your API configuration.');
        }
        
        if (response.status === 502) {
          throw new Error('Server temporarily unavailable (502 Bad Gateway). The API server may be starting up or overloaded. Please try again in a few minutes.');
        }
        
        if (response.status === 404) {
          throw new Error('API endpoint not found (404). Please check if the API URL is correct and the endpoint exists.');
        }
        
        if (response.status === 500) {
          throw new Error('Internal server error (500). The API server encountered an error processing your request.');
        }

        if (response.status === 401) {
          this.handleUnauthorized();
          throw new Error('Unauthorized');
        }
        
        throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - API took too long to respond (up to 2 minutes)');
      }
      
      // Handle CORS and network errors
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        if (this.isProduction) {
          console.warn('CORS/Network error in production, returning empty script');
          return { 
            script: 'Error generating script due to network issues.', 
            estimated_word_count: 0, 
            source_urls: [], 
            analysis: {
              examples_count: 0,
              research_facts_count: 0,
              proverbs_count: 0,
              emotional_depth: 'N/A'
            } 
          };
        }
        throw new Error('Network error: Unable to connect to the API server. This might be a CORS issue or the server is down.');
      }
      
      if (error instanceof Error && error.message.includes('CORS')) {
        if (this.isProduction) {
          console.warn('CORS error in production, returning empty script');
          return { 
            script: 'Error generating script due to network issues.', 
            estimated_word_count: 0, 
            source_urls: [], 
            analysis: {
              examples_count: 0,
              research_facts_count: 0,
              proverbs_count: 0,
              emotional_depth: 'N/A'
            } 
          };
        }
        throw new Error('CORS error: The API server needs to allow requests from this domain. Please check your backend CORS configuration.');
      }
      
      throw error;
    }
  }

  // Fallback data generator for when API is unavailable
  private static getFallbackData(topic: string): ProcessTopicResponse {
    const ideas = [
      `Understanding ${topic}: A Comprehensive Analysis`,
      `The Impact of ${topic} on Modern Society`,
      `Future Trends: Where ${topic} is Heading`,
      `Breaking Down ${topic}: Key Insights and Perspectives`,
      `The Science Behind ${topic}: What You Need to Know`,
      `${topic} in the Digital Age: Opportunities and Challenges`,
      `Global Perspectives on ${topic}: A Worldwide View`,
      `The Economics of ${topic}: Market Analysis and Trends`,
      `${topic} and Sustainability: Environmental Considerations`,
      `Innovation in ${topic}: Latest Developments and Breakthroughs`
    ];

    const descriptions = [
      `Dive deep into the world of ${topic} and explore its various aspects, implications, and real-world applications. This comprehensive analysis will provide you with valuable insights and perspectives that will help you understand the topic from multiple angles.`,
      `Explore how ${topic} is shaping our world today and what it means for the future. This analysis covers social implications, economic effects, and cultural changes brought about by this trending topic.`,
      `Get a glimpse into the future of ${topic} and discover what experts predict will happen next. This forward-looking analysis examines emerging trends, potential developments, and what to expect in the coming years.`,
      `Break down the complex aspects of ${topic} into digestible insights. This analysis provides key perspectives and actionable information that will help viewers understand the topic's significance and impact.`,
      `Explore the scientific foundations of ${topic} and understand the research behind current developments. This analysis combines expert knowledge with accessible explanations for a broad audience.`,
      `Examine how ${topic} is evolving in our digital world. This analysis looks at technological influences, digital transformation, and the opportunities and challenges that come with modern advancements.`,
      `Take a global perspective on ${topic} and understand how different cultures and regions approach this topic. This analysis provides a worldwide view of trends, practices, and cultural differences.`,
      `Analyze the economic aspects of ${topic} and understand market dynamics, financial implications, and business opportunities. This analysis covers market trends, investment potential, and economic impact.`,
      `Explore the environmental and sustainability aspects of ${topic}. This analysis examines ecological considerations, sustainable practices, and the environmental impact of current trends and developments.`,
      `Discover the latest innovations and breakthroughs in ${topic}. This analysis covers cutting-edge developments, technological advances, and emerging solutions that are shaping the future of this field.`
    ];

    return {
      ideas,
      descriptions
    };
  }

  static async signUp(request: SignUpRequest): Promise<SignUpResponse> {
    const url = `https://xncfghdikiqknuruurfh.supabase.co/auth/v1/signup`;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!anonKey) {
      throw new Error('Supabase anon key is not defined.');
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
        },
        body: JSON.stringify({
          email: request.email,
          password: request.password,
          data: {
            full_name: request.full_name,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_description || 'Sign-up failed.');
      }

      return await response.json();
    } catch (error) {
      console.error('Sign-up error:', error);
      throw error;
    }
  }
}
