import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiMenu, FiSearch, FiX, FiUser, FiUserPlus } from 'react-icons/fi';
import { Mail, MapPin, Clock, Zap, ArrowRight } from 'lucide-react';
import { SiX, SiGithub, SiInstagram, SiYoutube, SiDiscord, SiTelegram, SiFacebook } from 'react-icons/si';
import { FaLinkedin } from 'react-icons/fa6';
import SearchModal from '../components/common/SearchModal';
import UserMenu from '../components/common/UserMenu';
import { ToastContainer, useToast } from '../components/common/Toast';
import { isLoggedIn, getUser, logout as logoutUser } from '../utils/auth';
import { getContactSettings } from '../services/contactSettingService';
import { getSocialLinks } from '../services/socialService';
import { getBrandingSettings } from '../services/websiteBrandingService';
import { getAnalyticsSettings } from '../services/analyticsService';
import { getMaintenanceStatus } from '../services/maintenanceService';

const navItems = [
  { name: 'Home', path: '/' },
  { name: 'Categories', path: '/categories' },
  { name: 'Tools', path: '/tools' },
  { name: 'Blog', path: '/blog' },
  { name: 'About', path: '/about' },
  { name: 'FAQ', path: '/faq' },
  { name: 'Contact', path: '/contact' }
];

const footerLinks = [
  { name: 'About', path: '/about' },
  { name: 'Blog', path: '/blog' },
  { name: 'FAQ', path: '/faq' },
  { name: 'Contact', path: '/contact' },
  { name: 'Privacy Policy', path: '/privacy' },
  { name: 'Terms', path: '/terms' },
  { name: 'Cookie Policy', path: '/cookies' },
  { name: 'Disclaimer', path: '/disclaimer' },
];

