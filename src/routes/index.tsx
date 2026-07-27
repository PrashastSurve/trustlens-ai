import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Gauge,
  ScanFace,
  AudioLines,
  Eye,
  Sun,
  FileText,
  Building2,
  ArrowRight,
  PlayCircle,
  Sparkles,
  Video,
  Cpu,
  Radar,
  Check,
} from "lucide-react";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { TrustGauge } from "@/components/app/TrustGauge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import heroEye from "@/assets/hero-eye.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TrustLens AI — Trust Every Call. Verify Every Face." },
      {
        name: "description",
        content:
          "Real-time AI that analyzes live video calls and returns an authenticity risk assessment using facial landmarks, blink cadence, lip sync and lighting analysis.",
      },
      { property: "og:title", content: "TrustLens AI — Trust Every Call. Verify Every Face." },
      {
        property: "og:description",
        content:
          "AI-assisted deepfake risk assessment for live video calls. Trust score, live alerts and session reports.",
      },
    ],
  }),
  component: Home,
});

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const features = [
  {
    icon: ShieldCheck,
    title: "Live deepfake detection",
    body: "Frame-by-frame inference on the active video track, surfacing risk while the call is still happening.",
  },
  {
    icon: Gauge,
    title: "AI trust score",
    body: "One calibrated 0–100 number fusing every signal, with the confidence interval always visible.",
  },
  {
    icon: ScanFace,
    title: "Facial landmark analysis",
    body: "468 tracked points measured for geometric stability, warping and boundary artifacts.",
  },
  {
    icon: AudioLines,
    title: "Lip sync verification",
    body: "Mouth motion is correlated against the audio envelope to catch re-enactment drift.",
  },
  {
    icon: Eye,
    title: "Blink detection",
    body: "Blink rate, duration and symmetry compared against natural human distributions.",
  },
  {
    icon: Sun,
    title: "Lighting analysis",
    body: "Illumination coherence across facial regions reveals composited or relit faces.",
  },
  {
    icon: FileText,
    title: "Session reports",
    body: "Every session becomes a timestamped report with a summary, timeline and recommendation.",
  },
  {
    icon: Building2,
    title: "Enterprise ready",
    body: "Row-level isolation, per-user API keys, configurable retention and audit-friendly exports.",
  },
];

const steps = [
  {
    icon: Video,
    title: "Connect the call",
    body: "Grant camera access or point TrustLens at an incoming meeting stream. Nothing leaves the session unless you save it.",
  },
  {
    icon: Cpu,
    title: "Analyze continuously",
    body: "Six independent signals run in parallel on every frame window, each producing its own confidence score.",
  },
  {
    icon: Radar,
    title: "Act on the score",
    body: "A live trust score, plain-language explanation and alert timeline tell you when to ask for a second factor.",
  },
];

const useCases = [
  { title: "Financial services", body: "Verify high-value transfers and remote onboarding calls before funds move." },
  { title: "Enterprise hiring", body: "Catch proxy interviewees and synthetic candidates during remote interviews." },
  { title: "Executive comms", body: "Protect leadership from CEO-fraud calls that request urgent wire approvals." },
  { title: "Government & legal", body: "Add an evidentiary record of authenticity signals to remote depositions." },
  { title: "Healthcare", body: "Confirm the person on a telehealth call matches the patient of record." },
  { title: "Customer support", body: "Escalate account recovery requests when authenticity signals degrade." },
];

const tech = [
  { label: "Computer vision", value: "468-point facial mesh, optical-flow micro-motion, per-region illumination modelling" },
  { label: "Temporal modelling", value: "Sliding-window scoring so a single bad frame never flips the verdict" },
  { label: "Multimodal fusion", value: "Vision and audio signals combined with calibrated per-signal weights" },
  { label: "Privacy by design", value: "Frames are analyzed in-session; only scores and metadata are persisted" },
];

