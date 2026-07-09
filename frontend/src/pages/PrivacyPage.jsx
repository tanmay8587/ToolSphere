import { Link } from "react-router-dom";
import { FiShield } from "react-icons/fi";
import { Helmet } from "react-helmet-async";

export default function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - ToolSphere</title>
        <meta
          name="description"
          content="ToolSphere Privacy Policy. Learn how we collect, use, and protect your personal information when you use our AI tools directory."
        />
        <link rel="canonical" href="https://toolsphere.ai/privacy" />
        <meta property="og:title" content="Privacy Policy - ToolSphere" />
        <meta
          property="og:description"
          content="Learn how ToolSphere protects your privacy."
        />
        <meta property="og:url" content="https://toolsphere.ai/privacy" />
        <meta name="twitter:title" content="Privacy Policy - ToolSphere" />
        <meta
          name="twitter:description"
          content="Learn how ToolSphere protects your privacy."
        />
      </Helmet>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-slate-400">
          <Link to="/" className="hover:text-cyan-300 transition">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-200">Privacy Policy</span>
        </nav>

        {/* Hero */}
        <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 p-8 shadow-2xl shadow-cyan-950/30 lg:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
              <FiShield className="h-4 w-4" />
              Privacy Policy
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">
              Privacy Policy
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-slate-300">
              Last updated: July 6, 2026
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="mt-8 space-y-8 rounded-2xl border border-white/10 bg-slate-900/70 p-8 lg:p-12">
          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">1. Introduction</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              ToolSphere ("we," "our," or "us") is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard
              your information when you visit our website and use our services.
            </p>
            <p className="mt-3 text-slate-400 leading-relaxed">
              By using ToolSphere, you agree to the collection and use of information
              in accordance with this policy. If you do not agree, please do not use our service.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">2. Information We Collect</h2>
            <h3 className="mt-4 text-lg font-semibold text-slate-200">Personal Information</h3>
            <p className="mt-2 text-slate-400 leading-relaxed">
              We may collect personal information that you voluntarily provide when you:
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-2 text-slate-400">
              <li>Subscribe to our newsletter (email address)</li>
              <li>Contact us through our contact form (name, email, subject, message)</li>
              <li>Submit a tool for listing (name, email, tool details)</li>
              <li>Create an account (email, password, profile information)</li>
            </ul>

            <h3 className="mt-6 text-lg font-semibold text-slate-200">Automatically Collected Information</h3>
            <p className="mt-2 text-slate-400 leading-relaxed">
              When you visit ToolSphere, we may automatically collect:
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-2 text-slate-400">
              <li>Device information (browser type, operating system)</li>
              <li>Usage data (pages visited, time spent, clicks)</li>
              <li>IP address and location data (approximate)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">3. How We Use Your Information</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              We use the collected information for the following purposes:
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-2 text-slate-400">
              <li>To provide and maintain our service</li>
              <li>To notify you about changes to our service</li>
              <li>To allow you to participate in interactive features</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information to improve our service</li>
              <li>To monitor the usage of our service</li>
              <li>To detect, prevent, and address technical issues</li>
              <li>To send you newsletters and marketing communications (with consent)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">4. Cookies</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our
              service and hold certain information. Cookies are files with a small amount
              of data that may include an anonymous unique identifier.
            </p>
            <p className="mt-3 text-slate-400 leading-relaxed">
              You can instruct your browser to refuse all cookies or to indicate when a
              cookie is being sent. However, if you do not accept cookies, you may not be
              able to use some portions of our service. See our{" "}
              <Link to="/cookies" className="text-cyan-300 hover:underline">
                Cookie Policy
              </Link>{" "}
              for more details.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">5. Data Sharing and Disclosure</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              We do not sell, trade, or rent your personal information to third parties.
              We may share your information in the following circumstances:
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-2 text-slate-400">
              <li>With service providers who assist us in operating our website</li>
              <li>To comply with legal obligations</li>
              <li>To protect and defend our rights and property</li>
              <li>With your consent or at your direction</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">6. Data Security</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              We implement appropriate technical and organizational security measures to
              protect your personal information. However, no method of transmission over
              the Internet or electronic storage is 100% secure. We cannot guarantee
              absolute security.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">7. Your Rights</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              Depending on your location, you may have the following rights regarding
              your personal information:
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-2 text-slate-400">
              <li>Right to access your personal data</li>
              <li>Right to rectify inaccurate data</li>
              <li>Right to delete your data ("Right to be Forgotten")</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
              <li>Right to withdraw consent</li>
            </ul>
            <p className="mt-3 text-slate-400 leading-relaxed">
              To exercise any of these rights, please contact us at hello@toolsphere.ai.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">8. Third-Party Links</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              Our service may contain links to third-party websites or services that are
              not owned or controlled by us. We have no control over and assume no
              responsibility for the content, privacy policies, or practices of any
              third-party websites or services.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">9. Children's Privacy</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              Our service is not intended for individuals under the age of 13. We do not
              knowingly collect personal information from children. If you are a parent or
              guardian and discover that your child has provided us with personal data,
              please contact us so we can take appropriate action.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">10. Changes to This Policy</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of
              any changes by posting the new policy on this page and updating the "Last
              updated" date. You are advised to review this policy periodically for any
              changes.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">11. Contact Us</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <p className="mt-3 text-slate-400">
              Email:{" "}
              <a href="mailto:hello@toolsphere.ai" className="text-cyan-300 hover:underline">
                hello@toolsphere.ai
              </a>
            </p>
            <p className="mt-1 text-slate-400">
              Or visit our{" "}
              <Link to="/contact" className="text-cyan-300 hover:underline">
                Contact Page
              </Link>
            </p>
          </div>
        </section>
      </div>
    </>
  );
}