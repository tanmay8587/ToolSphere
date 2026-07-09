const validStatuses = ['active', 'pending', 'rejected'];
const validPricings = ['Free', 'Freemium', 'Paid', 'Custom'];

// Email regex pattern for validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password strength requirements
const passwordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false,
};

// Sanitize input to prevent NoSQL injection
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove dangerous MongoDB operators
  const dangerousPatterns = [
    /\$where/gi,
    /\$gt/gi,
    /\$gte/gi,
    /\$lt/gi,
    /\$lte/gi,
    /\$ne/gi,
    /\$in/gi,
    /\$nin/gi,
    /\$or/gi,
    /\$and/gi,
    /\$not/gi,
    /\$nor/gi,
    /\$exists/gi,
    /\$regex/gi,
    /\$text/gi,
  ];
  
  let sanitized = input;
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  return sanitized.trim();
};

// Sanitize HTML to prevent XSS attacks
export const sanitizeHtml = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove dangerous HTML tags and attributes
  const dangerousTags = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^>]*>/gi,
    /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
    /<input\b[^>]*>/gi,
    /<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi,
    /<link\b[^>]*>/gi,
    /<meta\b[^>]*>/gi,
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    /<base\b[^>]*>/gi,
    /<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi,
    /<math\b[^<]*(?:(?!<\/math>)<[^<]*)*<\/math>/gi,
  ];
  
  let sanitized = input;
  dangerousTags.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // Remove dangerous event handlers and javascript: URLs
  const dangerousAttributes = [
    /on\w+\s*=\s*["'][^"']*["']/gi,
    /on\w+\s*=\s*[^\s>]+/gi,
    /javascript:\s*/gi,
    /vbscript:\s*/gi,
    /data:\s*text\/html/gi,
  ];
  
  dangerousAttributes.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // Remove data: URLs that could contain malicious content
  sanitized = sanitized.replace(/data:text\/html/gi, '');
  
  return sanitized.trim();
};

// Sanitize text fields (combines NoSQL and XSS sanitization)
export const sanitizeTextField = (input) => {
  if (typeof input !== 'string') return input;
  return sanitizeHtml(sanitizeInput(input));
};

// Validate email format
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return emailRegex.test(email.trim());
};

// Validate password strength
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required.' };
  }
  
  if (password.length < passwordRequirements.minLength) {
    return { 
      valid: false, 
      message: `Password must be at least ${passwordRequirements.minLength} characters.` 
    };
  }
  
  if (passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  
  if (passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  
  if (passwordRequirements.requireNumber && !/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number.' };
  }
  
  return { valid: true, message: 'Password is valid.' };
};

export const normalizeTags = (tags) => {
  if (!tags) return [];

  if (Array.isArray(tags)) {
    return tags
      .map((tag) => String(tag).trim())
      .filter(Boolean);
  }

  return String(tags)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
};

// Re-export createSlug from slug.js for single source of truth
export { createSlug } from './slug.js';

export const validateToolPayload = (payload, isUpdate = false) => {
  const errors = [];

  const name = payload?.name;
  const category = payload?.category;
  const website = payload?.website;
  const description = payload?.description;
  const slug = payload?.slug;
  const pricing = payload?.pricing;
  const status = payload?.status;

  // =========================
  // CREATE VALIDATION ONLY
  // =========================
  if (!isUpdate) {
    if (typeof name !== 'string' || name.trim().length < 3) {
      errors.push('Tool name must be at least 3 characters.');
    }

    if (typeof category !== 'string' || !category.trim()) {
      errors.push('Category is required.');
    }

    if (typeof website !== 'string' || !website.trim()) {
      errors.push('Website is required.');
    }

    if (typeof description !== 'string' || description.trim().length < 10) {
      errors.push('Description must be at least 10 characters.');
    }
  }

  // =========================
  // UPDATE + CREATE VALIDATION
  // =========================

  if (pricing && !validPricings.includes(pricing)) {
    errors.push(`Pricing must be one of: ${validPricings.join(', ')}`);
  }

  if (status && !validStatuses.includes(status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  if (slug && slug.length > 100) {
    errors.push('Slug must not be longer than 100 characters.');
  }

  return errors;
};
