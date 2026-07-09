/**
 * categoryIcons - Centralized mapping of category names to Lucide React icons.
 *
 * Usage:
 *   import { getCategoryIcon } from "../utils/categoryIcons";
 *   const Icon = getCategoryIcon("AI Chat"); // Returns MessageSquare component
 *
 * If no match is found, returns Sparkles as default.
 */

import {
  MessageSquare,
  PenSquare,
  Image,
  Video,
  Headphones,
  Code2,
  Search,
  Briefcase,
  Megaphone,
  TrendingUp,
  Palette,
  GraduationCap,
  Workflow,
  Building2,
  Wallet,
  BarChart3,
  Mail,
  Languages,
  HeartPulse,
  Scale,
  Share2,
  Sparkles,
} from "lucide-react";

/**
 * Maps normalized category keys to Lucide icon components.
 * Keys are lowercased and trimmed before lookup.
 */
const ICON_MAP = {
  // AI Chat
  "ai chat": MessageSquare,
  chat: MessageSquare,
  chatbot: MessageSquare,

  // Writing
  writing: PenSquare,
  "ai writing": PenSquare,
  content: PenSquare,
  copywriting: PenSquare,

  // Image
  image: Image,
  "image generation": Image,
  "ai image": Image,
  "image editing": Image,

  // Video
  video: Video,
  "video generation": Video,
  "ai video": Video,
  "video editing": Video,

  // Audio
  audio: Headphones,
  "ai audio": Headphones,
  music: Headphones,
  "audio generation": Headphones,

  // Coding
  coding: Code2,
  "ai coding": Code2,
  code: Code2,
  development: Code2,
  programming: Code2,
  "code generation": Code2,
  "software development": Code2,
  "ai code": Code2,
  developer: Code2,

  // Research
  research: Search,
  "ai research": Search,
  "research assistant": Search,

  // Productivity
  productivity: Briefcase,
  "ai productivity": Briefcase,
  "task management": Briefcase,
  "project management": Briefcase,
  "personal assistant": Briefcase,

  // Marketing
  marketing: Megaphone,
  "ai marketing": Megaphone,
  "digital marketing": Megaphone,
  "marketing automation": Megaphone,
  advertising: Megaphone,

  // SEO
  seo: TrendingUp,
  "seo tools": TrendingUp,
  "seo optimization": TrendingUp,

  // Design
  design: Palette,
  "ui design": Palette,
  "ui/ux design": Palette,
  "graphic design": Palette,
  "web design": Palette,
  "design tools": Palette,
  creative: Palette,

  // Education
  education: GraduationCap,
  "ai education": GraduationCap,
  learning: GraduationCap,
  "e-learning": GraduationCap,
  tutoring: GraduationCap,

  // Automation
  automation: Workflow,
  "ai automation": Workflow,
  workflow: Workflow,
  "workflow automation": Workflow,
  "process automation": Workflow,
  "ai agents": Workflow,
  agents: Workflow,

  // Business
  business: Building2,
  "ai business": Building2,
  "business intelligence": Building2,
  enterprise: Building2,
  startup: Building2,

  // Finance
  finance: Wallet,
  "ai finance": Wallet,
  fintech: Wallet,
  "financial analysis": Wallet,
  accounting: Wallet,
  banking: Wallet,
  crypto: Wallet,

  // Analytics
  analytics: BarChart3,
  "data analytics": BarChart3,
  "data science": BarChart3,
  "data visualization": BarChart3,
  metrics: BarChart3,
  reporting: BarChart3,

  // Email
  email: Mail,
  "email marketing": Mail,
  "email automation": Mail,
  newsletter: Mail,

  // Translation
  translation: Languages,
  "ai translation": Languages,
  translator: Languages,
  "language translation": Languages,
  "language learning": Languages,

  // Healthcare
  healthcare: HeartPulse,
  "ai healthcare": HeartPulse,
  health: HeartPulse,
  medical: HeartPulse,
  fitness: HeartPulse,
  wellness: HeartPulse,

  // Legal
  legal: Scale,
  "legal assistant": Scale,
  "legal research": Scale,
  compliance: Scale,

  // Social Media
  "social media": Share2,
  social: Share2,
  "social media management": Share2,
  community: Share2,

  // General fallback aliases (not exact match = Sparkles already)
  general: Sparkles,
  "ai tools": Sparkles,
  "ai assistant": Sparkles,
};

/**
 * Returns the matching Lucide icon component for a given category name.
 * Performs case-insensitive lookup. Falls back to Sparkles if no match.
 *
 * @param {string} categoryName - The category name or slug to look up
 * @returns {React.ComponentType} A Lucide React icon component
 */
export function getCategoryIcon(categoryName) {
  if (!categoryName) return Sparkles;
  const key = categoryName.toLowerCase().trim();
  return ICON_MAP[key] || Sparkles;
}