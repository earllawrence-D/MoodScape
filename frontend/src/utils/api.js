import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) {
  console.error("❌ VITE_API_URL is NOT defined! Frontend is using localhost.");
}


// Create main axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000, // 30 second timeout for regular requests
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    
    // Handle 401 Unauthorized
    if (response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Handle network errors
    if (!response) {
      console.error('Network error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        isNetworkError: true
      });
    }
    
    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers['retry-after'] || 60;
      console.warn(`Rate limited. Retry after ${retryAfter} seconds.`);
      return Promise.reject({
        message: 'Too many requests. Please wait a moment.',
        status: 429,
        retryAfter
      });
    }
    
    return Promise.reject(error);
  }
);

// Special axios instance for streaming with longer timeout
const streamingApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream'
  },
  timeout: 120000, // 2 minute timeout for streaming
  responseType: 'stream' // For EventSource compatibility
});

streamingApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// EventSource wrapper for server-sent events
const createEventSource = (url, options = {}) => {
  const token = localStorage.getItem('token');
  const eventSourceUrl = new URL(url, API_URL);
  
  if (token) {
    eventSourceUrl.searchParams.set('token', token);
  }
  
  const eventSource = new EventSource(eventSourceUrl.toString(), options);
  
  // Add auth header if using custom EventSource implementation
  if (options.headers) {
    // Note: EventSource doesn't support custom headers in browser
    // This is handled via URL params or cookies
  }
  
  return eventSource;
};

// API endpoints
export const authAPI = {
  // USER
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),

  // THERAPIST (✔ FIXED)
  registerTherapist: (data) => api.post('/auth/therapist/register', data),
  loginTherapist: (data) => api.post('/auth/therapist/login', data),

  // COMMON
  getProfile: () => api.get('/auth/profile'),
  refreshToken: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout')
};


export const journalAPI = {
  create: (data) => api.post('/journals', data),
  getAll: (params) => api.get('/journals', { params }),
  getStats: (params) => api.get('/journals/stats', { params }),
  update: (id, data) => api.put(`/journals/${id}`, data),
  delete: (id) => api.delete(`/journals/${id}`),
  export: (params) => api.get('/journals/export', { 
    params,
    responseType: 'blob' // For file downloads
  })
};

