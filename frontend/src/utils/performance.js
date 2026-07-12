/**
 * Performance Utilities
 * ----------------------
 * Helpers for optimizing React performance and API calls.
 */

/**
 * Simple in-memory cache for API responses.
 */
class ApiCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
    });
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }
}

export const apiCache = new ApiCache();

/**
 * Deduplicate API requests - prevents duplicate simultaneous requests.
 */
const pendingRequests = new Map();

export const withDeduplication = (requestFn, cacheKey, ttl) => {
  // Return cached data if available
  const cached = apiCache.get(cacheKey);
  if (cached) {
    return Promise.resolve(cached);
  }

  // If same request is already pending, return that promise
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  // Make the request
  const promise = requestFn()
    .then(data => {
      apiCache.set(cacheKey, data, ttl);
      pendingRequests.delete(cacheKey);
      return data;
    })
    .catch(error => {
      pendingRequests.delete(cacheKey);
      throw error;
    });

  pendingRequests.set(cacheKey, promise);
  return promise;
};

/**
 * Memoize a function with a custom key generator.
 */
export const memoize = (fn, keyGenerator = (...args) => JSON.stringify(args)) => {
  const cache = new Map();
  
  return (...args) => {
    const key = keyGenerator(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Cleanup old entries (optional, prevents memory leaks)
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  };
};

/**
 * Debounce function to limit execution rate.
 */
export const debounce = (fn, delay) => {
  let timeoutId;
  
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Throttle function to ensure execution at most once per interval.
 */
export const throttle = (fn, interval) => {
  let lastExecution = 0;
  let timeoutId = null;
  
  return (...args) => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecution;
    
    if (timeSinceLastExecution >= interval) {
      lastExecution = now;
      fn(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastExecution = Date.now();
        timeoutId = null;
        fn(...args);
      }, interval - timeSinceLastExecution);
    }
  };
};

/**
 * Create a stable reference for use in dependency arrays.
 */
export const useStableCallback = (callback) => {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  });
  
  return useCallback((...args) => callbackRef.current(...args), []);
};