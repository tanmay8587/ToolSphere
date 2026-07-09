import { Link } from "react-router-dom";
import { FiSliders } from "react-icons/fi";
import { Helmet } from "react-helmet-async";

export default function CookiePage() {
  return (
    <>
      <Helmet>
        <title>Cookie Policy - ToolSphere</title>
        <meta
          name="description"
          content="ToolSphere Cookie Policy. Learn about how we use cookies and similar tracking technologies on our AI tools directory website."
        />
        <link rel="canonical" href="https://toolsphere.ai/cookies" />
        <meta property="og:title" content="Cookie Policy - ToolSphere" />
        <meta
          property="og:description"
          content="Learn about how ToolSphere uses cookies."
        />
        <meta property="og:url" content="https://toolsphere.ai/cookies" />
        <meta name="twitter:title" content="Cookie Policy - ToolSphere" />
        <meta
          name="twitter:description"
          content="Learn about how ToolSphere uses cookies."
        />
      </Helmet>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <nav className="mb-8 text-sm text-slate-400">
          <Link to="/" className="hover:text-cyan-300 transition">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-200">Cookie Policy</span>
        </nav>

        <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 p-8 shadow-2xl shadow-cyan-950/30 lg:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
              <FiSliders className="h-4 w-4" />
              Cookie Policy
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">Cookie Policy</h1>
            <p className="mx-auto mt-4 max-w-2xl text-slate-300">Last updated: July 6, 2026</p>
          </div>
        </section>

        <section className="mt-8 space-y-8 rounded-2xl border border-white/10 bg-slate-900/70 p-8 lg:p-12">
          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">1. What Are Cookies</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              Cookies are small text files that are stored on your device (computer, tablet, or
              mobile) when you visit a website. They are widely used to make websites work more
              efficiently and provide information to the website owners. Cookies allow us to
              recognize your browser and remember certain information about your visit.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">2. How We Use Cookies</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              ToolSphere uses cookies for the following purposes:
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-2 text-slate-400">
              <li><strong className="text-slate-200">Essential Cookies:</strong> Required for the basic functionality of our website, such as maintaining your session and security.</li>
              <li><strong className="text-slate-200">Preference Cookies:</strong> Remember your settings and preferences to enhance your experience.</li>
              <li><strong className="text-slate-200">Analytics Cookies:</strong> Help us understand how visitors interact with our website by collecting anonymous information about page visits, time spent, and navigation patterns.</li>
              <li><strong className="text-slate-200">Functional Cookies:</strong> Enable enhanced functionality such as remembering your search preferences and tool views.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">3. Types of Cookies We Use</h2>

            <h3 className="mt-4 text-lg font-semibold text-slate-200">Session Cookies</h3>
            <p className="mt-2 text-slate-400 leading-relaxed">
              These are temporary cookies that expire when you close your browser. They are
              essential for the proper functioning of our website and enable features like
              navigation and form submissions.
            </p>

            <h3 className="mt-6 text-lg font-semibold text-slate-200">Persistent Cookies</h3>
            <p className="mt-2 text-slate-400 leading-relaxed">
              These cookies remain on your device for a set period or until you delete them.
              They help us remember your preferences and provide a personalized experience
              when you return to our site.
            </p>

            <h3 className="mt-6 text-lg font-semibold text-slate-200">Third-Party Cookies</h3>
            <p className="mt-2 text-slate-400 leading-relaxed">
              We may use third-party services such as analytics providers that set their own
              cookies on our website. These cookies are governed by the respective third-party
              privacy policies.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">4. Analytics</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              We use analytics tools to collect anonymous information about how visitors use
              our website. This helps us improve our service and understand which tools and
              features are most popular. The information collected includes:
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-2 text-slate-400">
              <li>Pages visited and time spent on each page</li>
              <li>Referring website or search terms</li>
              <li>Browser type and device information</li>
              <li>Geographic location (country-level only)</li>
              <li>Interaction patterns (clicks, scrolls, searches)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">5. Managing Cookies</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              You can control and manage cookies in several ways:
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-2 text-slate-400">
              <li>
                <strong className="text-slate-200">Browser Settings:</strong> Most browsers allow you
                to view, block, or delete cookies. Check your browser's help section for instructions.
              </li>
              <li>
                <strong className="text-slate-200">Opt-Out Tools:</strong> You can use third-party
                opt-out tools to manage analytics cookies.
              </li>
              <li>
                <strong className="text-slate-200">Do Not Track:</strong> Some browsers support
                "Do Not Track" signals. We respect these signals where possible.
              </li>
            </ul>
            <p className="mt-3 text-slate-400 leading-relaxed">
              Please note that blocking or deleting cookies may affect the functionality of our
              website and may prevent you from using certain features.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">6. Updates to This Policy</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              We may update our Cookie Policy from time to time to reflect changes in technology,
              regulation, or our practices. We encourage you to review this policy periodically.
              The "Last updated" date at the top of this page indicates when the policy was last revised.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">7. Contact Us</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              If you have any questions about our use of cookies, please contact us at{" "}
              <a href="mailto:hello@toolsphere.ai" className="text-cyan-300 hover:underline">
                hello@toolsphere.ai
              </a>{" "}
              or visit our{" "}
              <Link to="/contact" className="text-cyan-300 hover:underline">Contact Page</Link>.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}