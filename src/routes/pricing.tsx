import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — TrustLens AI" },
      {
        name: "description",
        content:
          "TrustLens AI pricing: a free tier for occasional checks, Pro for daily verification work, and Enterprise for regulated teams.",
      },
      { property: "og:title", content: "Pricing — TrustLens AI" },
      {
        property: "og:description",
        content: "Free, Pro and Enterprise plans. Every plan includes the full six-signal engine.",
      },
    ],
  }),
  component: Pricing,
});

const plans = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    lead: "For occasional verification and evaluation.",
    features: [
      "5 live sessions per month",
      "Full six-signal engine",
      "Session trust score & explanation",
      "7-day report retention",
    ],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$49",
    cadence: "per user / month",
    lead: "For teams verifying calls every day.",
    features: [
      "Unlimited live sessions",
      "Alert timeline & signal drill-down",
      "PDF & CSV report export",
      "90-day retention",
      "Per-user API keys",
      "Email & in-app alerts",
    ],
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "annual",
    lead: "For regulated and high-volume environments.",
    features: [
      "Everything in Pro",
      "SSO & SCIM provisioning",
      "Custom retention & data residency",
      "Audit log export",
      "Webhook delivery",
      "Dedicated support",
    ],
    cta: "Talk to us",
    highlight: false,
  },
];

function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="relative pt-32 pb-24 lg:pt-40">
        <div className="pointer-events-none absolute inset-0 aurora opacity-50" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-primary">
              Pricing
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Accuracy is never the upsell
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Every plan runs the same detection engine. You pay for volume, retention and controls.
            </p>
          </div>

          <div className="mt-16 grid gap-5 lg:grid-cols-3">
            {plans.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "relative flex flex-col rounded-3xl p-8",
                  p.highlight
                    ? "glass-strong shadow-[var(--shadow-glow)]"
                    : "glass",
                )}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-8 rounded-full brand-gradient px-3 py-1 text-[11px] font-semibold text-primary-foreground">
                    Most popular
                  </span>
                )}
                <h2 className="text-lg font-semibold tracking-tight">{p.name}</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">{p.lead}</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight">{p.price}</span>
                  <span className="text-xs text-muted-foreground">{p.cadence}</span>
                </div>
                <ul className="mt-8 flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={p.highlight ? "hero" : "glass"}
                  className="mt-8 w-full"
                  asChild
                >
                  <Link to="/auth" search={{ mode: "register" }}>
                    {p.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>

          <p className="mx-auto mt-12 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">
            TrustLens AI produces an AI-assisted authenticity risk assessment. Results are advisory
            and should be combined with your existing identity verification process.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
