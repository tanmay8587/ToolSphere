/**
 * Image Optimization Utilities
 * -----------------------------
 * Helpers for optimizing image loading, responsiveness, and preventing layout shift.
 */

/**
 * Generate srcset for responsive images with multiple sizes.
 */
export const generateSrcSet = (imageUrl, sizes = [640, 750, 828, 1080, 1200, 1920, 2048, 3840]) => {
  if (!imageUrl) return undefined;

  // Use "?" to start the query string, or "&" to append when the URL
  // already contains query parameters. Appending a second "?" would
  // produce a malformed URL and break responsive image loading.
  const separator = imageUrl.includes('?') ? '&' : '?';

  return sizes.map(size => `${imageUrl}${separator}w=${size} ${size}w`).join(', ');
};

/**
 * Generate sizes attribute for responsive images.
 */
export const generateSizes = (breakpoints) => {
  return breakpoints.map(([media, size]) => `${media} ${size}`).join(', ');
};

/**
 * Get aspect ratio class for preventing layout shift.
 */
export const getAspectRatioClass = (aspectRatio = '16/9') => {
  const aspectRatios = {
    '16/9': 'aspect-video',
    '4/3': 'aspect-[4/3]',
    '1/1': 'aspect-square',
    '3/4': 'aspect-[3/4]',
    '21/9': 'aspect-[21/9]',
    'auto': 'aspect-auto',
  };
  
  return aspectRatios[aspectRatio] || 'aspect-video';
};

/**
 * Get optimized image props for blog cover images.
 */
export const getBlogCoverImageProps = (imageUrl, alt) => {
  return {
    src: imageUrl,
    srcSet: generateSrcSet(imageUrl),
    sizes: generateSizes([
      '(max-width: 640px) 100vw',
      '(max-width: 1024px) 100vw',
      '100vw',
    ]),
    alt: alt || 'Blog cover image',
    loading: 'lazy',
    decoding: 'async',
    className: 'w-full h-64 sm:h-80 lg:h-96 object-cover',
  };
};

/**
 * Get optimized image props for tool logos.
 */
export const getToolLogoProps = (imageUrl, alt) => {
  return {
    src: imageUrl,
    srcSet: generateSrcSet(imageUrl, [64, 128, 256, 512]),
    sizes: '(max-width: 640px) 64px, (max-width: 1024px) 96px, 128px',
    alt: alt || 'Tool logo',
    loading: 'lazy',
    decoding: 'async',
    className: 'h-12 w-12 rounded-xl object-cover border border-white/10 bg-white/5',
  };
};

/**
 * Get optimized image props for related blog cards.
 */
export const getRelatedBlogImageProps = (imageUrl, alt) => {
  return {
    src: imageUrl,
    srcSet: generateSrcSet(imageUrl, [320, 640, 960]),
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
    alt: alt || 'Blog thumbnail',
    loading: 'lazy',
    decoding: 'async',
    className: 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500',
  };
};

