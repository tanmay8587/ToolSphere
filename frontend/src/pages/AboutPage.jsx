import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiZap,
  FiShield,
  FiRefreshCw,
  FiUsers,
  FiSearch,
  FiStar,
  FiLayers,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiHeart,
} from "react-icons/fi";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { getTools, getCategories } from "../services/toolsService";
import { getStatistics, trackVisitor } from "../services/statisticsService";

const features = [
  {
    icon: FiSearch,
    title: "Curated Directory",
    description:
      "Every tool is hand-picked and reviewed by our team to ensure quality and relevance.",
  },
  {
    icon: FiStar,
    title: "Real Ratings",
    description:
      "Authentic user reviews and ratings help you make informed decisions.",
  },
  {
    icon: FiLayers,
    title: "Comprehensive Categories",
    description:
      "Organized into intuitive categories so you can find exactly what you need.",
  },
  {
    icon: FiRefreshCw,
    title: "Regularly Updated",
    description:
      "New tools added weekly. Stay ahead with the latest AI innovations.",
  },
  {
    icon: FiShield,
    title: "Verified Listings",
    description:
      "We verify each listing to ensure accuracy and prevent spam or outdated tools.",
  },
  {
    icon: FiUsers,
    title: "Community Driven",
    description:
      "Built by the community, for the community. Your feedback shapes our directory.",
  },
];

const whatWeOffer = [
  {
    icon: FiCheckCircle,
    title: "Comprehensive Tool Listings",
    description:
      "Detailed profiles with features, pricing, pros, cons, and real user reviews for every AI tool.",
  },
  {
    icon: FiClock,
    title: "Save Time & Effort",
    description:
      "Stop searching across dozens of websites. Find and compare the best AI tools in one centralized platform.",
  },
  {
    icon: FiTrendingUp,
    title: "Stay Ahead of Trends",
    description:
      "Discover emerging AI tools and technologies before they become mainstream. Weekly updates keep you informed.",
  },
  {
    icon: FiHeart,
    title: "Free to Use",
    description:
      "Access our entire directory completely free. No hidden fees, no paywalls — just pure AI tool discovery.",
  },
];

export default function AboutPage() {
  const [stats, setStats] = useState([
    { label: "AI Tools", value: "0", loading: true },
    { label: "Categories", value: "0", loading: true },
    { label: "Monthly Visitors", value: "0", loading: true },
    { label: "Newsletter Subscribers", value: "0", loading: true },
  ]);

  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setError(null);
        
        // Fetch statistics from API
        const statsData = await getStatistics();
        
        if (statsData.success && statsData.statistics) {
          const { totalTools, totalCategories, monthlyVisitors, totalSubscribers } = statsData.statistics;

          setStats([
            {
              label: "AI Tools",
              value: totalTools > 0 ? `${totalTools}+` : "0",
              loading: false,
            },
            {
              label: "Categories",
              value: totalCategories > 0 ? `${totalCategories}+` : "0",
              loading: false,
            },
            {
              label: "Monthly Visitors",
              value: monthlyVisitors > 0 ? `${monthlyVisitors.toLocaleString()}` : "0",
              loading: false,
            },
            {
              label: "Newsletter Subscribers",
              value: totalSubscribers > 0 ? `${totalSubscribers.toLocaleString()}` : "0",
              loading: false,
            },
          ]);
        }
      } catch (error) {
        console.error("Error loading statistics:", error);
        setError("Failed to load statistics");
        setStats((prev) => prev.map((stat) => ({ ...stat, loading: false })));
      }
    }

    loadStats();
  }, []);

  // Track visitor when page loads
  useEffect(() => {
    trackVisitor();
  }, []);

  return (
    <>
      <Helmet>
        <title>About Us - ToolSphere | Discover the Best AI Tools</title>
        <meta
          name="description"
          content="Learn about ToolSphere — your trusted AI tools directory. Our mission is to help you discover, compare, and choose the best AI tools for every workflow."
        />
        <link rel="canonical" href="https://toolsphere.ai/about" />
        <meta property="og:title" content="About Us - ToolSphere" />
        <meta
          property="og:description"
          content="Learn about ToolSphere — your trusted AI tools directory."
        />
        <meta property="og:url" content="https://toolsphere.ai/about" />
        <meta name="twitter:title" content="About Us - ToolSphere" />
        <meta
          name="twitter:description"
          content="Learn about ToolSphere — your trusted AI tools directory."
        />
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-slate-400" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li>
              <Link to="/" className="hover:text-cyan-300 transition">
                Home
              </Link>
            </li>
            <li>
              <span className="mx-2">/</span>
            </li>
            <li>
              <span className="text-slate-200" aria-current="page">
                About
              </span>
            </li>
          </ol>
        </nav>

        {/* Hero Section */}
        <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 p-8 shadow-2xl shadow-cyan-950/30 lg:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
              <FiZap className="h-4 w-4" />
              About ToolSphere
            </div>

            <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">
              Your Gateway to the Best AI Tools
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              ToolSphere is a curated directory of the finest AI tools and platforms.
              We help professionals, creators, and businesses discover the perfect
              AI solutions for their unique workflows.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Statistics">
          {error && (
            <div className="col-span-full rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-center text-red-300">
              {error}
            </div>
          )}
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-center"
            >
              <p className="text-3xl font-bold text-cyan-300">
                {stat.loading ? (
                  <span className="inline-block h-8 w-16 animate-pulse rounded bg-slate-800" />
                ) : (
                  stat.value
                )}
              </p>
              <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
            </div>
          ))}
        </section>

        {/* Mission & Vision */}
        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-8">
            <h2 className="text-2xl font-semibold text-cyan-300">Our Mission</h2>
            <p className="mt-4 text-slate-300 leading-relaxed">
              To simplify the discovery of AI tools by providing a trusted,
              well-organized directory where anyone can find the right tool for
              their needs — whether you're a developer, marketer, designer, or
              entrepreneur.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-8">
            <h2 className="text-2xl font-semibold text-fuchsia-300">Our Vision</h2>
            <p className="mt-4 text-slate-300 leading-relaxed">
              A world where every individual and organization can harness the
              power of AI effortlessly. We envision ToolSphere as the go-to
              platform for AI tool discovery, education, and community.
            </p>
          </div>
        </section>

        {/* What We Offer */}
        <section className="mt-12" aria-labelledby="what-we-offer-heading">
          <div className="mb-8 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
              What We Offer
            </p>
            <h2 id="what-we-offer-heading" className="mt-2 text-3xl font-semibold">
              Everything You Need to Find the Right AI Tool
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-300">
              We provide a comprehensive platform designed to make your AI tool discovery journey seamless and informed.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {whatWeOffer.map((item) => (
              <motion.div
                key={item.title}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 transition hover:border-cyan-400/30"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="mt-12" aria-labelledby="why-choose-us-heading">
          <div className="mb-8 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
              Why Choose Us
            </p>
            <h2 id="why-choose-us-heading" className="mt-2 text-3xl font-semibold">
              Built for Discovery
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 transition hover:border-cyan-400/30"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-12 rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 p-8 text-center shadow-xl lg:p-12">
          <h2 className="text-3xl font-semibold">
            Ready to Explore AI Tools?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">
            Start discovering the best AI tools for your workflow. Join thousands
            of users who trust ToolSphere.
          </p>
          <Link
            to="/tools"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-6 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Browse Tools
            <FiArrowRight className="h-5 w-5" />
          </Link>
        </section>
      </div>
    </>
  );
}