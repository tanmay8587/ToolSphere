import { useEffect, useState } from "react";
import AdminLayout from "../../layout/AdminLayout";
import { createCategory, deleteUser, getCategories, getAdminUsers, getAllTools, featureTool, updateCategory, deleteCategory, toggleCategoryActive, exportSettingsData, exportToolsData, exportCategoriesData, exportUsersData } from "../../services/adminApi";
import { uploadFile } from "../../services/uploadService";
import { FiTool, FiGrid, FiUsers, FiSettings, FiGlobe, FiHome, FiSearch, FiShare2, FiCode, FiTrash2, FiSave, FiRefreshCw, FiMail, FiEdit, FiBarChart2, FiX, FiAlertCircle, FiSend, FiDownload, FiChevronDown } from "react-icons/fi";
import CategoryIcon from "../../components/common/CategoryIcon";
import { getAllSocialLinks, updateSocialLink, initializeSocialLinks } from "../../services/socialService";
import ToggleSwitch from "../../components/common/ToggleSwitch";
import { useToast, ToastContainer } from "../../components/common/Toast";
import { getAllContactSettings, updateContactSetting, initializeContactSettings } from "../../services/contactSettingService";
import { getAllBrandingSettings, updateBrandingSetting, initializeBrandingSettings } from "../../services/websiteBrandingService";
import { getAllSeoSettings, updateSeoSetting, initializeSeoSettings } from "../../services/seoService";
import { getHomeSettings, updateHomeSettings } from "../../services/homeSettingsService";
import { getAllAnalyticsSettings, updateAnalyticsSetting, initializeAnalyticsSettings } from "../../services/analyticsService";
import { getMaintenanceStatus, toggleMaintenanceMode, updateMaintenanceSettings } from "../../services/maintenanceService";
import { getAllSmtpSettings, updateSmtpSetting, initializeSmtpSettings, sendTestEmail } from "../../services/smtpService";
import ImageUploader from "../../components/admin/form/ImageUploader";

// Tab configuration
const tabs = [
  { id: "general", label: "General", icon: FiSettings },
  { id: "branding", label: "Branding", icon: FiGlobe },
  { id: "homepage", label: "Homepage", icon: FiHome },
  { id: "seo", label: "SEO", icon: FiSearch },
  { id: "social", label: "Social Links", icon: FiShare2 },
  { id: "contact", label: "Contact", icon: FiMail },
  { id: "footer", label: "Footer", icon: FiEdit },
  { id: "analytics", label: "Analytics", icon: FiBarChart2 },
  { id: "smtp", label: "SMTP", icon: FiMail },
  { id: "maintenance", label: "Maintenance", icon: FiTool },
  { id: "backup", label: "Backup", icon: FiDownload },
];

// Branding setting field labels
const brandingSettingLabels = {
  logo: "Website Logo",
  favicon: "Favicon",
  site_name: "Site Name",
  browser_title: "Browser Title",
};

// Contact setting field labels
const contactSettingLabels = {
  hero_badge: "Hero Badge",
  hero_heading: "Hero Heading",
  hero_description: "Hero Description",
  faq_button_text: "FAQ Button Text",
  contact_email: "Contact Email",
  office_location: "Office Location",
  response_time: "Response Time",
  working_days: "Working Days",
  working_hours: "Working Hours",
  // Footer settings
  footer_copyright: "Copyright Text",
  footer_description: "Company Description",
  footer_email: "Footer Contact Email",
  footer_disclaimer: "Footer Disclaimer",
};

// SMTP setting field labels
const smtpSettingLabels = {
  smtp_host: "SMTP Host",
  smtp_port: "SMTP Port",
  smtp_username: "SMTP Username",
  smtp_password: "SMTP Password",
  smtp_sender_name: "Sender Name",
  smtp_sender_email: "Sender Email",
};

// All available social platforms
const allPlatforms = ["x", "linkedin", "github", "instagram", "youtube", "discord", "telegram", "facebook"];

// Footer setting keys
const footerSettingKeys = [
  "footer_copyright",
  "footer_description",
  "footer_email",
  "footer_disclaimer",
];

// SEO setting field labels
const seoSettingLabels = {
  default_meta_title: "Default Meta Title",
  meta_description: "Meta Description",
  keywords: "Keywords",
  og_image: "Open Graph Image",
  twitter_image: "Twitter/X Image",
  canonical_url: "Canonical URL",
};

// SEO image setting keys
const seoImageKeys = ["og_image", "twitter_image"];

// SMTP password key (for masking)
const smtpPasswordKey = "smtp_password";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [categoryName, setCategoryName] = useState("");
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [tools, setTools] = useState([]);
  const [status, setStatus] = useState({ type: "info", message: "Manage categories, featured tools, and users below." });
  const [loading, setLoading] = useState(false);
  
  // Icon upload state per category
  const [uploadingIconId, setUploadingIconId] = useState(null);
  const [iconUploadProgress, setIconUploadProgress] = useState(0);
  
  // Social links state
  const [socialLinks, setSocialLinks] = useState([]);
  const [socialLinksOriginal, setSocialLinksOriginal] = useState([]);
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialSaving, setSocialSaving] = useState(false);
  const [socialErrors, setSocialErrors] = useState({});
  const { toasts, addToast, removeToast } = useToast();
  
  // Contact settings state
  const [contactSettings, setContactSettings] = useState([]);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSaving, setContactSaving] = useState({});
  
  // Footer settings state
  const [footerSettings, setFooterSettings] = useState([]);
  const [footerLoading, setFooterLoading] = useState(false);
  const [footerSaving, setFooterSaving] = useState({});

  // Branding settings state
  const [brandingSettings, setBrandingSettings] = useState([]);
  const [brandingLoading, setBrandingLoading] = useState(false);
  const [brandingSaving, setBrandingSaving] = useState({});

  // SEO settings state
  const [seoSettings, setSeoSettings] = useState([]);
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoSaving, setSeoSaving] = useState({});

  // Homepage settings state
  const [homeSettings, setHomeSettings] = useState({
    heroTrending: { title: "", subtitle: "", icon: "", tools: [] },
    trendingCard: { label: "", title: "", icon: "", tools: [] },
    featuredCategories: { enabled: true, categoryOrder: [] },
    statsCounter: { enabled: true, items: [] },
    testimonials: { enabled: true, items: [] },
    faqPreview: { enabled: true, items: [] },
    ctaSection: { enabled: true, title: "", description: "", primaryButtonText: "", primaryButtonLink: "", secondaryButtonText: "", secondaryButtonLink: "" },
  });
  const [homeLoading, setHomeLoading] = useState(false);
  const [homeSaving, setHomeSaving] = useState(false);
  const [homeErrors, setHomeErrors] = useState({});
  const [heroSectionOpen, setHeroSectionOpen] = useState(true);
  const [trendingCardOpen, setTrendingCardOpen] = useState(true);
  const [featuredCategoriesOpen, setFeaturedCategoriesOpen] = useState(true);
  const [statsCounterOpen, setStatsCounterOpen] = useState(true);
  const [testimonialsOpen, setTestimonialsOpen] = useState(true);
  const [faqPreviewOpen, setFaqPreviewOpen] = useState(true);
  const [ctaSectionOpen, setCtaSectionOpen] = useState(true);

  // Analytics settings state
  const [analyticsSettings, setAnalyticsSettings] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsSaving, setAnalyticsSaving] = useState({});

  // Maintenance settings state
  const [maintenanceSettings, setMaintenanceSettings] = useState({
    isEnabled: false,
    message: "We'll be back soon! The website is currently under maintenance.",
    estimatedTime: "",
  });
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);

  // SMTP settings state
  const [smtpSettings, setSmtpSettings] = useState([]);
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpSaving, setSmtpSaving] = useState({});
  const [testEmail, setTestEmail] = useState("");
  const [testEmailSending, setTestEmailSending] = useState(false);

  // Analytics setting field labels
  const analyticsSettingLabels = {
    google_analytics_id: "Google Analytics Measurement ID",
    google_search_console_code: "Google Search Console Verification Code",
    meta_pixel_id: "Meta Pixel ID",
  };

