import { Link } from "react-router-dom";
import { FiAlertTriangle } from "react-icons/fi";
import { Helmet } from "react-helmet-async";

export default function DisclaimerPage() {
  return (
    <>
      <Helmet>
        <title>Disclaimer - ToolSphere</title>
        <meta
          name="description"
          content="ToolSphere Disclaimer. Important information about the limitations and disclaimers regarding the use of our AI tools directory."
        />
        <link rel="canonical" href="https://toolsphere.ai/disclaimer" />
        <meta property="og:title" content="Disclaimer - ToolSphere" />
        <meta
          property="og:description"
          content="Important disclaimers for ToolSphere users."
        />
        <meta property="og:url" content="https://toolsphere.ai/disclaimer" />
        <meta name="twitter:title" content="Disclaimer - ToolSphere" />
        <meta
          name="twitter:description"
          content="Important disclaimers for ToolSphere users."
        />
      </Helmet>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <nav className="mb-8 text-sm text-slate-400">
          <Link to="/" className="hover:text-cyan-300 transition">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-200">Disclaimer</span>
        </nav>

        <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 p-8 shadow-2xl shadow-cyan-950/30 lg:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
              <FiAlertTriangle className="h-4 w-4" />
              Disclaimer
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">Disclaimer</h1>
            <p className="mx-auto mt-4 max-w-2xl text-slate-300">Last updated: July 6, 2026</p>
          </div>
        </section>

        <section className="mt-8 space-y-8 rounded-2xl border border-white/10 bg-slate-900/70 p-8 lg:p-12">
          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">1. General Information</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              The information provided on ToolSphere ("the Website") is for general informational
              purposes only. While we strive to keep the information accurate and up-to-date, we
              make no representations or warranties of any kind, express or implied, about the
              completeness, accuracy, reliability, suitability, or availability of the information,
              products, services, or related graphics contained on the website for any purpose.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">2. Professional Advice</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              The content on ToolSphere is not intended to be a substitute for professional
              advice. The AI tools and platforms listed on our directory are third-party products,
              and we do not provide any professional or technical advice regarding their use.
              You should always consult with qualified professionals before making any decisions
              based on the information found on our website.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">3. No Endorsement</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              The inclusion of any AI tool or platform on ToolSphere does not constitute an
              endorsement or recommendation by us. We do not verify the claims, representations,
              or warranties made by the tool providers. The listings are provided for informational
              purposes only, and users are encouraged to perform their own due diligence before
              using any third-party tool or service.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">4. External Links Disclaimer</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              ToolSphere contains links to external websites and third-party tools that are not
              provided or maintained by us. We do not guarantee the accuracy, relevance,
              timeliness, or completeness of any information on these external websites. The
              inclusion of any link does not imply endorsement by us of the site or the products
              or services offered on that site.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">5. Limitation of Liability</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              In no event shall ToolSphere or its team be liable for any loss or damage including
              without limitation, indirect or consequential loss or damage, or any loss or damage
              whatsoever arising from loss of data or profits arising out of, or in connection
              with, the use of this website. This includes, but is not limited to:
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-2 text-slate-400">
              <li>Any errors or omissions in the content</li>
              <li>Any loss or damage incurred as a result of using any third-party tool listed</li>
              <li>Any interruptions or cessation of transmission to or from our website</li>
              <li>Any bugs, viruses, or other harmful components transmitted through our website</li>
              <li>Any damages resulting from the use of or reliance on the information presented</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">6. Accuracy of Information</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              While we endeavor to ensure that the information on ToolSphere is accurate and
              current, we make no guarantees. Tool descriptions, pricing, features, and
              availability are subject to change by the tool providers without notice. We
              recommend verifying all information directly with the respective tool provider
              before making any decisions.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">7. User Responsibility</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              Users of ToolSphere are responsible for their own use of the website and any
              decisions made based on the information found herein. We encourage users to:
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-2 text-slate-400">
              <li>Research and verify information independently</li>
              <li>Read the terms and conditions of any third-party tool before use</li>
              <li>Review privacy policies of any third-party tools they decide to use</li>
              <li>Consult with appropriate professionals for specific advice</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">8. Fair Use Disclaimer</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              ToolSphere may contain copyrighted material the use of which has not always been
              specifically authorized by the copyright owner. We make such material available
              for informational and educational purposes only. This constitutes a "fair use" of
              any such copyrighted material as provided for in copyright laws.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">9. Changes to This Disclaimer</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              We reserve the right to modify this disclaimer at any time. Changes will be
              effective immediately upon posting on this page. We encourage users to review
              this page periodically for any updates. Your continued use of the website after
              any changes constitutes acceptance of the updated disclaimer.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-cyan-300">10. Contact Information</h2>
            <p className="mt-3 text-slate-400 leading-relaxed">
              If you have any questions, concerns, or require clarification regarding this
              disclaimer, please contact us:
            </p>
            <p className="mt-3 text-slate-400">
              Email:{" "}
              <a href="mailto:hello@toolsphere.ai" className="text-cyan-300 hover:underline">
                hello@toolsphere.ai
              </a>
            </p>
            <p className="mt-1 text-slate-400">
              Or visit our{" "}
              <Link to="/contact" className="text-cyan-300 hover:underline">Contact Page</Link>.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 p-8 text-center shadow-xl lg:p-12">
          <h2 className="text-3xl font-semibold">Start Exploring AI Tools</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">
            Ready to find the perfect AI tool for your needs? Browse our curated directory
            of hundreds of AI tools and platforms.
          </p>
          <Link
            to="/tools"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-6 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Browse Tools
          </Link>
        </section>
      </div>
    </>
  );
}