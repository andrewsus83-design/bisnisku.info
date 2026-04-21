import { env } from "./env";

export const siteConfig = {
  name: "bisnisku.info",
  tagline: "Partner Cerdas untuk Pertumbuhan Bisnis Anda di Era Digital",
  description:
    "Platform all-in-one untuk mengelola bisnis offline di Indonesia. Modern business directory yang di-optimize oleh AI.",
  url: env.APP_URL,
  domain: "bisnisku.info",

  // Pricing tiers (IDR/month)
  pricing: {
    free: { price: 0, txFee: null, label: "Free" },
    starter: { price: 999_000, txFee: 0.02, label: "Starter" },
    growth: { price: 2_900_000, txFee: 0.01, label: "Growth" },
    business: { price: 8_900_000, txFee: 0.005, label: "Business" },
    enterprise: { price: 18_900_000, txFee: 0.003, label: "Enterprise" },
  },

  // Phase 1 targets
  targets: {
    paidMerchants12Mo: 300,
    jakartaMerchants24Mo: 1000,
    geo: "Jakarta",
  },

  // Social / links
  links: {
    github: "https://github.com/andrewsus83-design/bisnisku.info",
  },
} as const;
