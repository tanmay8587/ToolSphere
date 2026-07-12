/**
 * Accessibility Utilities
 * ------------------------
 * Helpers for improving accessibility across the application.
 */

/**
 * Common ARIA labels for consistent usage
 */
export const ARIA_LABELS = {
  // Navigation
  MAIN_NAVIGATION: "Main navigation",
  SEARCH: "Search",
  MENU: "Menu",
  CLOSE_MENU: "Close menu",
  OPEN_MENU: "Open menu",
  
  // Actions
  SUBMIT: "Submit",
  CANCEL: "Cancel",
  DELETE: "Delete",
  EDIT: "Edit",
  SAVE: "Save",
  LOADING: "Loading",
  
  // Content
  SKIP_TO_CONTENT: "Skip to main content",
  BACK_TO_TOP: "Back to top",
  SHARE: "Share",
  BOOKMARK: "Bookmark",
  
  // Status
  SUCCESS: "Success",
  ERROR: "Error",
  WARNING: "Warning",
  INFO: "Information",
  
  // Social
  FACEBOOK: "Share on Facebook",
  TWITTER: "Share on Twitter",
  LINKEDIN: "Share on LinkedIn",
  WHATSAPP: "Share on WhatsApp",
  TELEGRAM: "Share on Telegram",
  COPY_LINK: "Copy link to clipboard",
};

/**
 * Keyboard navigation handlers
 */
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
};

/**
 * Handle keyboard events for accessibility
 */
export const handleKeyboard = (event, action) => {
  const { key } = event;
  
  // Enter or Space key
  if (key === KEYBOARD_KEYS.ENTER || key === KEYBOARD_KEYS.SPACE) {
    event.preventDefault();
    action?.onClick?.(event);
    return true;
  }
  
  // Escape key
  if (key === KEYBOARD_KEYS.ESCAPE) {
    action?.onEscape?.(event);
    return true;
  }
  
  return false;
};

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Focus an element by selector
   */
  focusElement: (selector) => {
    const element = document.querySelector(selector);
    if (element) {
      element.focus();
      return true;
    }
    return false;
  },
  
  /**
   * Focus the first focusable element in a container
   */
  focusFirst: (container) => {
    const focusable = container?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) {
      focusable.focus();
      return true;
    }
    return false;
  },
  
  /**
   * Focus the last focusable element in a container
   */
  focusLast: (container) => {
    const focusable = container?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable?.length) {
      focusable[focusable.length - 1].focus();
      return true;
    }
    return false;
  },
  
  /**
   * Trap focus within a container
   */
  trapFocus: (container) => {
    const focusable = container?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable?.length) return;
    
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    
    const handleTab = (e) => {
      if (e.key !== KEYBOARD_KEYS.TAB) return;
      
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleTab);
    return () => container.removeEventListener('keydown', handleTab);
  },
};

/**
 * Generate accessible button props
 */
export const getAccessibleButtonProps = (options = {}) => {
  const {
    onClick,
    onEscape,
    ariaLabel,
    ariaExpanded,
    ariaControls,
    ariaPressed,
    disabled,
    type = 'button',
  } = options;
  
  return {
    onClick,
    onKeyDown: (e) => handleKeyboard(e, { onClick, onEscape }),
    'aria-label': ariaLabel,
    'aria-expanded': ariaExpanded,
    'aria-controls': ariaControls,
    'aria-pressed': ariaPressed,
    disabled,
    type,
  };
};

/**
 * Generate accessible link props
 */
export const getAccessibleLinkProps = (options = {}) => {
  const {
    href,
    ariaLabel,
    ariaCurrent,
    external,
  } = options;
  
  return {
    href,
    'aria-label': ariaLabel,
    'aria-current': ariaCurrent,
    target: external ? '_blank' : undefined,
    rel: external ? 'noopener noreferrer' : undefined,
  };
};

/**
 * Skip to main content link component props
 */
export const getSkipToContentProps = () => ({
  href: '#main-content',
  'aria-label': ARIA_LABELS.SKIP_TO_CONTENT,
  className: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyan-500 focus:text-white focus:rounded-lg',
});

/**
 * Announce message to screen readers
 */
export const announceToScreenReader = (message) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Check if element is focusable
 */
export const isFocusable = (element) => {
  if (!element || !element.matches) return false;
  
  return element.matches(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
};

/**
 * Get all focusable elements within a container
 */
export const getFocusableElements = (container) => {
  return Array.from(
    container?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) || []
  ).filter(isFocusable);
};