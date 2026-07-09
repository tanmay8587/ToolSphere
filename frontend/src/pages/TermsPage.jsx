import { Link } from "react-router-dom";
import { FiFileText } from "react-icons/fi";
import { Helmet } from "react-helmet-async";

export default function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Terms & Conditions - ToolSphere</title>
        <meta
          name="description"
          content="ToolSphere Terms and Conditions. Read the terms governing the use of our AI tools directory website and services."
        />
        <link rel="canonical" href="https://toolsphere.ai/terms" />
        <meta property="og:title" content="Terms & Conditions - ToolSphere" />
        <meta
          property="og:description"
          content="Terms governing the use of ToolSphere."
        />
        <meta property="og:url" content="https://toolsphere.ai/terms" />
        <meta name="twitter:title" content="Terms & Conditions - ToolSphere" />
        <meta
          name="twitter:description"
          content="Terms governing the use of ToolSphere."
        />
      </Helmet>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <nav className="mb-8 text-sm text-slate-400">
          <Link to="/" className="hover:text-cyan-300 transition">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-200">Terms & Conditions</span>
        </nav>

        <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 p-8 shadow-2xl shadow-cyan-950/30 lg:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
              <FiFileText className="h-4 w-4" />
              Terms & Conditions
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">Terms & Conditions</h1>
            <p className="mx-auto mt-4 max-w-2xl text-slate-300">Last updated: July 6, 2026</p>
          </div>
        </section>

        <section className="mt-8 space-y-8 rounded-2xl border border-white/10 bg-slate-900/70 p-8 lg:p-12">
          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">1. Acceptance of Terms</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              By accessing or using ToolSphere ("the Website"), you agree to be bound by these
              Terms and Conditions. If you do not agree with any part of these terms, you must
              not use our service.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">2. Description of Service</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              ToolSphere provides a curated directory of AI tools and platforms. We list
              third-party tools for informational purposes and do not endorse or guarantee
              any specific tool listed on our platform. The information provided is for
              general informational purposes only.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">3. User Responsibilities</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">As a user of ToolSphere, you agree to:</p>
            <ul className="mt-3 list-disc pl-6 space-y-2 text-slate-400">
              <li>Use the service in compliance with all applicable laws and regulations</li>
              <li>Not misuse or abuse the service in any way</li>
              <li>Not attempt to gain unauthorized access to any part of the service</li>
              <li>Not use the service for any fraudulent or unlawful purpose</li>
              <li>Not interfere with the proper functioning of the service</li>
              <li>Provide accurate information when submitting tools or contacting us</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">4. Intellectual Property</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              The content on ToolSphere, including but not limited to text, graphics, logos,
              and software, is the property of ToolSphere or its content suppliers and is
              protected by applicable intellectual property laws. You may not reproduce,
              distribute, modify, or create derivative works without our prior written consent.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">5. Third-Party Links and Tools</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              Our service contains links to third-party websites and tools that are not owned
              or controlled by us. We have no control over and assume no responsibility for
              the content, privacy policies, or practices of any third-party websites. You
              acknowledge and agree that ToolSphere shall not be liable for any damage or
              loss caused by the use of such third-party tools or websites.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">6. Tool Listings and Submissions</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              Tool listings are provided for informational purposes. We make no warranties
              about the accuracy, completeness, or reliability of any tool listing. When
              submitting a tool, you warrant that all information provided is accurate and
              that you have the right to submit such information. We reserve the right to
              reject or remove any listing at our sole discretion.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">7. Disclaimer of Warranties</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              TOOLSPHERE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF
              ANY KIND, WHETHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL
              BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">8. Limitation of Liability</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              In no event shall ToolSphere, its owners, employees, or affiliates be liable
              for any indirect, incidental, special, consequential, or punitive damages
              arising out of or related to your use of the service.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">9. Indemnification</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              You agree to indemnify and hold harmless ToolSphere and its affiliates from
              any claims, damages, losses, liabilities, and expenses arising out of your
              use of the service or violation of these terms.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">10. Changes to Terms</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              We reserve the right to modify these terms at any time. Changes will be
              effective immediately upon posting. Your continued use of the service after
              changes constitutes acceptance of the new terms.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">11. Governing Law</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              These terms shall be governed by and construed in accordance with the laws of
              the United States, without regard to its conflict of law provisions.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">12. Contact</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              For questions about these terms, please contact us at{" "}
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