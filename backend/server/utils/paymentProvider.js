const normalizeBaseUrl = (url, fallback) => {
  const value = (url || fallback || "").trim().replace(/\/$/, "");
  return value;
};

export const PAYMENT_PROVIDER = {
  MOCK: "mock",
  STRIPE: "stripe",
};

export const getPaymentProviderConfig = () => {
  const provider = (process.env.PAYMENT_PROVIDER || PAYMENT_PROVIDER.MOCK).toLowerCase();

  return {
    provider,
    frontendUrl: normalizeBaseUrl(process.env.FRONTEND_URL, "http://localhost:5173"),
    appUrl: normalizeBaseUrl(process.env.APP_URL, process.env.FRONTEND_URL || "http://localhost:5173"),
    currency: (process.env.PAYMENT_CURRENCY || "usd").toLowerCase(),
    proPriceId: process.env.STRIPE_PRO_PRICE_ID || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    secretKey: process.env.STRIPE_SECRET_KEY || "",
  };
};

export const isSupportedPaymentProvider = (provider) =>
  [PAYMENT_PROVIDER.MOCK, PAYMENT_PROVIDER.STRIPE].includes(provider);
