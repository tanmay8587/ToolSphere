/**
 * Social Meta Utilities
 * ---------------------
 * Helpers for generating proper social sharing meta tags.
 */

const DEFAULT_BLOG_IMAGE = "/default-blog-cover.svg";
const DEFAULT_TOOL_IMAGE = "/default-logo.png";
const DEFAULT_OG_IMAGE_WIDTH = 1200;
const DEFAULT_OG_IMAGE_HEIGHT = 630;

/**
 * Convert a relative URL to an absolute URL.
 */
export const toAbsoluteUrl = (relativePath) => {
  if (!relativePath) return null;
  
  // If already absolute, return as-is
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    return relativePath;
  }
  
  // Convert relative to absolute
  if (typeof window !== "undefined") {
    return new URL(relativePath, window.location.origin).href;
  }
  
  return relativePath;
};

/**
 * Get the best image URL for a blog post with fallback.
 */
export const getBlogImage = (blog) => {
  const image = blog?.ogImage || blog?.coverImage;
  return toAbsoluteUrl(image) || toAbsoluteUrl(DEFAULT_BLOG_IMAGE);
};

/**
 * Get the best image URL for a tool with fallback.
 */
export const getToolImage = (tool) => {
  const image = tool?.ogImage || tool?.coverImage || tool?.logo;
  return toAbsoluteUrl(image) || toAbsoluteUrl(DEFAULT_TOOL_IMAGE);
};

/**
 * Get image dimensions for Open Graph.
 * Returns default dimensions if not provided.
 */
export const getImageDimensions = (imageUrl) => {
  // Default OG image dimensions (1200x630 is recommended)
  return {
    width: DEFAULT_OG_IMAGE_WIDTH,
    height: DEFAULT_OG_IMAGE_HEIGHT,
  };
};

/**
 * Generate complete Open Graph meta tags for a blog post.
 */
export const generateBlogOgTags = (blog) => {
  const blogUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/blog/${blog?.slug}`
    : `/blog/${blog?.slug}`;
  
  const image = getBlogImage(blog);
  const dimensions = getImageDimensions(image);

  return {
    title: blog?.seoTitle || blog?.title || "Blog Post",
    description: blog?.seoDescription || blog?.excerpt || "",
    image,
    imageWidth: dimensions.width,
    imageHeight: dimensions.height,
    url: blogUrl,
    type: "article",
    siteName: "ToolSphere",
    publishedTime: blog?.publishedAt,
    modifiedTime: blog?.updatedAt,
    author: blog?.author || "ToolSphere",
    tags: blog?.tags || [],
  };
};

/**
 * Generate complete Open Graph meta tags for a tool.
 */
export const generateToolOgTags = (tool) => {
  const toolUrl = typeof window !== "undefined"
    ? window.location.href
    : `/tools/${tool?.slug}`;

  const image = getToolImage(tool);
  const dimensions = getImageDimensions(image);

  return {
    title: tool?.seoTitle || tool?.name || "AI Tool",
    description: tool?.seoDescription || tool?.description?.substring(0, 160) || "",
    image,
    imageWidth: dimensions.width,
    imageHeight: dimensions.height,
    url: toolUrl,
    type: "website",
    siteName: "ToolSphere",
  };
};

/**
 * Generate Twitter Card meta tags for a blog post.
 */
export const generateBlogTwitterTags = (blog) => {
  const image = getBlogImage(blog);

  return {
    card: "summary_large_image",
    title: blog?.seoTitle || blog?.title || "Blog Post",
    description: blog?.seoDescription || blog?.excerpt || "",
    image,
    imageAlt: blog?.title || "Blog post image",
    creator: blog?.author ? `@${blog.author.replace(/\s+/g, '')}` : "@ToolSphere",
    site: "@ToolSphere",
  };
};

/**
 * Generate Twitter Card meta tags for a tool.
 */
export const generateToolTwitterTags = (tool) => {
  const image = getToolImage(tool);

  return {
    card: "summary_large_image",
    title: tool?.seoTitle || tool?.name || "AI Tool",
    description: tool?.seoDescription || tool?.description?.substring(0, 160) || "",
    image,
    imageAlt: tool?.name || "Tool image",
    site: "@ToolSphere",
  };
};