import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiShield,
  FiStar,
  FiZap,
} from "react-icons/fi";
import { createCheckout, getMembership, markPaymentFailed, markPaymentSuccess } from "../services/userApi";
import { getUser, isLoggedIn } from "../utils/auth";

const plans = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    description: "Ideal for browsing the directory and saving a few favorite tools.",
    accent: "from-slate-500/20 to-slate-700/20",
    border: "border-white/10",
    buttonLabel: "Current plan",
    current: true,
    features: [
      "Browse all public listings",
      "Basic search and filters",
      "View pricing, features, and ratings",
      "Limited saved comparisons",
    ],
  },
  {
    name: "Pro",
    price: "$12",
    cadence: "/ month",
    description: "For power users who want a faster, more focused discovery workflow.",
    accent: "from-cyan-500/20 to-fuchsia-500/20",
    border: "border-cyan-400/30",
    buttonLabel: "Upgrade to Pro",
    current: false,
    highlight: true,
    features: [
      "Advanced comparison view",
      "Priority tool recommendations",
      "Enhanced filters and sorting",
      "Unlimited saved comparisons",
      "Early access to new directory features",
    ],
  },
];

const comparisonRows = [
  { label: "Search & browse tools", free: "Included", pro: "Included" },
  { label: "Tool comparison", free: "Basic", pro: "Advanced" },
  { label: "Saved comparisons", free: "Limited", pro: "Unlimited" },
  { label: "Priority recommendations", free: "—", pro: "Included" },
  { label: "Early feature access", free: "—", pro: "Included" },
  { label: "Support", free: "Community", pro: "Priority" },
];

const proFeatures = [
  "Deeper tool comparison across pricing, feature depth, and use cases.",
  "Faster decision-making with curated recommendations tailored to your workflow.",
  "Track and revisit more tools without losing your shortlist.",
  "Unlock premium directory experiences as they roll out.",
];

const currentPlan = {
  name: "Free",
  status: "Active",
  renewal: "No renewal required",
  usage: "3 of 5 saved comparisons used",
};

