import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiLoader, FiMail, FiMapPin, FiClock, FiSend, FiMessageCircle, FiLock } from "react-icons/fi";
import { FaXTwitter, FaLinkedin, FaGithub, FaInstagram, FaYoutube, FaDiscord, FaTelegram, FaFacebook } from "react-icons/fa6";
import { Helmet } from "react-helmet-async";
import { submitContact, submitContactAuth } from "../services/contactService";
import { getContactSettings } from "../services/contactSettingService";
import { getSocialLinks } from "../services/socialService";
import { isLoggedIn, getUser } from "../utils/auth";

// Platform configuration with icons and labels
const platformConfig = {
  x: { icon: FaXTwitter, label: "X" },
  linkedin: { icon: FaLinkedin, label: "LinkedIn" },
  github: { icon: FaGithub, label: "GitHub" },
  instagram: { icon: FaInstagram, label: "Instagram" },
  youtube: { icon: FaYoutube, label: "YouTube" },
  discord: { icon: FaDiscord, label: "Discord" },
  telegram: { icon: FaTelegram, label: "Telegram" },
  facebook: { icon: FaFacebook, label: "Facebook" },
};

// All available platforms
const allPlatforms = ["x", "linkedin", "github", "instagram", "youtube", "discord", "telegram", "facebook"];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // { type: 'success'|'error', message: '' }
  const [contactSettings, setContactSettings] = useState({});
  const [socialLinks, setSocialLinks] = useState([]);
  const [settingsLoading, setSettingsLoading] = useState(true);
  
  // Track if settings have been loaded to prevent duplicate requests
  const settingsLoadedRef = useRef(false);

  // Auth: detect login state
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

  // Keep login state in sync
  useEffect(() => {
    const syncAuth = () => setLoggedIn(isLoggedIn());
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  // Pre-fill email from user data when logged in
  useEffect(() => {
    if (loggedIn) {
      const user = getUser();
      if (user?.email) {
        setForm((prev) => ({ ...prev, email: user.email }));
      }
    }
  }, [loggedIn]);

  // Default values for contact settings
  const defaultSettings = {
    hero_badge: "Get In Touch",
    hero_heading: "Let's Talk About AI",
    hero_description: "Have a question about a tool, want to submit a product, or just want to say hello? We're here for you.",
    faq_button_text: "Check FAQ First",
    contact_email: "hello@toolsphere.ai",
    office_location: "San Francisco, CA",
    response_time: "Mon-Fri, 9AM-6PM PST",
    working_days: "Monday - Friday",
    working_hours: "9:00 AM - 6:00 PM",
  };

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    }

    // Only validate email for non-logged-in users (logged-in users get it from the server)
    if (!loggedIn) {
      if (!form.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (!form.subject.trim()) {
      newErrors.subject = "Subject is required";
    }

    if (!form.message.trim()) {
      newErrors.message = "Message is required";
    } else if (form.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch contact settings and social links from API
  useEffect(() => {
    // Prevent duplicate requests on re-renders
    if (settingsLoadedRef.current) return;
    settingsLoadedRef.current = true;
    
    const fetchSettings = async () => {
      try {
        // Load settings in parallel
        const [settingsResult, socialResult] = await Promise.all([
          getContactSettings().catch(() => ({ success: false, settings: {} })),
          getSocialLinks().catch(() => ({ success: false, socialLinks: [] })),
        ]);
        
        if (settingsResult.success && settingsResult.settings) {
          setContactSettings(settingsResult.settings);
        }
        
        if (socialResult.success && socialResult.socialLinks) {
          // Create a map of platform to url for easy lookup
          const platformMap = {};
          socialResult.socialLinks.forEach(link => {
            platformMap[link.platform] = link.url || "";
          });
          
          // Build all platforms with their URLs (or empty string if not set)
          const allLinks = allPlatforms.map(platform => ({
            icon: platformConfig[platform].icon,
            href: platformMap[platform] || "",
            label: platformConfig[platform].label,
            platform: platform,
          }));
          setSocialLinks(allLinks);
        }
      } catch (error) {
        // Silent fail - use default settings
      } finally {
        setSettingsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    setSubmitStatus(null);

    try {
      let result;

      if (loggedIn) {
        // Use the authenticated endpoint (backend will use req.user.email)
        result = await submitContactAuth({
          name: form.name,
          subject: form.subject,
          message: form.message,
        });
      } else {
        // Use the public endpoint
        result = await submitContact({
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
        });
      }

      if (result.success) {
        setSubmitStatus({ type: "success", message: result.message });
        setForm({ name: "", email: loggedIn ? (getUser()?.email || "") : "", subject: "", message: "" });
        setErrors({});
      } else {
        setSubmitStatus({
          type: "error",
          message: result.message || "Failed to send message. Please try again.",
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message:
          error.message ||
          "Something went wrong. Please try again later or email us directly.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Merge settings with defaults
  const settings = { ...defaultSettings, ...contactSettings };

  // Build contact info from settings
  const contactInfo = [
    {
      icon: FiMail,
      title: "Email Us",
      detail: settings.contact_email,
      description: "We reply within 24 hours",
    },
    {
      icon: FiMapPin,
      title: "Our Location",
      detail: settings.office_location,
      description: "Remote-first team",
    },
    {
      icon: FiClock,
      title: "Response Time",
      detail: settings.response_time,
      description: "Average 4 hour response",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Contact Us - ToolSphere | Get In Touch</title>
        <meta
          name="description"
          content="Have a question, suggestion, or want to submit a tool? Contact the ToolSphere team. We'd love to hear from you."
        />
        <link rel="canonical" href="https://toolsphere.ai/contact" />
        <meta property="og:title" content="Contact Us - ToolSphere" />
        <meta
          property="og:description"
          content="Have a question, suggestion, or want to submit a tool? Contact the ToolSphere team. We'd love to hear from you."
        />
        <meta property="og:url" content="https://toolsphere.ai/contact" />
        <meta name="twitter:title" content="Contact Us - ToolSphere" />
        <meta
          name="twitter:description"
          content="Have a question, suggestion, or want to submit a tool? Contact the ToolSphere team. We'd love to hear from you."
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
                Contact
              </span>
            </li>
          </ol>
        </nav>

        {/* Hero Section */}
        <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 p-8 shadow-2xl shadow-cyan-950/30 lg:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
              <FiMail className="h-4 w-4" />
              {settings.hero_badge}
            </div>

            <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">
              {settings.hero_heading}
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              {settings.hero_description}
            </p>

            {/* FAQ Shortcut Button */}
            <div className="mt-8">
              <Link
                to="/faq"
                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-6 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20 hover:border-cyan-400/50"
              >
                <FiMessageCircle className="h-4 w-4" />
                {settings.faq_button_text}
              </Link>
            </div>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {contactInfo.map((info) => (
            <motion.div
              key={info.title}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                <info.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold">{info.title}</h3>
              <p className="mt-1 text-cyan-300">{info.detail}</p>
              <p className="mt-1 text-sm text-slate-400">{info.description}</p>
            </motion.div>
          ))}
        </section>

        {/* Social Links */}
        <section className="mt-8 rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/40 lg:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-semibold">Connect With Us</h2>
            <p className="mt-2 text-slate-400">
              Follow us on social media for updates, tips, and community discussions.
            </p>

            {settingsLoading ? (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="h-12 w-32 animate-pulse rounded-2xl border border-white/10 bg-slate-950/70"
                  />
                ))}
              </div>
            ) : (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                {socialLinks.map((social) => (
                  social.href && social.href.trim() !== "" ? (
                    <a
                      key={social.platform}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-6 py-3 text-sm font-medium text-slate-300 transition hover:border-cyan-400/50 hover:text-cyan-300 hover:bg-cyan-500/10"
                    >
                      <social.icon className="h-5 w-5" />
                      {social.label}
                    </a>
                  ) : (
                    <button
                      key={social.platform}
                      disabled
                      aria-label={`${social.label} - Coming Soon`}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-6 py-3 text-sm font-medium text-slate-500 cursor-not-allowed opacity-60"
                    >
                      <social.icon className="h-5 w-5" />
                      Coming Soon
                    </button>
                  )
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Contact Form */}
        <section className="mt-8 rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/40 lg:p-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold">Send Us a Message</h2>
            <p className="mt-2 text-slate-400">
              Fill out the form below and we'll get back to you as soon as possible.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-sm font-medium text-slate-300"
                  >
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className={`w-full rounded-2xl border bg-slate-950/70 px-4 py-3 outline-none transition ${
                      errors.name
                        ? "border-red-400/50 focus:border-red-400"
                        : "border-white/10 focus:border-cyan-400/50"
                    }`}
                    placeholder="Your full name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                  )}
                </div>

                {/* Email - read-only when logged in, editable when not */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-medium text-slate-300"
                  >
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={!loggedIn ? handleChange : undefined}
                    readOnly={loggedIn}
                    disabled={loggedIn}
                    className={`w-full rounded-2xl border bg-slate-950/70 px-4 py-3 outline-none transition ${
                      loggedIn
                        ? "border-white/10 text-slate-400 cursor-not-allowed"
                        : errors.email
                          ? "border-red-400/50 focus:border-red-400"
                          : "border-white/10 focus:border-cyan-400/50"
                    }`}
                    placeholder={loggedIn ? "Auto-filled from your account" : "your@email.com"}
                  />
                  {loggedIn ? (
                    <p className="mt-1 text-xs text-cyan-400/70">
                      <FiLock className="inline h-3 w-3 mr-0.5" />
                      Email from your verified account
                    </p>
                  ) : errors.email && (
                    <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="subject"
                  className="mb-1.5 block text-sm font-medium text-slate-300"
                >
                  Subject <span className="text-red-400">*</span>
                </label>
                <input
                  id="subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border bg-slate-950/70 px-4 py-3 outline-none transition ${
                    errors.subject
                      ? "border-red-400/50 focus:border-red-400"
                      : "border-white/10 focus:border-cyan-400/50"
                  }`}
                  placeholder="What's this about?"
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-400">{errors.subject}</p>
                )}
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="message"
                  className="mb-1.5 block text-sm font-medium text-slate-300"
                >
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  value={form.message}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border bg-slate-950/70 px-4 py-3 outline-none transition resize-y min-h-[140px] ${
                    errors.message
                      ? "border-red-400/50 focus:border-red-400"
                      : "border-white/10 focus:border-cyan-400/50"
                  }`}
                  placeholder="Tell us more about your inquiry..."
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-400">{errors.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <FiLoader className="h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <FiSend className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Status Message */}
            {submitStatus && (
              <div
                className={`mt-6 rounded-2xl border p-4 ${
                  submitStatus.type === "success"
                    ? "border-green-400/30 bg-green-500/10 text-green-300"
                    : "border-red-400/30 bg-red-500/10 text-red-300"
                }`}
              >
                <p className="flex items-center gap-2">
                  {submitStatus.type === "success" ? "✓" : "✗"}
                  {submitStatus.message}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Google Maps Placeholder */}
        <section className="mt-8 rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/40 lg:p-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold">Find Us</h2>
            <p className="mt-2 text-slate-400">
              We're a remote-first team, but you can find us here.
            </p>

            {/* Google Maps Placeholder */}
            <div className="mt-6 flex aspect-video w-full items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-slate-950/50">
              <div className="text-center">
                <FiMapPin className="mx-auto h-12 w-12 text-slate-500" />
                <p className="mt-2 text-sm text-slate-400">
                  Google Maps integration coming soon
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {settings.office_location}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}