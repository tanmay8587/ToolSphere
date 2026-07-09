import mongoose from "mongoose";
import Tool from "../models/Tool.js";

/* =========================
   DATA (MISSING FIX ADDED)
========================= */

export const toolNames = [
  "ChatGPT",
  "Claude",
  "Gemini",
  "Midjourney",
  "Perplexity",
  "GitHub Copilot",
  "Notion AI",
  "Canva AI",
  "Runway",
  "Pika"
];

export const categories = [
  "Writing",
  "Coding",
  "Image",
  "Video",
  "Audio",
  "Marketing",
  "Productivity",
  "Design",
  "Research",
  "Business"
];

export const categoryMap = {};

/* =========================
   BUILD SEED CATEGORIES
========================= */

export function buildSeedCategories() {
  const categories = [
    { name: "Writing", icon: "✍️", description: "AI tools for writing, content creation, and copywriting." },
    { name: "Coding", icon: "💻", description: "AI-powered coding assistants and development tools." },
    { name: "Image", icon: "🎨", description: "AI image generators and image editing tools." },
    { name: "Video", icon: "🎬", description: "AI video creation and editing platforms." },
    { name: "Audio", icon: "🎵", description: "AI audio generation and music tools." },
    { name: "Marketing", icon: "📈", description: "AI tools for marketing, SEO, and social media." },
    { name: "Productivity", icon: "⚡", description: "AI tools to boost productivity and workflow automation." },
    { name: "Design", icon: "🎯", description: "AI-powered design and creative tools." },
    { name: "Research", icon: "🔍", description: "AI research assistants and data analysis tools." },
    { name: "Business", icon: "💼", description: "AI tools for business operations and management." },
  ];

  return categories.map(cat => ({
    name: cat.name.toLowerCase(),
    icon: cat.icon,
    description: cat.description,
    isActive: true,
    createdBy: "system"
  }));
}

/* =========================
   HELPERS
========================= */

function slugify(value = "") {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function resolveWebsite(name) {
  return `https://www.${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`;
}

function createDescription(name) {
  return `${name} is an AI-powered tool for modern workflows.`;
}

function createTags(name, category) {
  return [category.toLowerCase(), "ai", name.toLowerCase()];
}

function createPricing() {
  return "Freemium";
}

/* =========================
   BUILD SEED TOOLS
========================= */

export function buildSeedTools() {
  const seen = new Set();

  return toolNames
    .filter((name) => {
      if (!name || typeof name !== "string") return false;

      const key = name.toLowerCase().trim();
      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    })
    .map((name, index) => {
      const safeName = name.trim();

      const category =
        categoryMap[safeName] ||
        categories[index % categories.length] ||
        "Productivity";

      const website = resolveWebsite(safeName);

      let logo;
      try {
        const hostname = new URL(website).hostname;
        logo = `https://logo.clearbit.com/${hostname}`;
      } catch {
        logo = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          safeName
        )}`;
      }

      return {
        name: safeName,
        slug: slugify(safeName),
        category,
        description: createDescription(safeName),
        pricing: createPricing(),
        rating: 4.5,
        tags: createTags(safeName, category),
        website,
        logo,
        featured: index < 5,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
}

/* =========================
   SEED RUNNER
========================= */

async function runSeed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Seed categories first
    const Category = (await import("./models/Category.js")).default;
    const existingCategories = await Category.countDocuments();
    
    if (existingCategories === 0) {
      const categories = buildSeedCategories();
      await Category.insertMany(categories);
      console.log(`✅ Seeded ${categories.length} categories`);
    } else {
      console.log("ℹ️ Categories already exist, skipping category seed");
    }
    
    // Then seed tools
    const tools = buildSeedTools();
    await Tool.deleteMany({});
    await Tool.insertMany(tools);
    console.log(`✅ Seeded ${tools.length} tools`);
    
    process.exit();
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

/* =========================
   AUTO RUN
========================= */

if (process.argv[1] && process.argv[1].includes("seedTools.js")) {
  runSeed();
}