export default function PremiumPage() {
  const [membership, setMembership] = useState(null);
  const [loadingMembership, setLoadingMembership] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadMembership = async () => {
      try {
        if (!isLoggedIn()) {
          if (!cancelled) setMembership(getUser()?.membership || null);
          return;
        }

        const { data } = await getMembership();
        if (!cancelled) setMembership(data.membership);
      } catch {
        if (!cancelled) setMembership(getUser()?.membership || null);
      } finally {
        if (!cancelled) setLoadingMembership(false);
      }
    };

    loadMembership();

    return () => {
      cancelled = true;
    };
  }, []);

  const isPro = membership?.tier === "pro" || membership?.tier === "business";

  const handleUpgrade = async () => {
    try {
      setCheckoutLoading(true);
      setCheckoutMessage("");
      const { data } = await createCheckout();
      const checkoutUrl = data?.checkout?.url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }
      setCheckoutMessage(data?.message || "Checkout is not available right now.");
    } catch (error) {
      setCheckoutMessage(error.response?.data?.message || "Failed to start checkout.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    const checkoutId = params.get("checkoutId");

    if (checkout === "success") {
      markPaymentSuccess({ checkoutId, eventId: checkoutId, paymentIntentId: checkoutId })
        .then(({ data }) => {
          setMembership(data.membership);
          setCheckoutMessage(data.message);
        })
        .catch((error) => setCheckoutMessage(error.response?.data?.message || "Payment confirmation failed."));
    }

    if (checkout === "failed") {
      markPaymentFailed({ checkoutId })
        .then(({ data }) => setCheckoutMessage(data.message))
        .catch((error) => setCheckoutMessage(error.response?.data?.message || "Failed to record payment failure."));
    }
  }, []);

  return (
    <>
      <Helmet>
        <title>Premium - ToolSphere | Upgrade to Pro</title>
        <meta
          name="description"
          content="Compare Free vs Pro, review premium pricing, and upgrade your ToolSphere plan. No payment flow is available yet."
        />
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <nav className="mb-8 text-sm text-slate-400" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li>
              <Link to="/" className="transition hover:text-cyan-300">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <span className="text-slate-200" aria-current="page">
                Premium
              </span>
            </li>
          </ol>
        </nav>

        <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-fuchsia-500/10 p-8 shadow-2xl shadow-cyan-950/30 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
                <FiZap className="h-4 w-4" />
                Premium
              </div>
              <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">
                Unlock a faster way to discover the best AI tools
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-slate-300">
                Compare plans, review Pro benefits, and see exactly what changes when you
                upgrade. Payment is not enabled yet, so this page is informational only.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/premium"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-6 py-3 font-semibold text-white transition hover:opacity-90"
                >
                  Upgrade to Pro
                  <FiArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="#comparison"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/10"
                >
                  View comparison
                </a>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-xl"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">Current plan status</p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">{currentPlan.name}</h2>
                </div>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  {currentPlan.status}
                </span>
              </div>

              <div className="mt-6 space-y-4 text-sm text-slate-300">
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <FiClock className="mt-0.5 h-5 w-5 text-cyan-300" />
                  <div>
                    <p className="font-medium text-white">{currentPlan.renewal}</p>
                    <p className="mt-1 text-slate-400">You can upgrade anytime without payment setup yet.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <FiShield className="mt-0.5 h-5 w-5 text-fuchsia-300" />
                  <div>
                    <p className="font-medium text-white">Usage</p>
                    <p className="mt-1 text-slate-400">{currentPlan.usage}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="pricing" className="mt-12 grid gap-6 lg:grid-cols-2">
          {plans.map((plan) => (
            <motion.article
              key={plan.name}
              whileHover={{ y: -4 }}
              className={`rounded-[2rem] border ${plan.border} bg-slate-900/70 p-8 shadow-xl ${
                plan.highlight ? "ring-1 ring-cyan-400/20" : ""
              }`}
            >
              <div className={`rounded-3xl bg-gradient-to-br ${plan.accent} p-5`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">{plan.name}</h2>
                    <p className="mt-2 text-slate-300">{plan.description}</p>
                  </div>
                  {plan.current && (
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                      Current plan
                    </span>
                  )}
                </div>

                <div className="mt-6 flex items-end gap-2">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="pb-1 text-slate-300">{plan.cadence}</span>
                </div>
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-slate-300">
                    <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {plan.current ? (
                  <button
                    type="button"
                    disabled
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-slate-400"
                  >
                    <FiStar className="h-5 w-5" />
                    {plan.buttonLabel}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-6 py-3 font-semibold text-white transition hover:opacity-90"
                  >
                    <FiCreditCard className="h-5 w-5" />
                    {plan.buttonLabel}
                  </button>
                )}
              </div>
            </motion.article>
          ))}
        </section>

        <section id="comparison" className="mt-12 rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
                Free vs Pro
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-white">
                Compare what’s included in each plan
              </h2>
            </div>
            <p className="max-w-xl text-slate-400">
              Use the comparison below to decide whether the Pro upgrade is a fit for your workflow.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10">
            <div className="grid grid-cols-3 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200">
              <div>Feature</div>
              <div>Free</div>
              <div>Pro</div>
            </div>
            {comparisonRows.map((row) => (
              <div key={row.label} className="grid grid-cols-3 border-t border-white/10 px-4 py-4 text-sm text-slate-300">
                <div className="font-medium text-white">{row.label}</div>
                <div>{row.free}</div>
                <div className="text-cyan-300">{row.pro}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
                <FiStar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Pro feature list</p>
                <h2 className="text-2xl font-semibold text-white">Why upgrade?</h2>
              </div>
            </div>

            <ul className="mt-6 space-y-4">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-slate-300">
                  <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 p-8 shadow-xl">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
              Upgrade button
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Ready when payments are enabled</h2>
            <p className="mt-4 text-slate-300 leading-relaxed">
              The upgrade button is live as a placeholder for the future checkout flow.
              For now, it simply signals the intended action and keeps the experience
              clear without collecting payment details.
            </p>

              <button
              type="button"
                onClick={handleUpgrade}
                disabled={checkoutLoading || isPro}
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              {checkoutLoading ? "Starting checkout…" : "Upgrade to Pro"}
              <FiArrowRight className="h-5 w-5" />
            </button>
              {checkoutMessage ? <p className="mt-4 text-sm text-slate-300">{checkoutMessage}</p> : null}
          </div>
        </section>

        <section className="mt-12 rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
                Access check
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Backend-verified Pro access</h2>
              <p className="mt-3 text-slate-400">
                Free users see this upgrade prompt. Pro access is always verified on the server.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-200">
              {loadingMembership ? (
                <span>Checking membership…</span>
              ) : isPro ? (
                <span className="text-emerald-300">Pro membership confirmed</span>
              ) : (
                <span className="text-amber-300">Free plan detected — upgrade required</span>
              )}
            </div>
          </div>

          {!isPro && !loadingMembership ? (
            <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5 text-amber-100">
              <p className="font-medium">Upgrade required</p>
              <p className="mt-1 text-sm text-amber-100/80">
                Your account is on the Free plan. Pro-only features stay locked until the
                server confirms an upgraded membership.
              </p>
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}