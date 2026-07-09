import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiHelpCircle, FiArrowRight } from "react-icons/fi";
import { Helmet } from "react-helmet-async";

const faqs = [
  {
    question: "What is ToolSphere?",
    answer:
      "ToolSphere is a curated directory of the best AI tools and platforms. We help professionals, creators, and businesses discover, compare, and choose the right AI solutions for their workflows. Our team hand-picks and reviews every tool listed to ensure quality and relevance.",
  },
  {
    question: "How are tools selected for the directory?",
    answer:
      "Each tool is evaluated based on functionality, user experience, reliability, and value. Our curation team reviews submissions, tests tools where possible, and verifies listing details before approval. We prioritize tools that demonstrate real utility and positive user feedback.",
  },
  {
    question: "Is ToolSphere free to use?",
    answer:
      "Yes! Browsing and searching the ToolSphere directory is completely free. You can explore hundreds of AI tools, read descriptions, compare features, and find the perfect tool for your needs without any cost or account required.",
  },
  {
    question: "Can I submit a tool to the directory?",
    answer:
      "Absolutely! We welcome tool submissions from developers, companies, and the community. You can submit a tool through our contact page. Our team will review your submission and, if it meets our quality standards, add it to the directory.",
  },
  {
    question: "How often is the directory updated?",
    answer:
      "We update the directory weekly with new tools, verified listings, and the latest information. Our team continuously monitors for changes, updates pricing and features, and removes tools that are no longer active or relevant.",
  },
  {
    question: "Do you offer API access?",
    answer:
      "Currently, we do not offer public API access. However, we're exploring API options for future releases. If you're interested in API access for your project, let us know through our contact page and we'll keep you updated.",
  },
  {
    question: "Can I trust the reviews and ratings?",
    answer:
      "We strive for authenticity in all reviews and ratings. Our platform collects feedback from verified users and our curation team. We moderate reviews to prevent spam and ensure they provide genuine value to our community.",
  },
  {
    question: "How do I report an issue with a listed tool?",
    answer:
      "If you encounter a broken link, outdated information, or have concerns about a listed tool, please contact us through our contact page. We investigate all reports and take appropriate action, including updating or removing listings as needed.",
  },
  {
    question: "Is my data safe when using ToolSphere?",
    answer:
      "We take your privacy seriously. We only collect minimal information necessary to provide our service (such as email for newsletter subscriptions). We never sell or share your personal data with third parties. See our Privacy Policy for detailed information.",
  },
  {
    question: "Can I contribute to ToolSphere?",
    answer:
      "Yes! ToolSphere is community-driven. You can contribute by submitting tools, writing reviews, suggesting improvements, or sharing feedback. Reach out through our contact page to learn more about collaboration opportunities.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <Helmet>
        <title>FAQ - ToolSphere | Frequently Asked Questions</title>
        <meta
          name="description"
          content="Find answers to common questions about ToolSphere — the AI tools directory. Learn about submissions, reviews, privacy, and more."
        />
        <link rel="canonical" href="https://toolsphere.ai/faq" />
        <meta property="og:title" content="FAQ - ToolSphere" />
        <meta
          property="og:description"
          content="Find answers to common questions about ToolSphere."
        />
        <meta property="og:url" content="https://toolsphere.ai/faq" />
        <meta name="twitter:title" content="FAQ - ToolSphere" />
        <meta
          name="twitter:description"
          content="Find answers to common questions about ToolSphere."
        />
      </Helmet>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-slate-400">
          <Link to="/" className="hover:text-cyan-300 transition">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-200">FAQ</span>
        </nav>

        {/* Hero Section */}
        <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 p-8 shadow-2xl shadow-cyan-950/30 lg:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
              <FiHelpCircle className="h-4 w-4" />
              FAQ
            </div>

            <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">
              Frequently Asked Questions
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              Everything you need to know about ToolSphere. Can't find what
              you're looking for? Feel free to contact us.
            </p>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="mt-8 space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl border border-white/10 bg-slate-900/70 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-white/5"
                aria-expanded={openIndex === index}
              >
                <span className="font-medium text-slate-200">
                  {faq.question}
                </span>
                <FiChevronDown
                  className={`h-5 w-5 flex-shrink-0 text-slate-400 transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/10 px-6 py-5">
                      <p className="text-slate-400 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </section>

        {/* Still have questions? */}
        <section className="mt-12 rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 p-8 text-center shadow-xl lg:p-12">
          <h2 className="text-3xl font-semibold">
            Still Have Questions?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">
            Can't find the answer you're looking for? Reach out to our team and
            we'll get back to you as soon as possible.
          </p>
          <Link
            to="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-6 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Contact Us
            <FiArrowRight className="h-5 w-5" />
          </Link>
        </section>
      </div>
    </>
  );
}