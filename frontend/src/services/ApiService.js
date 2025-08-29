import axios from 'axios';

const API_BASE_URL = '/api';  // Using relative path for proxy
const RECONNECT_DELAY = 5000; // 5 seconds delay between reconnection attempts
const MAX_RETRIES = 3;

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // Increased timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      // Retry configuration
      retry: MAX_RETRIES,
      retryDelay: RECONNECT_DELAY
    });
    
    // Initialize cache
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds cache timeout
    
    // Track backend availability
    this.isBackendAvailable = true;
    this.checkBackendAvailability();

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor with retry logic
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        const config = error.config;
        
        if (!config || !config.retry) {
          return Promise.reject(error);
        }
        
        config.retryCount = config.retryCount || 0;
        
        if (config.retryCount >= config.retry) {
          return Promise.reject(error);
        }
        
        config.retryCount += 1;
        const delayTime = config.retryDelay || RECONNECT_DELAY;
        
        console.warn(`Retrying request (${config.retryCount}/${config.retry}) after ${delayTime}ms`);
        await new Promise(resolve => setTimeout(resolve, delayTime));
        
        return this.api(config);
      }
    );
  }

  // Stock API methods
  async getStockQuote(symbol) {
    const cacheKey = `quote_${symbol}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.api.get(`/stocks/${symbol}/quote`);
      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('Too many requests. Please try again in a moment.');
      }
      throw error;
    }
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  async getLatestStockData(symbol) {
    const response = await this.api.get(`/stocks/${symbol}/latest`);
    return response.data;
  }

  async getHistoricalData(symbol, startDate, endDate) {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await this.api.get(`/stocks/${symbol}/history`, { params });
    return response.data;
  }

  async getRecentData(symbol, limit = 30) {
    const response = await this.api.get(`/stocks/${symbol}/recent`, {
      params: { limit }
    });
    return response.data;
  }

  async predictStockPrice(symbol, daysAhead) {
    const response = await this.api.post('/stocks/predict', {
      symbol,
      daysAhead
    });
    return response.data;
  }

  async getAllTrackedSymbols() {
    const response = await this.api.get('/stocks/symbols');
    return response.data;
  }

  async getRecentUpdates(hours = 1) {
    const response = await this.api.get('/stocks/recent-updates', {
      params: { hours }
    });
    return response.data;
  }

  // Portfolio API methods
  async createPortfolio(name) {
    try {
      const response = await this.api.post('/portfolios', null, {
        params: { name }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create portfolio');
    }
  }

  // Check if backend is available
  async checkBackendAvailability() {
    try {
      await this.api.get('/health');
      if (!this.isBackendAvailable) {
        this.isBackendAvailable = true;
        console.log('Backend is now available');
      }
    } catch (error) {
      if (this.isBackendAvailable) {
        this.isBackendAvailable = false;
        console.error('Backend is not available:', error.message);
      }
    }
  }

  // Retry mechanism for API calls
  async retryOperation(operation, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        console.log(`Retrying operation, attempt ${i + 2}/${retries}`);
      }
    }
  }

  async getAllPortfolios() {
    if (!this.isBackendAvailable) {
      await this.checkBackendAvailability();
      if (!this.isBackendAvailable) {
        throw new Error('Backend server is not available. Please make sure the server is running.');
      }
    }

    return this.retryOperation(async () => {
      try {
        console.log('Fetching portfolios from:', `${this.api.defaults.baseURL}/portfolios`);
        const response = await this.api.get('/portfolios', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Portfolio response status:', response.status);
        console.log('Portfolio response headers:', response.headers);
        
        // Validate response data
        if (!response.data) {
          console.warn('No portfolio data received from server');
          return [];
        }
        
        // Ensure we have an array
        const portfolios = Array.isArray(response.data) ? response.data : [];
        console.log('Fetched portfolios:', portfolios);
        
        // Validate portfolio structure
        portfolios.forEach((portfolio, index) => {
          if (!portfolio.id || !portfolio.name) {
            console.warn(`Portfolio at index ${index} has invalid structure:`, portfolio);
          }
        });
        
        return portfolios;
      } catch (error) {
        console.error('Failed to fetch portfolios:', error);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
          console.error('Response headers:', error.response.headers);
          
          if (error.response.status === 404) {
            throw new Error('Portfolios endpoint not found. Please check if the backend is properly configured.');
          } else if (error.response.status === 500) {
            throw new Error('Server error occurred while fetching portfolios. Please try again later.');
          } else if (error.response.status === 403) {
            throw new Error('Access denied. Please check your permissions.');
          }
        } else if (error.code === 'ERR_NETWORK') {
          this.isBackendAvailable = false;
          throw new Error('Cannot connect to the server. Please ensure the backend is running on http://localhost:8080.');
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Request timed out. Please check your internet connection and try again.');
        }
        
        throw new Error(error.response?.data?.message || 'Failed to load portfolios. Please try again.');
      }
    });
  }

  async getPortfolio(id) {
    try {
      const response = await this.api.get(`/portfolios/${id}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to load portfolio details');
    }
  }

  async addHolding(portfolioId, symbol, quantity, averagePrice) {
    try {
      const response = await this.api.post(`/portfolios/${portfolioId}/holdings`, null, {
        params: {
          symbol,
          quantity,
          averagePrice
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to add holding');
    }
  }

  async removeHolding(portfolioId, symbol) {
    try {
      const response = await this.api.delete(`/portfolios/${portfolioId}/holdings/${symbol}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to remove holding');
    }
  }

  async updatePortfolioValues() {
    try {
      const response = await this.api.post('/portfolios/update-values');
      return response.data;
    } catch (error) {
      throw new Error('Failed to update portfolio values');
    }
  }

  async getPortfolioRisk(portfolioId) {
    try {
      const response = await this.api.get(`/portfolios/${portfolioId}/risk`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to calculate portfolio risk');
    }
  }

  // Sentiment API methods
  async analyzeSentiment(text) {
    try {
      const response = await this.api.post('/sentiment/analyze', { text });
      return response.data;
    } catch (error) {
      throw new Error('Failed to analyze sentiment');
    }
  }

  async analyzeMarketSentiment(headlines) {
    const response = await this.api.post('/sentiment/market', { headlines });
    return response.data;
  }
}

const apiService = new ApiService();
export default apiService;