const faqs = [
  {
    q: "Does TrustLens prove someone is fake?",
    a: "No. TrustLens produces an AI-assisted authenticity risk assessment from observable signals. A low trust score means the capture looks inconsistent with a natural live human — it is a prompt for further verification, never a determination of identity or intent.",
  },
  {
    q: "What causes false positives?",
    a: "Heavy compression, poor lighting, low bandwidth, virtual backgrounds and aggressive beauty filters can all depress signal scores. The explanation panel always names which signals drove the score so you can discount environmental causes.",
  },
  {
    q: "Is video stored anywhere?",
    a: "Frames are analyzed in the session and discarded. Only numeric scores, detections and report metadata are written to your account, under retention rules you control in Settings.",
  },
  {
    q: "Can I use it inside Zoom or Teams?",
    a: "Native meeting integrations for Zoom, Google Meet and Microsoft Teams plus a browser extension are on the roadmap. Today TrustLens analyzes any camera or capture source you can select in the browser.",
  },
  {
    q: "Is there an API?",
    a: "Per-user API keys are available in the dashboard today, with the public REST API and webhook delivery shipping alongside the enterprise dashboard.",
  },
];

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main>
        <Hero />
        <Features />
        <DashboardPreview />
        <HowItWorks />
        <UseCases />
        <Technology />
        <PricingTeaser />
        <Roadmap />
        <Faq />
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="max-w-2xl"
        >
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-primary">
            {eyebrow}
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{title}</h2>
          {lead && <p className="mt-5 text-base leading-relaxed text-muted-foreground">{lead}</p>}
        </motion.div>
        <div className="mt-14">{children}</div>
      </div>
    </section>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-44 lg:pb-28">
      <div className="pointer-events-none absolute inset-0 aurora opacity-70" />
      <div className="pointer-events-none absolute inset-0 grid-backdrop" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 lg:grid-cols-[1.05fr_1fr] lg:px-8">
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border glass px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI powered security
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-7 text-[clamp(2.75rem,7vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.03em]"
          >
            <span className="text-gradient">Trust every call.</span>
            <br />
            Verify every face.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground"
          >
            Real-time AI that analyzes live video calls and provides authenticity risk assessment
            using computer vision and multimodal analysis.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-3">
            <Button size="lg" variant="hero" asChild>
              <Link to="/auth" search={{ mode: "register" }}>
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="glass" asChild>
              <Link to="/" hash="preview">
                <PlayCircle className="h-4 w-4" />
                Watch demo
              </Link>
            </Button>
          </motion.div>

          <motion.dl variants={fadeUp} className="mt-14 grid max-w-lg grid-cols-3 gap-6">
            {[
              { k: "6", v: "signals fused" },
              { k: "<120ms", v: "scoring window" },
              { k: "0", v: "frames stored" },
            ].map((s) => (
              <div key={s.v}>
                <dt className="text-2xl font-bold tracking-tight">{s.k}</dt>
                <dd className="mt-1 text-xs text-muted-foreground">{s.v}</dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto w-full max-w-[520px]"
        >
          <div className="absolute inset-8 rounded-full bg-primary/20 blur-3xl" />
          <img
            src={heroEye}
            alt="Chrome and glass 3D eye representing TrustLens AI live authenticity analysis"
            width={1280}
            height={1280}
            className="relative w-full animate-float drop-shadow-[0_40px_80px_oklch(0_0_0/0.6)]"
          />
        </motion.div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <Section
      id="features"
      eyebrow="Capabilities"
      title="Every signal a synthetic face gets wrong"
      lead="TrustLens scores six independent channels. No single one decides the outcome — disagreement between them is what makes the assessment useful."
    >
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {features.map((f) => (
          <motion.article
            key={f.title}
            variants={fadeUp}
            className="glow-border group glass rounded-3xl p-6 transition-transform duration-300 hover:-translate-y-1"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <f.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-base font-semibold tracking-tight">{f.title}</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
          </motion.article>
        ))}
      </motion.div>
    </Section>
  );
}

function DashboardPreview() {
  const bars = [
    { label: "Facial landmarks", value: 94 },
    { label: "Blink cadence", value: 88 },
    { label: "Lip sync", value: 71 },
    { label: "Lighting coherence", value: 83 },
    { label: "Head movement", value: 90 },
  ];
  return (
    <Section
      id="preview"
      eyebrow="Live console"
      title="The whole assessment on one screen"
      lead="A calm, dense console: gauge, per-signal confidence, alert timeline and a plain-language explanation you can paste into a ticket."
    >
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="glass overflow-hidden rounded-[28px] p-4 shadow-[var(--shadow-elevated)] sm:p-6"
      >
        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/70 p-6">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full bg-danger/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-danger">
                <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                Live
              </span>
              <span className="text-xs text-muted-foreground">Session 04:12</span>
            </div>
            <div className="relative mt-6 aspect-video overflow-hidden rounded-2xl border border-border bg-background">
              <div className="absolute inset-0 aurora opacity-40" />
              <div className="absolute left-1/2 top-1/2 h-[62%] w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-[46%] border-2 border-primary/60" />
              <div className="absolute inset-x-0 top-1/2 h-24 animate-scan bg-gradient-to-b from-transparent via-primary/25 to-transparent" />
              <div className="absolute bottom-4 left-4 rounded-xl glass px-3 py-2 text-xs">
                Face locked · 468 landmarks
              </div>
            </div>
            <div className="mt-6 space-y-3.5">
              {bars.map((b, i) => (
                <div key={b.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{b.label}</span>
                    <span className="tabular-nums">{b.value}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${b.value}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full brand-gradient"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="grid place-items-center rounded-3xl border border-border bg-surface/70 py-8">
              <TrustGauge value={86} size={196} />
              <p className="mt-2 text-xs text-muted-foreground">Confidence ±4 · 312 frames</p>
            </div>
            <div className="flex-1 rounded-3xl border border-border bg-surface/70 p-6">
              <h3 className="text-sm font-semibold">AI explanation</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Landmark geometry and blink cadence are consistent with a live human participant.
                Lip sync briefly desynchronised at 02:41, most likely a bandwidth artifact. No action
                required, but re-check if the score falls below 70.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Stable mesh", "Natural blink", "Minor sync drift"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border bg-accent/60 px-3 py-1 text-[11px] text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Section>
  );
}

function HowItWorks() {
  return (
    <Section
      id="how"
      eyebrow="How it works"
      title="Three steps, no workflow change"
      lead="TrustLens runs beside the call you are already on. It never joins as a participant and never announces itself to the other side."
    >
      <motion.ol
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="grid gap-5 lg:grid-cols-3"
      >
        {steps.map((s, i) => (
          <motion.li key={s.title} variants={fadeUp} className="glass rounded-3xl p-8">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-border bg-accent/60">
                <s.icon className="h-5 w-5 text-primary" />
              </span>
              <span className="text-5xl font-bold tracking-tight text-muted/60">0{i + 1}</span>
            </div>
            <h3 className="mt-6 text-lg font-semibold tracking-tight">{s.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </motion.li>
        ))}
      </motion.ol>
    </Section>
  );
}

function UseCases() {
  return (
    <Section
      id="use-cases"
      eyebrow="Use cases"
      title="Where a fake face costs the most"
      lead="Anywhere a decision is made on the strength of a face on a screen."
    >
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3"
      >
        {useCases.map((u) => (
          <motion.div key={u.title} variants={fadeUp} className="bg-surface p-8 transition-colors hover:bg-card">
            <h3 className="text-base font-semibold tracking-tight">{u.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{u.body}</p>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}

function Technology() {
  return (
    <Section
      id="technology"
      eyebrow="Technology"
      title="Built to be argued with"
      lead="Every score is traceable back to the signal and the frame window that produced it."
    >
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="grid gap-5 lg:grid-cols-2"
      >
        {tech.map((t) => (
          <motion.div key={t.label} variants={fadeUp} className="glass rounded-3xl p-8">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              {t.label}
            </h3>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">{t.value}</p>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}

function PricingTeaser() {
  return (
    <Section
      eyebrow="Pricing"
      title="Start free. Scale when the stakes do."
      lead="Every plan includes the full six-signal engine. You pay for volume, retention and controls — never for accuracy."
    >
      <div className="glass flex flex-col items-start justify-between gap-6 rounded-3xl p-8 sm:flex-row sm:items-center">
        <ul className="grid gap-2.5 sm:grid-cols-3 sm:gap-x-10">
          {["Full signal engine", "Session reports & export", "Per-user API keys"].map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Check className="h-4 w-4 shrink-0 text-success" />
              {f}
            </li>
          ))}
        </ul>
        <Button variant="hero" size="lg" asChild>
          <Link to="/pricing">
            See plans
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Section>
  );
}

function Roadmap() {
  const items = [
    "Zoom integration",
    "Google Meet integration",
    "Microsoft Teams integration",
    "Browser extension",
    "Voice clone detection",
    "Enterprise dashboard",
    "Public REST API",
    "Webhook delivery",
  ];
  return (
    <Section id="roadmap" eyebrow="Roadmap" title="Shipping next">
      <div className="flex flex-wrap gap-2.5">
        {items.map((i) => (
          <span
            key={i}
            className="rounded-full border border-border bg-surface/70 px-4 py-2 text-sm text-muted-foreground"
          >
            {i}
          </span>
        ))}
      </div>
    </Section>
  );
}

function Faq() {
  return (
    <Section id="faq" eyebrow="FAQ" title="Honest answers">
      <div className="max-w-3xl">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`item-${i}`} className="border-border">
              <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
