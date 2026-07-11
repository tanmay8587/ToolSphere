/**
 * Preserves fenced Markdown code blocks during sanitization
 * 
 * This utility temporarily replaces code blocks with placeholders,
 * allows sanitization to proceed, then restores the original code blocks.
 * This ensures code formatting and whitespace are preserved.
 */

/**
 * Extract and preserve fenced code blocks
 * @param {string} content - The blog content
 * @returns {Object} - Object with placeholder content and code blocks map
 */
export const preserveCodeBlocks = (content) => {
  if (!content || typeof content !== 'string') {
    return { placeholderContent: content, codeBlocks: new Map() };
  }

  const codeBlocks = new Map();
  let counter = 0;
  
  // Match fenced code blocks: ```language\ncode\n```
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  
  const placeholderContent = content.replace(codeBlockRegex, (match, language, code) => {
    const placeholder = `___CODE_BLOCK_${counter}___`;
    codeBlocks.set(placeholder, {
      language: language || 'plaintext',
      code: code.trim(), // Preserve the code exactly as written
    });
    counter++;
    return placeholder;
  });

  return { placeholderContent, codeBlocks };
};

/**
 * Restore code blocks from placeholders
 * @param {string} content - Content with placeholders
 * @param {Map} codeBlocks - Map of placeholders to code blocks
 * @returns {string} - Content with restored code blocks
 */
export const restoreCodeBlocks = (content, codeBlocks) => {
  if (!content || !codeBlocks || codeBlocks.size === 0) {
    return content;
  }

  let restoredContent = content;
  
  codeBlocks.forEach((block, placeholder) => {
    const codeBlock = `\`\`\`${block.language}\n${block.code}\n\`\`\``;
    restoredContent = restoredContent.replace(placeholder, codeBlock);
  });

  return restoredContent;
};

/**
 * Sanitize blog content while preserving code blocks
 * @param {string} content - The raw blog content
 * @returns {string} - Sanitized content with code blocks preserved
 */
export const sanitizeBlogContent = (content) => {
  if (!content || typeof content !== 'string') {
    return content;
  }

  // Step 1: Preserve code blocks
  const { placeholderContent, codeBlocks } = preserveCodeBlocks(content);

  // Step 2: Sanitize the content without code blocks
  // Import sanitizeTextField to avoid XSS
  const { sanitizeTextField } = require('./validation.js');
  let sanitized = sanitizeTextField(placeholderContent);

  // Step 3: Restore code blocks
  sanitized = restoreCodeBlocks(sanitized, codeBlocks);

  return sanitized;
};