const loadData = async () => {
    setLoading(true);
    try {
      const [categoriesRes, usersRes, toolsRes] = await Promise.all([
        getCategories(),
        getAdminUsers(),
        getAllTools({ limit: 20 }),
      ]);
      setCategories(categoriesRes.data.categories || []);
      setUsers(usersRes.data.users || []);
      setTools(toolsRes.data.tools || []);
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.message || "Failed to load settings data." });
    } finally {
      setLoading(false);
    }
  };

  // URL validation function
  const validateUrl = (url) => {
    if (!url || url.trim() === "") return true; // Empty URLs are valid (disabled)
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  };

  // Check if there are unsaved changes
  const hasSocialChanges = () => {
    return JSON.stringify(socialLinks) !== JSON.stringify(socialLinksOriginal);
  };

  // Load social links
  const loadSocialLinks = async () => {
    setSocialLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("No authentication token found");
      }
      const result = await getAllSocialLinks(token);
      if (result.success && result.socialLinks) {
        // Create a map of platform to data for easy lookup
        const platformMap = {};
        result.socialLinks.forEach(link => {
          platformMap[link.platform] = link;
        });
        
        // Build all platforms with their data (or defaults if not set)
        const allLinks = allPlatforms.map(platform => ({
          platform: platform,
          url: platformMap[platform]?.url || "",
          isActive: platformMap[platform]?.isActive ?? true,
        }));
        setSocialLinks(allLinks);
        setSocialLinksOriginal(allLinks); // Store original for change detection
      } else {
        // If no social links exist, create empty entries for all platforms
        const allLinks = allPlatforms.map(platform => ({
          platform: platform,
          url: "",
          isActive: true,
        }));
        setSocialLinks(allLinks);
        setSocialLinksOriginal(allLinks);
      }
    } catch (err) {
      console.error("Failed to load social links:", err);
      // On error, still show all platforms with empty links
      const allLinks = allPlatforms.map(platform => ({
        platform: platform,
        url: "",
        isActive: true,
      }));
      setSocialLinks(allLinks);
      setSocialLinksOriginal(allLinks);
    } finally {
      setSocialLoading(false);
    }
  };

  // Save all social links at once
  const handleSaveAllSocialLinks = async () => {
    // Validate all URLs first
    const errors = {};
    let hasErrors = false;
    
    socialLinks.forEach(link => {
      if (link.url && !validateUrl(link.url)) {
        errors[link.platform] = "Please enter a valid URL (e.g., https://...)";
        hasErrors = true;
      }
    });
    
    if (hasErrors) {
      setSocialErrors(errors);
      addToast("Please fix the invalid URLs before saving", "error");
      return;
    }
    
    setSocialErrors({});
    setSocialSaving(true);
    
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        addToast("Authentication required", "error");
        return;
      }
      
      // Save all changed links
      const savePromises = socialLinks.map(async (link) => {
        const original = socialLinksOriginal.find(l => l.platform === link.platform);
        if (original && (original.url !== link.url || original.isActive !== link.isActive)) {
          return updateSocialLink(token, link.platform, {
            url: link.url,
            isActive: link.isActive,
          });
        }
        return Promise.resolve({ success: true });
      });
      
      await Promise.all(savePromises);
      
      // Update original state after successful save
      setSocialLinksOriginal(socialLinks);
      addToast("Social links saved successfully!", "success");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to save social links", "error");
    } finally {
      setSocialSaving(false);
    }
  };

  // Cancel/Reset changes
  const handleCancelSocialLinks = () => {
    if (hasSocialChanges()) {
      if (window.confirm("Discard all unsaved changes?")) {
        setSocialLinks(socialLinksOriginal);
        setSocialErrors({});
        addToast("Changes discarded", "info");
      }
    }
  };

  // Update single social link (for toggle changes)
  const handleUpdateSocialLink = async (platform, field, value) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        addToast("Authentication required", "error");
        return;
      }
      
      const result = await updateSocialLink(token, platform, { [field]: value });
      
      if (result.success) {
        // Update local state
        setSocialLinks(prev => 
          prev.map(link => 
            link.platform === platform ? { ...link, ...result.socialLink } : link
          )
        );
        setSocialLinksOriginal(prev => 
          prev.map(link => 
            link.platform === platform ? { ...link, ...result.socialLink } : link
          )
        );
        addToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} updated successfully`, "success");
      }
    } catch (err) {
      addToast(err.response?.data?.message || `Failed to update ${platform}`, "error");
    }
  };

  // Initialize social links if needed
  const handleInitializeSocialLinks = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        addToast("Authentication required", "error");
        return;
      }
      const result = await initializeSocialLinks(token);
      if (result.success) {
        addToast(result.message, "success");
        loadSocialLinks();
      }
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to initialize social links", "error");
    }
  };

  // Load contact settings
  const loadContactSettings = async () => {
    setContactLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("No authentication token found");
      }
      const result = await getAllContactSettings(token);
      if (result.success) {
        setContactSettings(result.settings || []);
      }
    } catch (err) {
      console.error("Failed to load contact settings:", err);
    } finally {
      setContactLoading(false);
    }
  };

  // Initialize contact settings if needed
  const handleInitializeContactSettings = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setStatus({ type: "error", message: "Authentication required" });
        return;
      }
      const result = await initializeContactSettings(token);
      if (result.success) {
        setStatus({ type: "success", message: result.message });
        loadContactSettings();
      }
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.message || "Failed to initialize contact settings" });
    }
  };

  // Update contact setting
  const handleUpdateContactSetting = async (key, value) => {
    setContactSaving(prev => ({ ...prev, [key]: true }));
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setStatus({ type: "error", message: "Authentication required" });
        return;
      }
      
      const result = await updateContactSetting(token, key, value);
      
      if (result.success) {
        // Update local state
        setContactSettings(prev => 
          prev.map(setting => 
            setting.key === key ? { ...setting, value } : setting
          )
        );
        setStatus({ type: "success", message: "Contact setting updated successfully" });
      }
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.message || "Failed to update contact setting" });
    } finally {
      setContactSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  // Load footer settings
  const loadFooterSettings = async () => {
    setFooterLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("No authentication token found");
      }
      const result = await getAllContactSettings(token);
      if (result.success) {
        // Filter to only show footer settings
        const footerSettingsData = result.settings.filter(s => footerSettingKeys.includes(s.key));
        setFooterSettings(footerSettingsData);
      }
    } catch (err) {
      console.error("Failed to load footer settings:", err);
    } finally {
      setFooterLoading(false);
    }
  };

  // Update footer setting
  const handleUpdateFooterSetting = async (key, value) => {
    setFooterSaving(prev => ({ ...prev, [key]: true }));
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setStatus({ type: "error", message: "Authentication required" });
        return;
      }
      
      const result = await updateContactSetting(token, key, value);
      
      if (result.success) {
        // Update local state
        setFooterSettings(prev => 
          prev.map(setting => 
            setting.key === key ? { ...setting, value } : setting
          )
        );
        setStatus({ type: "success", message: "Footer setting updated successfully" });
      }
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.message || "Failed to update footer setting" });
    } finally {
      setFooterSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Load social links when social tab is active
  useEffect(() => {
    if (activeTab === "social") {
      loadSocialLinks();
    }
  }, [activeTab]);

  // Load contact settings when contact tab is active
  useEffect(() => {
    if (activeTab === "contact") {
      loadContactSettings();
    }
  }, [activeTab]);

  // Load footer settings when footer tab is active
  useEffect(() => {
    if (activeTab === "footer") {
      loadFooterSettings();
    }
  }, [activeTab]);

// Load branding settings when branding tab is active
  useEffect(() => {
    if (activeTab === "branding") {
      loadBrandingSettings();
    }
  }, [activeTab]);

  // Load SEO settings when SEO tab is active
  useEffect(() => {
    if (activeTab === "seo") {
      loadSeoSettings();
    }
  }, [activeTab]);

  // Load homepage settings when Homepage tab is active
  useEffect(() => {
    if (activeTab === "homepage") {
      loadHomeSettings();
    }
  }, [activeTab]);

  // Load analytics settings when analytics tab is active
  useEffect(() => {
    if (activeTab === "analytics") {
      loadAnalyticsSettings();
    }
  }, [activeTab]);

  // Load maintenance settings when maintenance tab is active
  useEffect(() => {
    if (activeTab === "maintenance") {
      loadMaintenanceSettings();
    }
  }, [activeTab]);

  // Load SMTP settings when SMTP tab is active
  useEffect(() => {
    if (activeTab === "smtp") {
      loadSmtpSettings();
    }
  }, [activeTab]);

  // Load branding settings
  const loadBrandingSettings = async () => {
    setBrandingLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("No authentication token found");
      }
      const result = await getAllBrandingSettings(token);
      if (result.success) {
        setBrandingSettings(result.settings || []);
      }
    } catch (err) {
      console.error("Failed to load branding settings:", err);
    } finally {
      setBrandingLoading(false);
    }
  };

  // Load SEO settings
  const loadSeoSettings = async () => {
    setSeoLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("No authentication token found");
      }
      const result = await getAllSeoSettings(token);
      if (result.success) {
        setSeoSettings(result.settings || []);
      }
    } catch (err) {
      console.error("Failed to load SEO settings:", err);
    } finally {
      setSeoLoading(false);
    }
  };

  // Load analytics settings
  const loadAnalyticsSettings = async () => {
    setAnalyticsLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("No authentication token found");
      }
      const result = await getAllAnalyticsSettings(token);
      if (result.success) {
        setAnalyticsSettings(result.settings || []);
      }
    } catch (err) {
      console.error("Failed to load analytics settings:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Load maintenance settings
  const loadMaintenanceSettings = async () => {
    setMaintenanceLoading(true);
    try {
      const result = await getMaintenanceStatus();
      if (result.success) {
        setMaintenanceSettings({
          isEnabled: result.isEnabled,
          message: result.message,
          estimatedTime: result.estimatedTime,
        });
      }
    } catch (err) {
      console.error("Failed to load maintenance settings:", err);
    } finally {
      setMaintenanceLoading(false);
    }
  };

  // Load SMTP settings
  const loadSmtpSettings = async () => {
    setSmtpLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("No authentication token found");
      }
      const result = await getAllSmtpSettings(token);
      if (result.success) {
        setSmtpSettings(result.settings || []);
      }
    } catch (err) {
      console.error("Failed to load SMTP settings:", err);
    } finally {
      setSmtpLoading(false);
    }
  };

  // Load homepage settings
  const loadHomeSettings = async () => {
    setHomeLoading(true);
    try {
      const result = await getHomeSettings();
      
      // Fallback to current homepage values if settings are empty
      const fallbackHeroTrending = {
        title: "Trending now",
        subtitle: "AI Design Stack",
        icon: "FiZap",
        tools: [
          {
            name: "ChatGPT",
            category: "Writing",
            rating: 4.9,
            description: "A versatile conversational AI assistant for brainstorming and writing.",
          },
          {
            name: "Midjourney",
            category: "Image",
            rating: 4.8,
            description: "Create stunning visuals with text prompts and style control.",
          },
          {
            name: "Notion AI",
            category: "Productivity",
            rating: 4.7,
            description: "Enhance your workspace with AI-powered summaries and writing.",
          },
        ],
        badge: "Discover the future of AI products",
        heading: "Find the best AI tools for every workflow.",
        description: "Explore curated AI platforms for writing, coding, design, marketing, and more — all in one place.",
        searchPlaceholder: "Search AI tools, categories, tags...",
        buttonText: "Explore",
      };

      const fallbackTrendingCard = {
        label: "Trending now",
        title: "AI Design Stack",
        icon: "FiZap",
        tools: [
          {
            name: "ChatGPT",
            category: "Writing",
            rating: 4.9,
            description: "A versatile conversational AI assistant for brainstorming and writing.",
          },
          {
            name: "Midjourney",
            category: "Image",
            rating: 4.8,
            description: "Create stunning visuals with text prompts and style control.",
          },
          {
            name: "Notion AI",
            category: "Productivity",
            rating: 4.7,
            description: "Enhance your workspace with AI-powered summaries and writing.",
          },
        ],
      };

      const fallbackFeaturedCategories = {
        enabled: true,
        categoryOrder: [],
      };

      const fallbackStatsCounter = {
        enabled: true,
        items: [
          {
            label: "AI tools",
            value: "100+",
          },
          {
            label: "Real ratings",
            value: "Verified",
          },
          {
            label: "New releases weekly",
            value: "Updated",
          },
        ],
      };

      const fallbackTestimonials = {
        enabled: true,
        items: [
          {
            name: "Sarah Johnson",
            role: "Product Manager",
            content: "ToolSphere helped us discover the perfect AI tools for our workflow. The curated selection saves us hours of research.",
            rating: 5,
          },
          {
            name: "Michael Chen",
            role: "Software Engineer",
            content: "An invaluable resource for finding AI tools. The ratings and reviews are spot-on and help make informed decisions.",
            rating: 5,
          },
          {
            name: "Emily Rodriguez",
            role: "Marketing Director",
            content: "The best AI tools directory I've found. Clean interface, comprehensive listings, and great recommendations.",
            rating: 4.8,
          },
        ],
      };

      const fallbackFaqPreview = {
        enabled: true,
        items: [
          {
            question: "What is ToolSphere?",
            answer: "ToolSphere is a curated platform featuring the best AI tools for various workflows including writing, coding, design, and marketing.",
          },
          {
            question: "How do I find the right tool?",
            answer: "Use our search feature or browse categories to discover AI tools that match your specific needs and workflow requirements.",
          },
          {
            question: "Are the tools free to use?",
            answer: "Many tools offer free tiers or trials. Each tool listing includes pricing information to help you choose what fits your budget.",
          },
          {
            question: "How often are new tools added?",
            answer: "We update our directory weekly with new AI tools and platforms to ensure you have access to the latest innovations.",
          },
        ],
      };

      const fallbackCtaSection = {
        enabled: true,
        title: "Ready to explore AI tools?",
        description: "Join thousands of users discovering the best AI tools for their workflow. Start exploring ToolSphere today.",
        primaryButtonText: "Browse All Tools",
        primaryButtonLink: "/tools",
        secondaryButtonText: "View Categories",
        secondaryButtonLink: "/categories",
      };

      if (result.success && result.settings) {
        setHomeSettings({
          heroTrending: result.settings.heroTrending || fallbackHeroTrending,
          trendingCard: result.settings.trendingCard || fallbackTrendingCard,
          featuredCategories: result.settings.featuredCategories || fallbackFeaturedCategories,
          statsCounter: result.settings.statsCounter || fallbackStatsCounter,
          testimonials: result.settings.testimonials || fallbackTestimonials,
          faqPreview: result.settings.faqPreview || fallbackFaqPreview,
          ctaSection: result.settings.ctaSection || fallbackCtaSection,
        });
      } else {
        // If no settings exist at all, use all fallbacks
        setHomeSettings({
          heroTrending: fallbackHeroTrending,
          trendingCard: fallbackTrendingCard,
          featuredCategories: fallbackFeaturedCategories,
          statsCounter: fallbackStatsCounter,
          testimonials: fallbackTestimonials,
          faqPreview: fallbackFaqPreview,
          ctaSection: fallbackCtaSection,
        });
      }
    } catch (err) {
      console.error("Failed to load homepage settings:", err);
      // On error, use fallback values
      addToast("Failed to load settings, using defaults", "error");
    } finally {
      setHomeLoading(false);
    }
  };

  // Validate homepage settings
  const validateHomeSettings = () => {
    const errors = {};

    // Validate heroTrending
    if (homeSettings.heroTrending) {
      if (!homeSettings.heroTrending.badge?.trim()) {
        errors.heroBadge = "Hero badge is required";
      } else if (homeSettings.heroTrending.badge.length > 120) {
        errors.heroBadge = "Hero badge must not exceed 120 characters";
      }

      if (!homeSettings.heroTrending.heading?.trim()) {
        errors.heroHeading = "Hero heading is required";
      } else if (homeSettings.heroTrending.heading.length > 200) {
        errors.heroHeading = "Hero heading must not exceed 200 characters";
      }

      if (!homeSettings.heroTrending.description?.trim()) {
        errors.heroDescription = "Hero description is required";
      } else if (homeSettings.heroTrending.description.length > 500) {
        errors.heroDescription = "Hero description must not exceed 500 characters";
      }

      if (!homeSettings.heroTrending.searchPlaceholder?.trim()) {
        errors.heroSearchPlaceholder = "Search placeholder is required";
      }

      if (!homeSettings.heroTrending.buttonText?.trim()) {
        errors.heroButtonText = "Button text is required";
      }

      // Validate tools
      if (homeSettings.heroTrending.tools && homeSettings.heroTrending.tools.length > 0) {
        homeSettings.heroTrending.tools.forEach((tool, index) => {
          if (!tool.name?.trim()) {
            errors[`heroToolName${index}`] = `Tool ${index + 1} name is required`;
          }
          if (!tool.category?.trim()) {
            errors[`heroToolCategory${index}`] = `Tool ${index + 1} category is required`;
          }
          if (tool.rating === undefined || tool.rating === null || tool.rating === "") {
            errors[`heroToolRating${index}`] = `Tool ${index + 1} rating is required`;
          } else if (isNaN(tool.rating) || tool.rating < 0 || tool.rating > 5) {
            errors[`heroToolRating${index}`] = `Tool ${index + 1} rating must be between 0 and 5`;
          }
        });
      }
    }

    // Validate trendingCard
    if (homeSettings.trendingCard) {
      if (!homeSettings.trendingCard.label?.trim()) {
        errors.trendingLabel = "Trending card label is required";
      }
      if (!homeSettings.trendingCard.title?.trim()) {
        errors.trendingTitle = "Trending card title is required";
      }
    }

    // Validate ctaSection
    if (homeSettings.ctaSection?.enabled) {
      if (!homeSettings.ctaSection.title?.trim()) {
        errors.ctaTitle = "CTA title is required";
      } else if (homeSettings.ctaSection.title.length > 200) {
        errors.ctaTitle = "CTA title must not exceed 200 characters";
      }

      if (!homeSettings.ctaSection.description?.trim()) {
        errors.ctaDescription = "CTA description is required";
      } else if (homeSettings.ctaSection.description.length > 500) {
        errors.ctaDescription = "CTA description must not exceed 500 characters";
      }

      if (!homeSettings.ctaSection.primaryButtonText?.trim()) {
        errors.ctaPrimaryButtonText = "Primary button text is required";
      }

      if (!homeSettings.ctaSection.primaryButtonLink?.trim()) {
        errors.ctaPrimaryButtonLink = "Primary button link is required";
      }

      if (!homeSettings.ctaSection.secondaryButtonText?.trim()) {
        errors.ctaSecondaryButtonText = "Secondary button text is required";
      }

      if (!homeSettings.ctaSection.secondaryButtonLink?.trim()) {
        errors.ctaSecondaryButtonLink = "Secondary button link is required";
      }
    }

    setHomeErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save homepage settings
  const handleSaveHomeSettings = async () => {
    // Validate before saving
    if (!validateHomeSettings()) {
      addToast("Please fix the validation errors before saving", "error");
      return;
    }

    setHomeSaving(true);
    setHomeErrors({});
    try {
      const result = await updateHomeSettings(homeSettings);
      if (result.success) {
        addToast("Homepage settings updated successfully", "success");
        if (result.settings) {
          setHomeSettings({
            heroTrending: result.settings.heroTrending || homeSettings.heroTrending,
            trendingCard: result.settings.trendingCard || homeSettings.trendingCard,
            featuredCategories: result.settings.featuredCategories || homeSettings.featuredCategories,
            statsCounter: result.settings.statsCounter || homeSettings.statsCounter,
            testimonials: result.settings.testimonials || homeSettings.testimonials,
            faqPreview: result.settings.faqPreview || homeSettings.faqPreview,
            ctaSection: result.settings.ctaSection || homeSettings.ctaSection,
          });
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to update homepage settings";
      addToast(errorMessage, "error");
    } finally {
      setHomeSaving(false);
    }
  };

  // Add a new trending tool row
  const addHomeTool = () => {
    setHomeSettings(prev => ({
      ...prev,
      heroTrending: {
        ...prev.heroTrending,
        tools: [
          ...(prev.heroTrending.tools || []),
          { name: "", category: "", rating: 0, description: "" },
        ],
      },
    }));
  };

  // Update a single field of a trending tool
  const updateHomeTool = (idx, field, value) => {
    setHomeSettings(prev => ({
      ...prev,
      heroTrending: {
        ...prev.heroTrending,
        tools: prev.heroTrending.tools.map((t, i) =>
          i === idx ? { ...t, [field]: value } : t
        ),
      },
    }));
  };

  // Remove a trending tool row
  const removeHomeTool = (idx) => {
    setHomeSettings(prev => ({
      ...prev,
      heroTrending: {
        ...prev.heroTrending,
        tools: prev.heroTrending.tools.filter((_, i) => i !== idx),
      },
    }));
  };

  // Update maintenance settings
  const handleUpdateMaintenance = async () => {
    setMaintenanceSaving(true);
    try {
      const result = await updateMaintenanceSettings(maintenanceSettings);
      if (result.success) {
        setStatus({ type: "success", message: "Maintenance settings updated successfully" });
      }
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.message || "Failed to update maintenance settings" });
    } finally {
      setMaintenanceSaving(false);
    }
  };

  // Toggle maintenance mode
  const handleToggleMaintenance = async () => {
    setMaintenanceSaving(true);
    try {
      const result = await toggleMaintenanceMode({
        isEnabled: !maintenanceSettings.isEnabled,
        message: maintenanceSettings.message,
        estimatedTime: maintenanceSettings.estimatedTime,
      });
      if (result.success) {
        setMaintenanceSettings(prev => ({
          ...prev,
          isEnabled: !prev.isEnabled,
        }));
        setStatus({ type: "success", message: result.message });
      }
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.message || "Failed to toggle maintenance mode" });
    } finally {
      setMaintenanceSaving(false);
    }
  };

  // Update SEO setting
  const handleUpdateSeoSetting = async (key, value) => {
    setSeoSaving(prev => ({ ...prev, [key]: true }));
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setStatus({ type: "error", message: "Authentication required" });
        return;
      }
      
      const result = await updateSeoSetting(token, key, value);
      
      if (result.success) {
        // Update local state
        setSeoSettings(prev => 
          prev.map(setting => 
            setting.key === key ? { ...setting, value } : setting
          )
        );
        setStatus({ type: "success", message: "SEO setting updated successfully" });
      }
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.message || "Failed to update SEO setting" });
    } finally {
      setSeoSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  // Initialize SEO settings
  const handleInitializeSeoSettings = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setStatus({ type: "error", message: "Authentication required" });
        return;
      }
      const result = await initializeSeoSettings(token);
      if (result.success) {
        setStatus({ type: "success", message: result.message });
        loadSeoSettings();
      }
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.message || "Failed to initialize SEO settings" });
    }
  };

  // Update branding setting
  const handleUpdateBrandingSetting = async (key, value) => {
    setBrandingSaving(prev => ({ ...prev, [key]: true }));
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setStatus({ type: "error", message: "Authentication required" });
        return;
      }
      
      const result = await updateBrandingSetting(token, key, value);
      
      if (result.success) {
        // Update local state
        setBrandingSettings(prev => 
          prev.map(setting => 
            setting.key === key ? { ...setting, value } : setting
          )
        );
        setStatus({ type: "success", message: "Branding setting updated successfully" });
      }
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.message || "Failed to update branding setting" });
    } finally {
      setBrandingSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  // Update analytics setting
  const handleUpdateAnalyticsSetting = async (key, value) => {
    setAnalyticsSaving(prev => ({ ...prev, [key]: true }));
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setStatus({ type: "error", message: "Authentication required" });
        return;
      }
      
      const result = await updateAnalyticsSetting(token, key, value);
      
      if (result.success) {
        // Update local state
        setAnalyticsSettings(prev => 
          prev.map(setting => 
            setting.key === key ? { ...setting, value } : setting
          )
        );
        setStatus({ type: "success", message: "Analytics setting updated successfully" });
      }
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.message || "Failed to update analytics setting" });
    } finally {
      setAnalyticsSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  // Update SMTP setting
  const handleUpdateSmtpSetting = async (key, value) => {
    setSmtpSaving(prev => ({ ...prev, [key]: true }));
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setStatus({ type: "error", message: "Authentication required" });
        return;
      }
      
      const result = await updateSmtpSetting(token, key, value);
      
      if (result.success) {
        // Update local state
        setSmtpSettings(prev => 
          prev.map(setting => {
            if (setting.key === key) {
              // For password field, always clear the value and use hasPassword from response
              if (key === "smtp_password") {
                return {
                  ...setting,
                  value: "",
                  hasPassword: result.setting?.hasPassword ?? true
                };
              }
              // For other fields, use the value from response
              return { ...setting, value: result.setting?.value ?? value };
            }
            return setting;
          })
        );
        setStatus({ type: "success", message: "SMTP setting updated successfully" });
      }
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.message || "Failed to update SMTP setting" });
    } finally {
      setSmtpSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  // Initialize SMTP settings
  const handleInitializeSmtpSettings = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setStatus({ type: "error", message: "Authentication required" });
        return;
      }
      const result = await initializeSmtpSettings(token);
      if (result.success) {
        setStatus({ type: "success", message: result.message });
        loadSmtpSettings();
      }
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.message || "Failed to initialize SMTP settings" });
    }
  };

  // Handle test email
  const handleTestEmail = async () => {
    if (!testEmail.trim()) {
      addToast("Please enter a test email address", "error");
      return;
    }

    setTestEmailSending(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        addToast("Authentication required", "error");
        return;
      }
      
      const result = await sendTestEmail(token, testEmail.trim());
      
      if (result.success) {
        addToast(result.message, "success");
        setTestEmail("");
      }
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to send test email", "error");
    } finally {
      setTestEmailSending(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setStatus({ type: "error", message: "Category name is required." });
      return;
    }

    try {
      await createCategory({ name: categoryName.trim() });
      setCategoryName("");
      setStatus({ type: "success", message: "Category created successfully." });
      loadData();
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.message || "Failed to create category." });
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Delete this category permanently? This cannot be undone.")) return;

    try {
      await deleteCategory(categoryId);
      setStatus({ type: "success", message: "Category deleted successfully." });
      loadData();
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.message || "Failed to delete category." });
    }
  };

  const handleToggleCategory = async (categoryId, currentActive) => {
    try {
      await toggleCategoryActive(categoryId, !currentActive);
      setStatus({ type: "success", message: `Category ${currentActive ? 'disabled' : 'enabled'} successfully.` });
      loadData();
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.message || "Failed to toggle category." });
    }
  };

  const handleIconUpload = async (categoryId, file) => {
    if (!file) return;

    try {
      setUploadingIconId(categoryId);
      setIconUploadProgress(0);

      const url = await uploadFile(file, setIconUploadProgress);

      await updateCategory(categoryId, { icon: url });
      setStatus({ type: "success", message: "Category icon updated successfully." });
      loadData();
    } catch (err) {
      setStatus({ type: "error", message: "Failed to upload icon." });
    } finally {
      setUploadingIconId(null);
      setIconUploadProgress(0);
    }
  };

  const handleRemoveIcon = async (categoryId) => {
    try {
      await updateCategory(categoryId, { icon: "" });
      setStatus({ type: "success", message: "Category icon removed. Default icon will be shown." });
      loadData();
    } catch (err) {
      setStatus({ type: "error", message: "Failed to remove icon." });
    }
  };

  const handleToggleFeatured = async (toolId) => {
    try {
      await featureTool(toolId);
      setStatus({ type: "success", message: "Featured status updated." });
      loadData();
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.message || "Failed to update featured status." });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Remove this user?")) return;

    try {
      await deleteUser(userId);
      setStatus({ type: "success", message: "User removed successfully." });
      loadData();
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.message || "Failed to delete user." });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="mt-2 text-slate-400">Configure your admin panel and manage system settings.</p>
        </div>

        {/* Icon Upload Progress */}
        {iconUploadProgress > 0 && iconUploadProgress < 100 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-slate-300 mb-2">
              <span>Uploading icon...</span>
              <span>{iconUploadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all duration-300"
                style={{ width: `${iconUploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Status Message */}
        <div className={`rounded-2xl px-4 py-3 text-sm ${
          status.type === "success" 
            ? "bg-emerald-500/10 text-emerald-200" 
            : status.type === "error" 
            ? "bg-red-500/10 text-red-200" 
            : "bg-slate-800 text-slate-300"
        }`}>
          {status.message}
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-800">
          <nav className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 rounded-t-xl px-4 py-3 text-sm font-medium transition
                    ${activeTab === tab.id 
                      ? "border-b-2 border-cyan-500 bg-slate-900 text-white" 
                      : "text-slate-400 hover:text-white hover:bg-slate-900/50"
                    }
                  `}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {/* General Tab */}
          {activeTab === "general" && (
            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              {/* Categories Section */}
              <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-black/10">
                <h2 className="text-xl font-semibold text-white mb-4">Manage Categories</h2>
                <form onSubmit={handleCreateCategory} className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="New category name"
                    className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
                  />
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-white transition hover:bg-cyan-600 disabled:opacity-50"
                  >
                    Add Category
                  </button>
                </form>

                <div className="mt-5 space-y-2">
                  {categories.length === 0 && !loading ? (
                    <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center">
                      <p className="text-slate-500">No categories found. Add your first category above.</p>
                    </div>
                  ) : (
                    categories.map((category) => (
                      <div 
                        key={category._id || category.name} 
                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                          category.isActive === false 
                            ? 'border-slate-700/50 bg-slate-900/40 opacity-60' 
                            : 'border-slate-800 bg-slate-900/70'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <CategoryIcon
                            category={category.name}
                            icon={category.icon}
                            size="md"
                          />
                          <div>
                            <span className="text-slate-300">{category.name}</span>
                            {category.isActive === false && (
                              <span className="ml-2 text-xs text-red-400">(disabled)</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-400">{category.count} tools</span>
                          <button
                            onClick={() => handleToggleCategory(category._id, category.isActive)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                              category.isActive === false
                                ? 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30'
                                : 'bg-amber-600/20 text-amber-300 hover:bg-amber-600/30'
                            }`}
                          >
                            {category.isActive === false ? 'Enable' : 'Disable'}
                          </button>
                          <label className="cursor-pointer rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50">
                            {uploadingIconId === category._id ? "Uploading..." : "Icon"}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleIconUpload(category._id, e.target.files?.[0])}
                              className="hidden"
                              disabled={uploadingIconId === category._id}
                            />
                          </label>
                          {category.icon && category.icon.startsWith("http") && (
                            <button
                              onClick={() => handleRemoveIcon(category._id)}
                              className="rounded-xl bg-orange-600/20 px-3 py-1.5 text-xs font-medium text-orange-300 transition hover:bg-orange-600/30 flex items-center gap-1"
                              title="Remove custom icon"
                            >
                              <FiTrash2 className="h-3 w-3" />
                              Remove
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteCategory(category._id)}
                            className="rounded-xl bg-red-600/20 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-600/30"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Featured Tools Section */}
              <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-black/10">
                <h2 className="text-xl font-semibold text-white mb-4">Featured Tools</h2>
                <div className="space-y-2">
                  {tools.length === 0 && !loading ? (
                    <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center">
                      <p className="text-slate-500">No tools available. Add tools to feature them.</p>
                    </div>
                  ) : (
                    tools.map((tool) => (
                      <div 
                        key={tool._id} 
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3"
                      >
                        <div>
                          <p className="font-semibold text-white">{tool.name}</p>
                          <p className="text-sm text-slate-400">{tool.category}</p>
                        </div>
                        <button 
                          onClick={() => handleToggleFeatured(tool._id)} 
                          className={`
                            rounded-xl px-3 py-2 text-sm font-semibold
                            ${tool.featured 
                              ? "bg-amber-600 text-white" 
                              : "bg-cyan-600 text-white"
                            }
                          `}
                        >
                          {tool.featured ? "Remove Featured" : "Mark Featured"}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          )}

          {/* Branding Tab */}
          {activeTab === "branding" && (
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-black/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Website Branding</h2>
                {brandingSettings.length === 0 && !brandingLoading && (
                  <button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem("adminToken");
                        if (!token) {
                          setStatus({ type: "error", message: "Authentication required" });
                          return;
                        }
                        const result = await initializeBrandingSettings(token);
                        if (result.success) {
                          setStatus({ type: "success", message: result.message });
                          loadBrandingSettings();
                        }
                      } catch (err) {
                        setStatus({ type: "error", message: err.response?.data?.message || "Failed to initialize branding settings" });
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
                  >
                    <FiRefreshCw size={16} />
                    Initialize Settings
                  </button>
                )}
              </div>
              
              {brandingLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl border border-slate-700 bg-slate-900" />
                  ))}
                </div>
              ) : brandingSettings.length > 0 ? (
                <div className="space-y-6">
                  {brandingSettings.map((setting) => (
                    <div key={setting.key} className="space-y-3">
                      <label className="block text-sm font-medium text-slate-300">
                        {brandingSettingLabels[setting.key] || setting.key}
                      </label>
                      
                      {setting.key === "logo" || setting.key === "favicon" ? (
                        <div className="flex items-start gap-4">
                          <ImageUploader
                            label=""
                            value={setting.value}
                            onChange={(url) => {
                              setBrandingSettings(prev => 
                                prev.map(s => s.key === setting.key ? { ...s, value: url } : s)
                              );
                            }}
                            onUpload={async (url) => {
                              await handleUpdateBrandingSetting(setting.key, url);
                            }}
                            previewSize="small"
                            placeholder={setting.key === "favicon" ? "https://placehold.co/32x32?text=Favicon" : "https://placehold.co/150x40?text=Logo"}
                          />
                          {brandingSaving[setting.key] && (
                            <div className="flex items-center gap-1 text-xs text-cyan-400 pt-2">
                              <FiSave className="animate-pulse" size={14} />
                              Saving...
                            </div>
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={setting.value}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setBrandingSettings(prev => 
                              prev.map(s => s.key === setting.key ? { ...s, value: newValue } : s)
                            );
                          }}
                          onBlur={(e) => handleUpdateBrandingSetting(setting.key, e.target.value)}
                          placeholder={`Enter ${brandingSettingLabels[setting.key] || setting.key}...`}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center">
                  <p className="text-slate-400 mb-3">No branding settings configured yet.</p>
                  <button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem("adminToken");
                        if (!token) {
                          setStatus({ type: "error", message: "Authentication required" });
                          return;
                        }
                        const result = await initializeBrandingSettings(token);
                        if (result.success) {
                          setStatus({ type: "success", message: result.message });
                          loadBrandingSettings();
                        }
                      } catch (err) {
                        setStatus({ type: "error", message: err.response?.data?.message || "Failed to initialize branding settings" });
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
                  >
                    <FiRefreshCw size={16} />
                    Initialize Default Settings
                  </button>
                </div>
              )}
              
              <p className="text-sm text-slate-500 mt-4">
                Configure website branding. Logo and favicon are uploaded via drag & drop. Text fields are saved automatically when you click outside the input field.
              </p>
            </div>
          )}

          {/* Appearance Tab - Placeholder */}
          {activeTab === "appearance" && (
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-black/10">
              <h2 className="text-xl font-semibold text-white mb-4">Appearance Settings</h2>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Primary Color</label>
                    <input
                      type="color"
                      defaultValue="#06b6d4"
                      className="h-12 w-full rounded-xl border border-slate-700 bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Dark Mode</label>
                    <div className="flex h-12 items-center rounded-xl border border-slate-700 bg-slate-900 px-4">
                      <span className="text-slate-400">Enabled (default)</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-500">
                  Note: Appearance settings are currently placeholders. Backend support required for persistence.
                </p>
              </div>
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === "seo" && (
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-black/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">SEO Settings</h2>
                {seoSettings.length === 0 && !seoLoading && (
                  <button
                    onClick={handleInitializeSeoSettings}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
                  >
                    <FiRefreshCw size={16} />
                    Initialize Settings
                  </button>
                )}
              </div>
              
              {seoLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl border border-slate-700 bg-slate-900" />
                  ))}
                </div>
              ) : seoSettings.length > 0 ? (
                <div className="space-y-6">
                  {seoSettings.map((setting) => (
                    <div key={setting.key} className="space-y-3">
                      <label className="block text-sm font-medium text-slate-300">
                        {seoSettingLabels[setting.key] || setting.key}
                      </label>
                      
                      {seoImageKeys.includes(setting.key) ? (
                        <div className="flex items-start gap-4">
                          <ImageUploader
                            label=""
                            value={setting.value}
                            onChange={(url) => {
                              setSeoSettings(prev => 
                                prev.map(s => s.key === setting.key ? { ...s, value: url } : s)
                              );
                            }}
                            onUpload={async (url) => {
                              await handleUpdateSeoSetting(setting.key, url);
                            }}
                            previewSize="small"
                            placeholder="https://placehold.co/1200x630?text=OG+Image"
                          />
                          {seoSaving[setting.key] && (
                            <div className="flex items-center gap-1 text-xs text-cyan-400 pt-2">
                              <FiSave className="animate-pulse" size={14} />
                              Saving...
                            </div>
                          )}
                        </div>
                      ) : setting.key === "meta_description" || setting.key === "keywords" ? (
                        <textarea
                          value={setting.value}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setSeoSettings(prev => 
                              prev.map(s => s.key === setting.key ? { ...s, value: newValue } : s)
                            );
                          }}
                          onBlur={(e) => handleUpdateSeoSetting(setting.key, e.target.value)}
                          placeholder={`Enter ${seoSettingLabels[setting.key] || setting.key}...`}
                          rows={3}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500 resize-none"
                        />
                      ) : (
                        <input
                          type="text"
                          value={setting.value}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setSeoSettings(prev => 
                              prev.map(s => s.key === setting.key ? { ...s, value: newValue } : s)
                            );
                          }}
                          onBlur={(e) => handleUpdateSeoSetting(setting.key, e.target.value)}
                          placeholder={`Enter ${seoSettingLabels[setting.key] || setting.key}...`}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center">
                  <p className="text-slate-400 mb-3">No SEO settings configured yet.</p>
                  <button
                    onClick={handleInitializeSeoSettings}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
                  >
                    <FiRefreshCw size={16} />
                    Initialize Default Settings
                  </button>
                </div>
              )}
              
              <p className="text-sm text-slate-500 mt-4">
                Configure SEO settings for your website. Text fields are saved automatically when you click outside the input field. Images can be uploaded via drag & drop.
              </p>
            </div>
          )}

          {/* Homepage Tab */}
          {activeTab === "homepage" && (
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-black/10">
              {/* Sticky Action Bar */}
              <div className="sticky top-0 z-10 -mx-6 -mt-6 mb-6 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-6 py-4 backdrop-blur-sm">
                <h2 className="text-xl font-semibold text-white">Homepage Settings</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      loadHomeSettings();
                      addToast("Changes discarded", "info");
                    }}
                    disabled={homeSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
                  >
                    <FiX size={16} />
                    Reset
                  </button>
                  <button
                    onClick={handleSaveHomeSettings}
                    disabled={homeSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {homeSaving ? (
                      <>
                        <FiSave className="animate-spin" size={16} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave size={16} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Loading Skeleton */}
              {homeLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-32 animate-pulse rounded-2xl border border-slate-700 bg-slate-900" />
                  ))}
                </div>
              ) : (
                <>
                  {/* Hero Section - Collapsible */}
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => setHeroSectionOpen(prev => !prev)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-900"
                >
                  <span className="text-base font-semibold text-white">Hero Section</span>
                  <FiChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform duration-200 ${heroSectionOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {heroSectionOpen && (
                  <div className="border-t border-slate-800 p-5 space-y-5">
                    {/* Badge */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-300">
                        Badge
                      </label>
                      <input
                        type="text"
                        value={homeSettings.heroTrending?.badge || ""}
                        onChange={(e) => {
                          setHomeSettings(prev => ({
                            ...prev,
                            heroTrending: {
                              ...prev.heroTrending,
                              badge: e.target.value,
                            },
                          }));
                        }}
                        placeholder="Enter badge text..."
                        className={`w-full rounded-xl border bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500 ${
                          homeErrors.heroBadge ? "border-red-500" : "border-slate-700"
                        }`}
                      />
                      {homeErrors.heroBadge && (
                        <p className="text-xs text-red-400">{homeErrors.heroBadge}</p>
                      )}
                    </div>

                    {/* Heading */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-300">
                        Heading
                      </label>
                      <input
                        type="text"
                        value={homeSettings.heroTrending?.heading || ""}
                        onChange={(e) => {
                          setHomeSettings(prev => ({
                            ...prev,
                            heroTrending: {
                              ...prev.heroTrending,
                              heading: e.target.value,
                            },
                          }));
                        }}
                        placeholder="Enter heading..."
                        className={`w-full rounded-xl border bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500 ${
                          homeErrors.heroHeading ? "border-red-500" : "border-slate-700"
                        }`}
                      />
                      {homeErrors.heroHeading && (
                        <p className="text-xs text-red-400">{homeErrors.heroHeading}</p>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-300">
                        Description
                      </label>
                      <textarea
                        value={homeSettings.heroTrending?.description || ""}
                        onChange={(e) => {
                          setHomeSettings(prev => ({
                            ...prev,
                            heroTrending: {
                              ...prev.heroTrending,
                              description: e.target.value,
                            },
                          }));
                        }}
                        placeholder="Enter description..."
                        rows={3}
                        className={`w-full rounded-xl border bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500 resize-none ${
                          homeErrors.heroDescription ? "border-red-500" : "border-slate-700"
                        }`}
                      />
                      {homeErrors.heroDescription && (
                        <p className="text-xs text-red-400">{homeErrors.heroDescription}</p>
                      )}
                    </div>

                    {/* Search Placeholder */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-300">
                        Search Placeholder
                      </label>
                      <input
                        type="text"
                        value={homeSettings.heroTrending?.searchPlaceholder || ""}
                        onChange={(e) => {
                          setHomeSettings(prev => ({
                            ...prev,
                            heroTrending: {
                              ...prev.heroTrending,
                              searchPlaceholder: e.target.value,
                            },
                          }));
                        }}
                        placeholder="Enter search placeholder..."
                        className={`w-full rounded-xl border bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500 ${
                          homeErrors.heroSearchPlaceholder ? "border-red-500" : "border-slate-700"
                        }`}
                      />
                      {homeErrors.heroSearchPlaceholder && (
                        <p className="text-xs text-red-400">{homeErrors.heroSearchPlaceholder}</p>
                      )}
                    </div>

                    {/* CTA Button Text */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-300">
                        CTA Button Text
                      </label>
                      <input
                        type="text"
                        value={homeSettings.heroTrending?.buttonText || ""}
                        onChange={(e) => {
                          setHomeSettings(prev => ({
                            ...prev,
                            heroTrending: {
                              ...prev.heroTrending,
                              buttonText: e.target.value,
                            },
                          }));
                        }}
                        placeholder="Enter button text..."
                        className={`w-full rounded-xl border bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500 ${
                          homeErrors.heroButtonText ? "border-red-500" : "border-slate-700"
                        }`}
                      />
                      {homeErrors.heroButtonText && (
                        <p className="text-xs text-red-400">{homeErrors.heroButtonText}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Trending Card - Collapsible */}
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => setTrendingCardOpen(prev => !prev)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-900"
                >
                  <span className="text-base font-semibold text-white">Trending Card</span>
                  <FiChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform duration-200 ${trendingCardOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {trendingCardOpen && (
                  <div className="border-t border-slate-800 p-5 space-y-5">
                    {/* Label */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-300">
                        Label
                      </label>
                      <input
                        type="text"
                        value={homeSettings.trendingCard?.label || ""}
                        onChange={(e) => {
                          setHomeSettings(prev => ({
                            ...prev,
                            trendingCard: {
                              ...prev.trendingCard,
                              label: e.target.value,
                            },
                          }));
                        }}
                        placeholder="Enter label..."
                        className={`w-full rounded-xl border bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500 ${
                          homeErrors.trendingLabel ? "border-red-500" : "border-slate-700"
                        }`}
                      />
                      {homeErrors.trendingLabel && (
                        <p className="text-xs text-red-400">{homeErrors.trendingLabel}</p>
                      )}
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-300">
                        Title
                      </label>
                      <input
                        type="text"
                        value={homeSettings.trendingCard?.title || ""}
                        onChange={(e) => {
                          setHomeSettings(prev => ({
                            ...prev,
                            trendingCard: {
                              ...prev.trendingCard,
                              title: e.target.value,
                            },
                          }));
                        }}
                        placeholder="Enter title..."
                        className={`w-full rounded-xl border bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500 ${
                          homeErrors.trendingTitle ? "border-red-500" : "border-slate-700"
                        }`}
                      />
                      {homeErrors.trendingTitle && (
                        <p className="text-xs text-red-400">{homeErrors.trendingTitle}</p>
                      )}
                    </div>

                    {/* Icon */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-300">
                        Icon
                      </label>
                      <input
                        type="text"
                        value={homeSettings.trendingCard?.icon || ""}
                        onChange={(e) => {
                          setHomeSettings(prev => ({
                            ...prev,
                            trendingCard: {
                              ...prev.trendingCard,
                              icon: e.target.value,
                            },
                          }));
                        }}
                        placeholder="Enter icon name (e.g., FiZap)..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500"
                      />
                      <p className="text-xs text-slate-400">
                        Enter a React Icons name (e.g., FiZap, FiStar, FiTool)
                      </p>
                    </div>

                    {/* Tools List */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-slate-300">
                          Tools
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setHomeSettings(prev => ({
                              ...prev,
                              trendingCard: {
                                ...prev.trendingCard,
                                tools: [
                                  ...(prev.trendingCard.tools || []),
                                  { name: "", category: "", rating: 0, description: "" },
                                ],
                              },
                            }));
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-cyan-500"
                        >
                          Add Tool
                        </button>
                      </div>

                      {homeSettings.trendingCard?.tools && homeSettings.trendingCard.tools.length > 0 ? (
                        <div className="space-y-4">
                          {homeSettings.trendingCard.tools.map((tool, index) => (
                            <div
                              key={index}
                              className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-300">
                                  Tool {index + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setHomeSettings(prev => ({
                                      ...prev,
                                      trendingCard: {
                                        ...prev.trendingCard,
                                        tools: prev.trendingCard.tools.filter((_, i) => i !== index),
                                      },
                                    }));
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg bg-red-600/20 px-2.5 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-600/30"
                                >
                                  Remove
                                </button>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2">
                                {/* Name */}
                                <div className="space-y-1.5">
                                  <label className="block text-xs font-medium text-slate-400">
                                    Name
                                  </label>
                                  <input
                                    type="text"
                                    value={tool.name || ""}
                                    onChange={(e) => {
                                      setHomeSettings(prev => ({
                                        ...prev,
                                        trendingCard: {
                                          ...prev.trendingCard,
                                          tools: prev.trendingCard.tools.map((t, i) =>
                                            i === index ? { ...t, name: e.target.value } : t
                                          ),
                                        },
                                      }));
                                    }}
                                    placeholder="Tool name"
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                                  />
                                </div>

                                {/* Category */}
                                <div className="space-y-1.5">
                                  <label className="block text-xs font-medium text-slate-400">
                                    Category
                                  </label>
                                  <input
                                    type="text"
                                    value={tool.category || ""}
                                    onChange={(e) => {
                                      setHomeSettings(prev => ({
                                        ...prev,
                                        trendingCard: {
                                          ...prev.trendingCard,
                                          tools: prev.trendingCard.tools.map((t, i) =>
                                            i === index ? { ...t, category: e.target.value } : t
                                          ),
                                        },
                                      }));
                                    }}
                                    placeholder="Category"
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                                  />
                                </div>
                              </div>

                              {/* Rating */}
                              <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-slate-400">
                                  Rating (0-5)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="5"
                                  step="0.1"
                                  value={tool.rating || 0}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    setHomeSettings(prev => ({
                                      ...prev,
                                      trendingCard: {
                                        ...prev.trendingCard,
                                        tools: prev.trendingCard.tools.map((t, i) =>
                                          i === index ? { ...t, rating: Math.min(5, Math.max(0, value)) } : t
                                        ),
                                      },
                                    }));
                                  }}
                                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                                />
                              </div>

                              {/* Description */}
                              <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-slate-400">
                                  Description
                                </label>
                                <textarea
                                  value={tool.description || ""}
                                  onChange={(e) => {
                                    setHomeSettings(prev => ({
                                      ...prev,
                                      trendingCard: {
                                        ...prev.trendingCard,
                                        tools: prev.trendingCard.tools.map((t, i) =>
                                          i === index ? { ...t, description: e.target.value } : t
                                        ),
                                      },
                                    }));
                                  }}
                                  placeholder="Tool description..."
                                  rows={2}
                                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500 resize-none"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
                          <p className="text-sm text-slate-400">No tools added yet. Click "Add Tool" to add your first tool.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Featured Categories - Collapsible */}
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => setFeaturedCategoriesOpen(prev => !prev)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-900"
                >
                  <span className="text-base font-semibold text-white">Featured Categories</span>
                  <FiChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform duration-200 ${featuredCategoriesOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {featuredCategoriesOpen && (
                  <div className="border-t border-slate-800 p-5">
                  </div>
                )}
              </div>

              {/* Stats Counter - Collapsible */}
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => setStatsCounterOpen(prev => !prev)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-900"
                >
                  <span className="text-base font-semibold text-white">Stats Counter</span>
                  <FiChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform duration-200 ${statsCounterOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {statsCounterOpen && (
                  <div className="border-t border-slate-800 p-5">
                  </div>
                )}
              </div>

              {/* Testimonials - Collapsible */}
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => setTestimonialsOpen(prev => !prev)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-900"
                >
                  <span className="text-base font-semibold text-white">Testimonials</span>
                  <FiChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform duration-200 ${testimonialsOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {testimonialsOpen && (
                  <div className="border-t border-slate-800 p-5">
                  </div>
                )}
              </div>

              {/* FAQ Preview - Collapsible */}
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => setFaqPreviewOpen(prev => !prev)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-900"
                >
                  <span className="text-base font-semibold text-white">FAQ Preview</span>
                  <FiChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform duration-200 ${faqPreviewOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {faqPreviewOpen && (
                  <div className="border-t border-slate-800 p-5">
                  </div>
                )}
              </div>
            </>
          )}
          </div>
          )}
          
          {/* Social Links Tab */}
          {activeTab === "social" && (
            <div className="relative rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-black/10">
              {/* Sticky Action Bar */}
              <div className="sticky top-0 z-10 -mx-6 -mt-6 mb-6 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-6 py-4 backdrop-blur-sm">
                <h2 className="text-xl font-semibold text-white">Social Links</h2>
                <div className="flex items-center gap-3">
                  {socialLinks.length === 0 && !socialLoading && (
                    <button
                      onClick={handleInitializeSocialLinks}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700"
                    >
                      <FiRefreshCw size={16} />
                      Initialize Platforms
                    </button>
                  )}
                  <button
                    onClick={handleCancelSocialLinks}
                    disabled={!hasSocialChanges() || socialSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
                  >
                    <FiX size={16} />
                    Reset
                  </button>
                  <button
                    onClick={handleSaveAllSocialLinks}
                    disabled={!hasSocialChanges() || socialSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {socialSaving ? (
                      <>
                        <FiSave className="animate-spin" size={16} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave size={16} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {socialLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl border border-slate-700 bg-slate-900" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {socialLinks.map((link) => (
                    <div key={link.platform} className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900/50 p-4 transition-all duration-200 hover:bg-slate-900 sm:flex-row sm:items-center">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-200 mb-2 capitalize">
                          {link.platform}
                        </label>
                        <div className="relative">
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => {
                              const newUrl = e.target.value;
                              setSocialLinks(prev => 
                                prev.map(l => l.platform === link.platform ? { ...l, url: newUrl } : l)
                              );
                            }}
                            onBlur={(e) => {
                              if (e.target.value && !validateUrl(e.target.value)) {
                                setSocialErrors(prev => ({ ...prev, [link.platform]: "Please enter a valid URL (e.g., https://...)" }));
                              } else {
                                setSocialErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors[link.platform];
                                  return newErrors;
                                });
                              }
                            }}
                            placeholder={`https://${link.platform}.com/yourprofile`}
                            className={`w-full rounded-xl border bg-slate-950 px-4 py-2.5 text-white outline-none transition-all duration-200 focus:border-cyan-500 ${
                              socialErrors[link.platform] 
                                ? "border-red-500/50 focus:border-red-500" 
                                : "border-slate-700"
                            }`}
                          />
                          {socialErrors[link.platform] && (
                            <div className="absolute inset-y-0 right-3 flex items-center pr-3">
                              <FiAlertCircle className="h-5 w-5 text-red-400" />
                            </div>
                          )}
                        </div>
                        {socialErrors[link.platform] && (
                          <p className="mt-1.5 text-xs text-red-400">{socialErrors[link.platform]}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 sm:pl-4">
                        <ToggleSwitch
                          checked={link.isActive}
                          onChange={(checked) => {
                            setSocialLinks(prev => 
                              prev.map(l => l.platform === link.platform ? { ...l, isActive: checked } : l)
                            );
                          }}
                          aria-label={`Toggle ${link.platform} active status`}
                        />
                        <span className="text-sm font-medium text-slate-300">
                          {link.isActive ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-sm text-slate-500 mt-6">
                Add your social media profile URLs. Leave empty to disable a platform. Click "Save Changes" to persist all modifications.
              </p>
            </div>
          )}

          {/* Contact Settings Tab */}
          {activeTab === "contact" && (
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-black/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Contact Settings</h2>
                {contactSettings.length === 0 && !contactLoading && (
                  <button
                    onClick={handleInitializeContactSettings}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
                  >
                    <FiRefreshCw size={16} />
                    Initialize Settings
                  </button>
                )}
              </div>
              
              {contactLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl border border-slate-700 bg-slate-900" />
                  ))}
                </div>
              ) : contactSettings.length > 0 ? (
                <div className="space-y-4">
                  {contactSettings
                    .filter(setting => !footerSettingKeys.includes(setting.key))
                    .map((setting) => (
                    <div key={setting.key} className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4 sm:flex-row sm:items-center">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          {contactSettingLabels[setting.key] || setting.key}
                        </label>
                        <input
                          type="text"
                          value={setting.value}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setContactSettings(prev =>
                              prev.map(s => s.key === setting.key ? { ...s, value: newValue } : s)
                            );
                          }}
                          onBlur={(e) => handleUpdateContactSetting(setting.key, e.target.value)}
                          placeholder={`Enter ${contactSettingLabels[setting.key] || setting.key}...`}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500"
                        />
                      </div>
                      {contactSaving[setting.key] && (
                        <div className="flex items-center gap-1 text-xs text-cyan-400">
                          <FiSave className="animate-pulse" size={14} />
                          Saving...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center">
                  <p className="text-slate-400 mb-3">No contact settings configured yet.</p>
                  <button
                    onClick={handleInitializeContactSettings}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
                  >
                    <FiRefreshCw size={16} />
                    Initialize Default Settings
                  </button>
                </div>
              )}
              
              <p className="text-sm text-slate-500 mt-4">
                Configure contact page content. Changes are saved automatically when you click outside the input field.
              </p>
            </div>
          )}

          {/* Footer Settings Tab */}
          {activeTab === "footer" && (
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-black/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Footer Settings</h2>
                {footerSettings.length === 0 && !footerLoading && (
                  <button
                    onClick={handleInitializeContactSettings}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
                  >
                    <FiRefreshCw size={16} />
                    Initialize Settings
                  </button>
                )}
              </div>
              
              {footerLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl border border-slate-700 bg-slate-900" />
                  ))}
                </div>
              ) : footerSettings.length > 0 ? (
                <div className="space-y-4">
                  {footerSettings.map((setting) => (
                    <div key={setting.key} className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          {contactSettingLabels[setting.key] || setting.key}
                        </label>
                        {setting.key === "footer_description" || setting.key === "footer_disclaimer" ? (
                          <textarea
                            value={setting.value}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setFooterSettings(prev => 
                                prev.map(s => s.key === setting.key ? { ...s, value: newValue } : s)
                              );
                            }}
                            onBlur={(e) => handleUpdateFooterSetting(setting.key, e.target.value)}
                            placeholder={`Enter ${contactSettingLabels[setting.key] || setting.key}...`}
                            rows={3}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500 resize-none"
                          />
                        ) : (
                          <input
                            type="text"
                            value={setting.value}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setFooterSettings(prev => 
                                prev.map(s => s.key === setting.key ? { ...s, value: newValue } : s)
                              );
                            }}
                            onBlur={(e) => handleUpdateFooterSetting(setting.key, e.target.value)}
                            placeholder={`Enter ${contactSettingLabels[setting.key] || setting.key}...`}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500"
                          />
                        )}
                      </div>
                      {footerSaving[setting.key] && (
                        <div className="flex items-center gap-1 text-xs text-cyan-400">
                          <FiSave className="animate-pulse" size={14} />
                          Saving...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center">
                  <p className="text-slate-400 mb-3">No footer settings configured yet.</p>
                  <button
                    onClick={handleInitializeContactSettings}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
                  >
                    <FiRefreshCw size={16} />
                    Initialize Default Settings
                  </button>
                </div>
              )}
              
              <p className="text-sm text-slate-500 mt-4">
                Configure footer content. Changes are saved automatically when you click outside the input field.
              </p>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-black/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Analytics Settings</h2>
                {analyticsSettings.length === 0 && !analyticsLoading && (
                  <button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem("adminToken");
                        if (!token) {
                          setStatus({ type: "error", message: "Authentication required" });
                          return;
                        }
                        const result = await initializeAnalyticsSettings(token);
                        if (result.success) {
                          setStatus({ type: "success", message: result.message });
                          loadAnalyticsSettings();
                        }
                      } catch (err) {
                        setStatus({ type: "error", message: err.response?.data?.message || "Failed to initialize analytics settings" });
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
                  >
                    <FiRefreshCw size={16} />
                    Initialize Settings
                  </button>
                )}
              </div>
              
              {analyticsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl border border-slate-700 bg-slate-900" />
                  ))}
                </div>
              ) : analyticsSettings.length > 0 ? (
                <div className="space-y-6">
                  {analyticsSettings.map((setting) => (
                    <div key={setting.key} className="space-y-3">
                      <label className="block text-sm font-medium text-slate-300">
                        {analyticsSettingLabels[setting.key] || setting.key}
                      </label>
                      <div className="flex items-start gap-4">
                        <input
                          type="text"
                          value={setting.value}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setAnalyticsSettings(prev => 
                              prev.map(s => s.key === setting.key ? { ...s, value: newValue } : s)
                            );
                          }}
                          onBlur={(e) => handleUpdateAnalyticsSetting(setting.key, e.target.value)}
                          placeholder={`Enter ${analyticsSettingLabels[setting.key] || setting.key}...`}
                          className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500"
                        />
                        {analyticsSaving[setting.key] && (
                          <div className="flex items-center gap-1 text-xs text-cyan-400 pt-2">
                            <FiSave className="animate-pulse" size={14} />
                            Saving...
                          </div>
                        )}
                      </div>
                      {setting.value && (
                        <p className="text-xs text-emerald-400">
                          ✓ Tracking enabled
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center">
                  <p className="text-slate-400 mb-3">No analytics settings configured yet.</p>
                  <button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem("adminToken");
                        if (!token) {
                          setStatus({ type: "error", message: "Authentication required" });
                          return;
                        }
                        const result = await initializeAnalyticsSettings(token);
                        if (result.success) {
                          setStatus({ type: "success", message: result.message });
                          loadAnalyticsSettings();
                        }
                      } catch (err) {
                        setStatus({ type: "error", message: err.response?.data?.message || "Failed to initialize analytics settings" });
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
                  >
                    <FiRefreshCw size={16} />
                    Initialize Default Settings
                  </button>
                </div>
              )}
              
              <p className="text-sm text-slate-500 mt-4">
                Configure analytics tracking. Tracking scripts are only loaded when values are provided. Leave empty to disable tracking.
              </p>
            </div>
          )}

          {/* SMTP Tab */}
          {activeTab === "smtp" && (
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-black/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">SMTP Settings</h2>
                {smtpSettings.length === 0 && !smtpLoading && (
                  <button
                    onClick={handleInitializeSmtpSettings}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
                  >
                    <FiRefreshCw size={16} />
                    Initialize Settings
                  </button>
                )}
              </div>
              
              {smtpLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl border border-slate-700 bg-slate-900" />
                  ))}
                </div>
              ) : smtpSettings.length > 0 ? (
                <div className="space-y-6">
                  {smtpSettings.map((setting) => (
                    <div key={setting.key} className="space-y-3">
                      <label className="block text-sm font-medium text-slate-300">
                        {smtpSettingLabels[setting.key] || setting.key}
                      </label>
                      
                      {setting.key === "smtp_password" ? (
                        <div className="relative">
                          {/* Password field is intentionally blank for security.
                              The actual password is never exposed in the UI.
                              Use hasPassword flag to determine if password exists. */}
                          <input
                            type="password"
                            value={setting.value}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setSmtpSettings(prev =>
                                prev.map(s => s.key === setting.key ? { ...s, value: newValue } : s)
                              );
                            }}
                            onBlur={(e) => {
                              // Only update if user entered a new password
                              // If field is empty, don't send anything (keep existing password)
                              if (e.target.value.trim() !== "") {
                                handleUpdateSmtpSetting(setting.key, e.target.value);
                              }
                            }}
                            placeholder={setting.hasPassword ? "Leave blank to keep existing password" : "Enter SMTP password..."}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500"
                          />
                          <p className="text-xs text-slate-400 mt-1">
                            {setting.hasPassword
                              ? "Password is already configured. Leave this field blank to keep the existing password."
                              : "No SMTP password configured."
                            }
                          </p>
                          {smtpSaving[setting.key] && (
                            <div className="flex items-center gap-1 text-xs text-cyan-400 pt-2">
                              <FiSave className="animate-pulse" size={14} />
                              Saving...
                            </div>
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={setting.value}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setSmtpSettings(prev => 
                              prev.map(s => s.key === setting.key ? { ...s, value: newValue } : s)
                            );
                          }}
                          onBlur={(e) => handleUpdateSmtpSetting(setting.key, e.target.value)}
                          placeholder={`Enter ${smtpSettingLabels[setting.key] || setting.key}...`}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500"
                        />
                      )}
                    </div>
                  ))}
                  
                  {/* Test Email Section */}
                  <div className="mt-6 pt-6 border-t border-slate-800">
                    <h3 className="text-lg font-medium text-white mb-3">Test Email Configuration</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Send a test email to verify your SMTP settings are working correctly.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Test Email Address
                        </label>
                        <input
                          type="email"
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                          placeholder="Enter email address to test..."
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500"
                        />
                      </div>
                      <button
                        onClick={handleTestEmail}
                        disabled={testEmailSending || !testEmail.trim()}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {testEmailSending ? (
                          <>
                            <FiSave className="animate-spin" size={16} />
                            Sending...
                          </>
                        ) : (
                          <>
                            <FiSend size={16} />
                            Send Test Email
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center">
                  <p className="text-slate-400 mb-3">No SMTP settings configured yet.</p>
                  <button
                    onClick={handleInitializeSmtpSettings}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
                  >
                    <FiRefreshCw size={16} />
                    Initialize Default Settings
                  </button>
                </div>
              )}
              
              <p className="text-sm text-slate-500 mt-4">
                Configure SMTP settings for sending emails. Password is securely stored and never displayed in plain text.
              </p>
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === "maintenance" && (
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-black/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Maintenance Mode</h2>
                <button
                  onClick={handleToggleMaintenance}
                  disabled={maintenanceSaving}
                  className={`
                    inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition
                    ${maintenanceSettings.isEnabled
                      ? "bg-red-600 text-white hover:bg-red-500"
                      : "bg-emerald-600 text-white hover:bg-emerald-500"
                    }
                    disabled:opacity-50
                  `}
                >
                  {maintenanceSaving ? "Updating..." : maintenanceSettings.isEnabled ? "Disable Maintenance" : "Enable Maintenance"}
                </button>
              </div>
              
              {maintenanceLoading ? (
                <div className="space-y-4">
                  <div className="h-16 animate-pulse rounded-xl border border-slate-700 bg-slate-900" />
                  <div className="h-24 animate-pulse rounded-xl border border-slate-700 bg-slate-900" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-300">Status:</span>
                    <span className={`
                      inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold
                      ${maintenanceSettings.isEnabled
                        ? "bg-red-500/20 text-red-300"
                        : "bg-emerald-500/20 text-emerald-300"
                      }
                    `}>
                      <span className={`h-2 w-2 rounded-full ${maintenanceSettings.isEnabled ? "bg-red-400" : "bg-emerald-400"}`} />
                      {maintenanceSettings.isEnabled ? "Maintenance Active" : "Maintenance Disabled"}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-300">
                      Maintenance Message
                    </label>
                    <textarea
                      value={maintenanceSettings.message}
                      onChange={(e) => setMaintenanceSettings(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Enter maintenance message..."
                      rows={3}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-300">
                      Estimated Time (optional)
                    </label>
                    <input
                      type="text"
                      value={maintenanceSettings.estimatedTime}
                      onChange={(e) => setMaintenanceSettings(prev => ({ ...prev, estimatedTime: e.target.value }))}
                      placeholder="e.g., 2 hours, 1 day, etc."
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                  
                  <button
                    onClick={handleUpdateMaintenance}
                    disabled={maintenanceSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50"
                  >
                    <FiSave size={16} />
                    Save Settings
                  </button>
                </div>
              )}
              
              <p className="text-sm text-slate-500 mt-4">
                When enabled, visitors will see a maintenance page. Admin login remains accessible.
              </p>
            </div>
          )}

          {/* Backup Tab */}
          {activeTab === "backup" && (
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-black/10">
              <h2 className="text-xl font-semibold text-white mb-4">Backup / Export Data</h2>
              <p className="text-sm text-slate-400 mb-6">
                Export your website data as JSON. These exports can be used to create backups or migrate data.
              </p>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Export Settings */}
                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="rounded-xl bg-cyan-600/20 p-2.5">
                      <FiSettings className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Website Settings</h3>
                      <p className="text-xs text-slate-400">Branding, SEO, Analytics, SMTP, Social, Contact</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const res = await exportSettingsData();
                        if (res.data.success) {
                          const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: "application/json" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `website-settings-${new Date().toISOString().split("T")[0]}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          addToast("Settings exported successfully", "success");
                        }
                      } catch (err) {
                        addToast(err.response?.data?.message || "Failed to export settings", "error");
                      }
                    }}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500"
                  >
                    <FiDownload size={16} />
                    Export Settings
                  </button>
                </div>

                {/* Export Tools */}
                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="rounded-xl bg-emerald-600/20 p-2.5">
                      <FiTool className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Tools</h3>
                      <p className="text-xs text-slate-400">All AI tools in the directory</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const res = await exportToolsData();
                        if (res.data.success) {
                          const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: "application/json" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `tools-${new Date().toISOString().split("T")[0]}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          addToast(`${res.data.count} tools exported successfully`, "success");
                        }
                      } catch (err) {
                        addToast(err.response?.data?.message || "Failed to export tools", "error");
                      }
                    }}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
                  >
                    <FiDownload size={16} />
                    Export Tools
                  </button>
                </div>

                {/* Export Categories */}
                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="rounded-xl bg-purple-600/20 p-2.5">
                      <FiGrid className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Categories</h3>
                      <p className="text-xs text-slate-400">All categories with icons and descriptions</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const res = await exportCategoriesData();
                        if (res.data.success) {
                          const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: "application/json" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `categories-${new Date().toISOString().split("T")[0]}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          addToast(`${res.data.count} categories exported successfully`, "success");
                        }
                      } catch (err) {
                        addToast(err.response?.data?.message || "Failed to export categories", "error");
                      }
                    }}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-500"
                  >
                    <FiDownload size={16} />
                    Export Categories
                  </button>
                </div>

                {/* Export Users */}
                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="rounded-xl bg-amber-600/20 p-2.5">
                      <FiUsers className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Users</h3>
                      <p className="text-xs text-slate-400">All registered users (passwords excluded)</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const res = await exportUsersData();
                        if (res.data.success) {
                          const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: "application/json" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `users-${new Date().toISOString().split("T")[0]}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          addToast(`${res.data.count} users exported successfully`, "success");
                        }
                      } catch (err) {
                        addToast(err.response?.data?.message || "Failed to export users", "error");
                      }
                    }}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-500"
                  >
                    <FiDownload size={16} />
                    Export Users
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-slate-500 mt-6">
                Each export downloads a JSON file containing the selected data. These files can be used for backup purposes or data migration.
              </p>
            </div>
          )}
        </div>
      
      {/* Users Section - Always visible at bottom */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-black/10">
          <h2 className="text-xl font-semibold text-white mb-4">Manage Users</h2>
          <div className="space-y-2">
            {users.length === 0 && !loading ? (
              <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center">
                <p className="text-slate-500">No users found.</p>
              </div>
            ) : (
              users.map((user) => (
                <div 
                  key={user._id} 
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-white">{user.name}</p>
                    <p className="text-sm text-slate-400">{user.email}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteUser(user._id)} 
                    className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
                  >
                    Remove User
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
      
      {/* Toast Container for notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </AdminLayout>
  );
}
