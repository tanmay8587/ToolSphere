/**
 * Error Handling Utilities
 * -------------------------
 * Consistent error handling across the application.
 */

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Unable to connect to the server. Please check your internet connection.",
  TIMEOUT_ERROR: "The request took too long. Please try again.",
  NOT_FOUND: "The requested resource was not found.",
  UNAUTHORIZED: "You need to log in to access this resource.",
  FORBIDDEN: "You don't have permission to access this resource.",
  SERVER_ERROR: "Something went wrong on our end. Please try again later.",
  VALIDATION_ERROR: "Please check your input and try again.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error) => {
  if (!error) return ERROR_MESSAGES.UNKNOWN_ERROR;
  
  // Network errors
  if (error.message === "Failed to fetch" || error.code === "NETWORK_ERROR") {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  // Timeout errors
  if (error.message === "Timeout" || error.code === "TIMEOUT") {
    return ERROR_MESSAGES.TIMEOUT_ERROR;
  }
  
  // HTTP status codes
  if (error.status) {
    switch (error.status) {
      case 400:
        return error.message || ERROR_MESSAGES.VALIDATION_ERROR;
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 403:
        return ERROR_MESSAGES.FORBIDDEN;
      case 404:
        return ERROR_MESSAGES.NOT_FOUND;
      case 500:
      case 502:
      case 503:
        return ERROR_MESSAGES.SERVER_ERROR;
      default:
        return error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
    }
  }
  
  return error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
};

/**
 * Handle API errors consistently
 */
export const handleApiError = (error, context = "") => {
  const message = getErrorMessage(error);
  
  console.error(`[${context}] Error:`, error);
  
  return {
    success: false,
    message,
    error,
  };
};

/**
 * Retry a function with exponential backoff
 */
export const withRetry = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

/**
 * Safe async wrapper for component functions
 */
export const safeAsync = async (errorCallback) => {
  try {
    return { success: true };
  } catch (error) {
    errorCallback?.(error);
    return { success: false, error };
  }
};