export const aiAPI = {
  // Legacy chat endpoint (non-streaming)
  chat: (data) => api.post('/ai/chat', data),
  
  // Streaming chat endpoint
  chatStream: (data) => {
    return new Promise((resolve, reject) => {
      try {
        const token = localStorage.getItem('token');
        const url = new URL('/ai/chat-stream', API_URL);
        
        const eventSource = createEventSource(url.toString(), {
          withCredentials: true
        });
        
        // Store the event source for cleanup
        aiAPI.currentEventSource = eventSource;
        
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Handle different event types
            switch (data.type) {
              case 'sentence':
                if (typeof data.content === 'string') {
                  // Emit sentence event
                  if (aiAPI.onSentence) {
                    aiAPI.onSentence(data.content, data.isFirst || false, data.isComplete || false);
                  }
                }
                break;
                
              case 'complete':
                eventSource.close();
                resolve({
                  success: true,
                  fullResponse: data.fullResponse,
                  conversationId: data.conversationId,
                  sentenceCount: data.sentenceCount
                });
                break;
                
              case 'error':
                eventSource.close();
                reject(new Error(data.content || 'Streaming error'));
                break;
                
              case 'end':
                eventSource.close();
                if (!data.error) {
                  resolve({ success: true, completed: true });
                }
                break;
            }
          } catch (parseError) {
            console.error('Error parsing SSE data:', parseError);
            eventSource.close();
            reject(parseError);
          }
        };
        
        eventSource.onerror = (error) => {
          console.error('EventSource error:', error);
          eventSource.close();
          reject(new Error('Stream connection failed'));
        };
        
        eventSource.onopen = () => {
          console.log('EventSource connection opened');
          // Send the actual message via a separate POST request
          // This keeps the EventSource connection clean for receiving
          api.post('/ai/chat-stream-init', {
            message: data.message,
            systemPrompt: data.systemPrompt
          }).catch(err => {
            console.error('Failed to initiate chat stream:', err);
            eventSource.close();
            reject(err);
          });
        };
        
        // Set timeout for stream
        setTimeout(() => {
          if (eventSource.readyState !== EventSource.CLOSED) {
            eventSource.close();
            reject(new Error('Stream timeout'));
          }
        }, 60000); // 60 second timeout for streams
        
      } catch (error) {
        reject(error);
      }
    });
  },
  
  // Alternative: Use fetch API for streaming with better control
  chatStreamFetch: async (data) => {
    const token = localStorage.getItem('token');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    try {
      const response = await fetch(`${API_URL}/ai/chat-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      return {
        stream: reader,
        async *[Symbol.asyncIterator]() {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.substring(6));
                    yield data;
                  } catch (e) {
                    console.warn('Failed to parse SSE line:', line);
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
        },
        cancel: () => controller.abort()
      };
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  },
  
  // Helper to cancel ongoing stream
  cancelStream: () => {
    if (aiAPI.currentEventSource) {
      aiAPI.currentEventSource.close();
      aiAPI.currentEventSource = null;
    }
  },
  
  // Event handlers
  onSentence: null,
  currentEventSource: null,
  
  // Existing endpoints
  getHistory: (params) => api.get('/ai/history', { params }),
  clearHistory: () => api.delete('/ai/history'),
  
  // TTS endpoints
  generateTTS: (data) => api.post('/ai/tts', data, {
    responseType: 'arraybuffer' // For audio data
  }),
  
  // Audio transcription
  transcribeAudio: (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    
    return api.post('/audio/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

export const communityAPI = {
  getPosts: (params) => api.get('/community', { params }),
  createPost: (data) => api.post('/community', data),
  likePost: (id) => api.post(`/community/${id}/like`),
  deletePost: (id) => api.delete(`/community/${id}`),
  votePost: (id, { type }) => api.post(`/community/${id}/vote`, { type }),
  getComments: (postId) => api.get(`/community/${postId}/comments`),
  addComment: (postId, data) => api.post(`/community/${postId}/comments`, data),
  deleteComment: (postId, commentId) => api.delete(`/community/${postId}/comments/${commentId}`),
  reportPost: (postId, reason) => api.post(`/community/${postId}/report`, { reason }),
  getCategories: () => api.get('/community/categories'),
  getTrending: () => api.get('/community/trending')
};

export const analyticsAPI = {
  getMoodTrends: (params) => api.get('/analytics/mood-trends', { params }),
  getActivityReport: (params) => api.get('/analytics/activity', { params }),
  getEngagementMetrics: () => api.get('/analytics/engagement'),
  exportData: (params) => api.get('/analytics/export', {
    params,
    responseType: 'blob'
  })
};

export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  updateSettings: (data) => api.put('/user/settings', data),
  changePassword: (data) => api.put('/user/password', data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteAccount: () => api.delete('/user/account'),

  // ✅ Add this:
  submitFeedback: (data) => api.post('/feedback', data)
};



// Utility functions
export const apiUtils = {
  // Retry wrapper with exponential backoff
  retry: async (fn, maxRetries = 3, delay = 1000) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on 4xx errors (except 429)
        if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
          throw error;
        }
        
        if (i < maxRetries - 1) {
          const backoffDelay = delay * Math.pow(2, i);
          console.log(`Retry ${i + 1}/${maxRetries} after ${backoffDelay}ms`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
    }
    
    throw lastError;
  },
  
  // Debounce API calls
  debounce: (fn, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      return new Promise((resolve) => {
        timeoutId = setTimeout(() => resolve(fn(...args)), delay);
      });
    };
  },
  
  // Cancel token utility
  createCancelToken: () => {
    return axios.CancelToken.source();
  },
  
  // Check if error is a cancel error
  isCancel: (error) => {
    return axios.isCancel(error);
  }
};

// Export default instance
export default api;

// Export streaming utilities separately
export const streamAPI = {
  createEventSource,
  streamingApi
};

export const harmfulWordAPI = {
  check: (data) => api.post('/harmful-words/check', data), // POST { content: "..." }
};
// ----------------------
// Admin API
// ----------------------
export const adminAPI = {
  // Admin profile
  getProfile: () => api.get('/admin/profile'), // ← use the existing user profile route

  // Manage users
  getUsers: () => api.get('/admin/users'),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  // Manage feedback
  getFeedback: () => api.get('/admin/feedback'),
  deleteFeedback: (id) => api.delete(`/admin/feedback/${id}`),

  // Add other admin-specific endpoints here
};