// Official brand social icons (Simple Icons)
const SocialIcon = ({ platform, className }) => {
  const icons = {
    x: SiX,
    linkedin: FaLinkedin,
    github: SiGithub,
    instagram: SiInstagram,
    youtube: SiYoutube,
    discord: SiDiscord,
    telegram: SiTelegram,
    facebook: SiFacebook,
  };

  const Icon = icons[platform];
  return Icon ? <Icon className={className} /> : null;
};

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { toasts, removeToast } = useToast();
  const navigate = useNavigate();
  
  // Track if settings have been loaded to prevent duplicate requests
  const settingsLoadedRef = useRef(false);
  
  // Branding settings state
  const [brandingSettings, setBrandingSettings] = useState({
    logo: "",
    favicon: "",
    site_name: "ToolSphere",
    browser_title: "AI Tools Directory",
  });
  
  // Footer settings state
  const [footerSettings, setFooterSettings] = useState({
    footer_copyright: "ToolSphere",
    footer_description: "Discover & explore the best AI tools in one place. Curated directory of top AI platforms for every workflow.",
    footer_email: "hello@toolsphere.ai",
    footer_disclaimer: "All tools are provided by their respective owners. We are not affiliated with any tool unless explicitly stated.",
    office_location: "San Francisco, CA",
    working_days: "Monday - Friday",
    working_hours: "9:00 AM - 6:00 PM",
  });
  
  // Social links state
  const [socialLinks, setSocialLinks] = useState([]);
  
  // Analytics settings state
  const [analyticsSettings, setAnalyticsSettings] = useState({
    google_analytics_id: "",
    google_search_console_code: "",
    meta_pixel_id: "",
  });
  
  // Error state for graceful error handling
  const [settingsError, setSettingsError] = useState(null);

  // Auth state - reuses existing utils/auth (no new auth system)
  const [authUser, setAuthUser] = useState(() => (isLoggedIn() ? getUser() : null));

  // Keep navbar in sync with login/logout across tabs/components
  useEffect(() => {
    const syncAuth = () => {
      setAuthUser(isLoggedIn() ? getUser() : null);
    };
    window.addEventListener("auth-change", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("auth-change", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  // Show a toast if the user was redirected here due to account deletion
  useEffect(() => {
    const toastMessage = sessionStorage.getItem("authToast");
    if (toastMessage) {
      sessionStorage.removeItem("authToast");
      addToast(toastMessage, "error", 5000);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    if (searchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [searchOpen]);

  // Load all settings on mount - consolidated into single useEffect
  useEffect(() => {
    // Prevent duplicate requests on re-renders
    if (settingsLoadedRef.current) return;
    settingsLoadedRef.current = true;
    
    const loadAllSettings = async () => {
      try {
        // Load all settings in parallel
        const [brandingResult, contactResult, socialResult, analyticsResult] = await Promise.all([
          getBrandingSettings().catch(err => ({ success: false, error: err })),
          getContactSettings().catch(err => ({ success: false, error: err })),
          getSocialLinks().catch(err => ({ success: false, error: err })),
          getAnalyticsSettings().catch(err => ({ success: false, error: err })),
        ]);
        
        // Process branding settings
        if (brandingResult.success && brandingResult.settings) {
          setBrandingSettings(prev => ({
            ...prev,
            ...brandingResult.settings,
          }));
        }
        
        // Process contact settings (includes footer settings)
        if (contactResult.success && contactResult.settings) {
          // Extract footer settings from contact settings
          const footerSettingsData = {
            footer_copyright: contactResult.settings.footer_copyright || "ToolSphere",
            footer_description: contactResult.settings.footer_description || "Discover & explore the best AI tools in one place.",
            footer_email: contactResult.settings.footer_email || "hello@toolsphere.ai",
            footer_disclaimer: contactResult.settings.footer_disclaimer || "",
            office_location: contactResult.settings.office_location || "San Francisco, CA",
            working_days: contactResult.settings.working_days || "Monday - Friday",
            working_hours: contactResult.settings.working_hours || "9:00 AM - 6:00 PM",
          };
          setFooterSettings(prev => ({
            ...prev,
            ...footerSettingsData,
          }));
        }
        
        // Process social links
        if (socialResult.success && socialResult.socialLinks) {
          setSocialLinks(socialResult.socialLinks.filter(link => link.isActive && link.url && link.url.trim() !== ""));
        }
        
        // Process analytics settings
        if (analyticsResult.success && analyticsResult.settings) {
          setAnalyticsSettings(prev => ({
            ...prev,
            ...analyticsResult.settings,
          }));
        }
        
        // Log single error if any request failed
        const errors = [
          brandingResult.error && "Failed to load branding settings",
          contactResult.error && "Failed to load contact settings",
          socialResult.error && "Failed to load social links",
          analyticsResult.error && "Failed to load analytics settings",
        ].filter(Boolean);
        
        if (errors.length > 0) {
          setSettingsError(errors[0]); // Log only the first error
        }
        
      } catch (err) {
        // Single error log for any unexpected errors
        setSettingsError("Failed to load some settings");
      }
    };
    
    loadAllSettings();
  }, []);

  // Check maintenance mode and redirect if enabled
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const result = await getMaintenanceStatus();
        if (result.success && result.isEnabled) {
          // Only redirect if not already on admin pages
          if (!window.location.pathname.startsWith('/admin') && 
              window.location.pathname !== '/admin/login') {
            navigate('/maintenance', { replace: true });
          }
        }
      } catch (err) {
        // Silent fail - maintenance check is not critical
      }
    };
    checkMaintenance();
  }, [navigate]);

  // Set document title and favicon when branding settings change
  useEffect(() => {
    if (brandingSettings.browser_title) {
      document.title = brandingSettings.browser_title;
    }
    
    if (brandingSettings.favicon) {
      // Update favicon
      const existingFavicon = document.querySelector('link[rel="icon"]');
      if (existingFavicon) {
        existingFavicon.remove();
      }
      const faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      faviconLink.type = 'image/x-icon';
      faviconLink.href = brandingSettings.favicon;
      document.head.appendChild(faviconLink);
    }
  }, [brandingSettings]);

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": brandingSettings.site_name || "ToolSphere",
    "url": "https://toolsphere.ai",
    "logo": brandingSettings.logo || "https://toolsphere.ai/logo.png",
    "description": footerSettings.footer_description || "Discover & explore the best AI tools in one place. Curated directory of top AI platforms for every workflow.",
    "email": footerSettings.footer_email || "hello@toolsphere.ai",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": footerSettings.office_location || "San Francisco, CA"
    },
    "sameAs": socialLinks.map(link => link.url),
    "contactPoint": {
      "@type": "ContactPoint",
      "email": footerSettings.footer_email || "hello@toolsphere.ai",
      "contactType": "customer service"
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* SKIP TO CONTENT */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-cyan-500 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/60 backdrop-blur-2xl supports-[backdrop-filter]:bg-slate-950/40">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 text-lg font-semibold tracking-wide">
            {brandingSettings.logo ? (
              <img 
                src={brandingSettings.logo} 
                alt={brandingSettings.site_name || "Logo"} 
                className="h-10 w-auto rounded-xl object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-fuchsia-500 text-lg font-bold shadow-lg shadow-cyan-500/20">
                AI
              </div>
            )}
            <span>{brandingSettings.site_name || "ToolSphere"}</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative text-sm font-medium transition duration-200 ${isActive
                    ? "text-cyan-300 after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-full after:bg-cyan-400"
                    : "text-slate-300 hover:text-white hover:translate-y-[-1px]"
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">

            {/* Auth UI - Desktop & Mobile */}
            {authUser ? (
              <UserMenu user={authUser} />
            ) : (
              <>
                {/* Text labels - desktop & tablet */}
                <div className="hidden items-center gap-2 md:flex">
                  <Link
                    to="/login"
                    className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600"
                  >
                    Register
                  </Link>
                </div>

                {/* Icon-only - mobile */}
                <div className="flex items-center gap-2 md:hidden">
                  <Link
                    to="/login"
                    aria-label="Login"
                    className="flex items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/10 p-3 text-cyan-300 transition hover:bg-cyan-500/20"
                  >
                    <FiUser className="h-5 w-5" />
                  </Link>
                  <Link
                    to="/register"
                    aria-label="Register"
                    className="flex items-center justify-center rounded-full bg-cyan-500 p-3 text-white transition hover:bg-cyan-600"
                  >
                    <FiUserPlus className="h-5 w-5" />
                  </Link>
                </div>
              </>
            )}

            {/* Search Icon - Desktop & Mobile */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/10 p-3 text-cyan-300 transition hover:bg-cyan-500/20"
              aria-label="Search tools"
            >
              <FiSearch className="h-5 w-5" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-300 md:hidden"
            >
              {menuOpen ? (
                <FiX className="h-5 w-5" />
              ) : (
                <FiMenu className="h-5 w-5" />
              )}
            </button>

          </div>

        </div>
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950 md:hidden">

          <div className="flex items-center justify-between border-b border-white/10 p-5">

              <h2 className="text-xl font-bold text-white">
                {brandingSettings.site_name || "ToolSphere"}
              </h2>

            <button onClick={() => setMenuOpen(false)}>
              <FiX className="h-7 w-7 text-white" />
            </button>

          </div>

          <div className="flex flex-col gap-2 p-6">

            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-4 text-lg transition ${isActive
                    ? "bg-cyan-500/10 text-cyan-300"
                    : "text-white hover:bg-white/5"
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}

            {/* Auth UI - Mobile Menu */}
            <div className="mt-4 border-t border-white/10 pt-4">
              {authUser ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-xl bg-white/5 px-4 py-4 text-lg text-white transition hover:bg-white/10"
                  >
                    My Profile
                  </Link>
                  <button
                    onClick={() => {
                      logoutUser();
                      setMenuOpen(false);
                      window.dispatchEvent(new Event("auth-change"));
                    }}
                    className="mt-2 block w-full rounded-xl bg-red-500/10 px-4 py-4 text-left text-lg text-red-400 transition hover:bg-red-500/20"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-4 text-center text-lg font-medium text-cyan-300 transition hover:bg-cyan-500/20"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-xl bg-cyan-500 px-4 py-4 text-center text-lg font-semibold text-white transition hover:bg-cyan-600"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(organizationJsonLd)}
        </script>
      </Helmet>

      {/* Analytics Scripts - Only loaded when values are provided */}
      {analyticsSettings.google_analytics_id && (
        <>
          {/* Google Analytics 4 */}
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${analyticsSettings.google_analytics_id}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${analyticsSettings.google_analytics_id}');
              `,
            }}
          />
        </>
      )}

      {analyticsSettings.meta_pixel_id && (
        <>
          {/* Meta Pixel */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${analyticsSettings.meta_pixel_id}');
                fbq('track', 'PageView');
              `,
            }}
          />
          <noscript
            dangerouslySetInnerHTML={{
              __html: `<img height="1" width="1" style="display:none"
                src="https://www.facebook.com/tr?id=${analyticsSettings.meta_pixel_id}&ev=PageView&noscript=1" />`,
            }}
          />
        </>
      )}

      {analyticsSettings.google_search_console_code && (
        <>
          {/* Google Search Console Verification */}
          <meta
            name="google-site-verification"
            content={analyticsSettings.google_search_console_code}
          />
        </>
      )}

      <main id="main-content" tabIndex="-1">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* MAIN FOOTER CONTENT */}
          <div className="py-16">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-white/[0.06]">

              {/* COLUMN 1 - Brand */}
              <div className="flex flex-col items-start text-left lg:pr-10">
                <div className="flex items-center gap-3">
                  {brandingSettings.logo ? (
                    <img
                      src={brandingSettings.logo}
                      alt={brandingSettings.site_name || "Logo"}
                      className="h-14 w-auto rounded-2xl object-contain"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-fuchsia-500 text-xl font-bold shadow-lg shadow-cyan-500/20">
                      AI
                    </div>
                  )}
                  <span className="text-2xl font-bold text-white">
                    {brandingSettings.site_name || "ToolSphere"}
                  </span>
                </div>
                <p className="mt-5 text-sm leading-7 text-slate-400">
                  {footerSettings.footer_description}
                </p>
                {/* Social Icons */}
                {socialLinks.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    {socialLinks.map((link) => (
                      <a
                        key={link.platform}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-slate-500 transition-all duration-300 hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-400 hover:shadow-[0_0_12px_rgba(34,211,238,0.45)]"
                        aria-label={link.platform}
                      >
                        <SocialIcon platform={link.platform} className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* COLUMN 2 - Discover */}
              <div className="flex flex-col items-start text-left sm:pl-2 lg:pl-10">
                <h3 className="text-base font-semibold uppercase tracking-[0.15em] text-cyan-400">
                  Discover
                </h3>
                <ul className="mt-5 flex w-full flex-col items-stretch gap-1">
                  {[
                    { name: "Home", path: "/" },
                    { name: "Categories", path: "/categories" },
                    { name: "Tools", path: "/tools" },
                    { name: "Blog", path: "/blog" },
                    { name: "About", path: "/about" },
                  ].map((link) => (
                    <li key={link.path}>
                      <Link
                        to={link.path}
                        className="inline-block rounded-lg px-2 py-2 text-sm font-medium text-slate-400 transition-all duration-300 hover:text-white"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* COLUMN 3 - Legal */}
              <div className="flex flex-col items-start text-left sm:pl-2 lg:pl-10">
                <h3 className="text-base font-semibold uppercase tracking-[0.15em] text-cyan-400">
                  Legal
                </h3>
                <ul className="mt-5 flex w-full flex-col items-stretch gap-1">
                  {[
                    { name: "FAQ", path: "/faq" },
                    { name: "Privacy Policy", path: "/privacy" },
                    { name: "Terms", path: "/terms" },
                    { name: "Cookie Policy", path: "/cookies" },
                    { name: "Disclaimer", path: "/disclaimer" },
                  ].map((link) => (
                    <li key={link.path}>
                      <Link
                        to={link.path}
                        className="inline-block rounded-lg px-2 py-2 text-sm font-medium text-slate-400 transition-all duration-300 hover:text-white"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* COLUMN 4 - Contact */}
              <div className="flex flex-col items-start text-left sm:pl-2 lg:pl-10">
                <h3 className="text-base font-semibold uppercase tracking-[0.15em] text-cyan-400">
                  Contact
                </h3>
                <ul className="mt-5 flex flex-col items-start space-y-3">
                  {footerSettings.footer_email && (
                    <li className="flex items-center gap-2.5">
                      <Mail className="h-[18px] w-[18px] shrink-0 text-cyan-400" />
                      <a
                        href={`mailto:${footerSettings.footer_email}`}
                        className="text-sm text-slate-400 transition-colors duration-200 hover:text-white"
                      >
                        {footerSettings.footer_email}
                      </a>
                    </li>
                  )}
                  {footerSettings.office_location && (
                    <li className="flex items-center gap-2.5">
                      <MapPin className="h-[18px] w-[18px] shrink-0 text-cyan-400" />
                      <span className="text-sm text-slate-400">
                        {footerSettings.office_location}
                      </span>
                    </li>
                  )}
                  {footerSettings.working_hours && (
                    <li className="flex items-center gap-2.5">
                      <Clock className="h-[18px] w-[18px] shrink-0 text-cyan-400" />
                      <span className="text-sm text-slate-400">
                        {footerSettings.working_hours}
                      </span>
                    </li>
                  )}
                  <li className="pt-2">
                    <Link
                      to="/contact"
                      className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 transition-all duration-200 hover:bg-cyan-500/20 hover:border-cyan-500/30"
                    >
                      Send a message
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </li>
                </ul>
              </div>

            </div>
          </div>

          {/* BOTTOM BAR */}
          <div className="border-t border-white/[0.06] py-8">
            <div className="flex flex-col items-start gap-3 text-left">
              <p className="text-xs text-slate-500">
                &copy; {new Date().getFullYear()} {footerSettings.footer_copyright}. All rights reserved.
              </p>
              {footerSettings.footer_disclaimer && (
                <p className="max-w-3xl text-xs leading-relaxed text-slate-600">
                  {footerSettings.footer_disclaimer}
                </p>
              )}
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}