import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";

const groups = [
  {
    title: "Product",
    items: [
      { label: "Overview", to: "/", hash: "features" },
      { label: "How it works", to: "/", hash: "how" },
      { label: "Technology", to: "/", hash: "technology" },
      { label: "Pricing", to: "/pricing", hash: undefined },
    ],
  },
  {
    title: "Roadmap",
    items: [
      { label: "Zoom integration", to: "/", hash: "roadmap" },
      { label: "Google Meet", to: "/", hash: "roadmap" },
      { label: "Microsoft Teams", to: "/", hash: "roadmap" },
      { label: "Voice clone detection", to: "/", hash: "roadmap" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Sign in", to: "/auth", hash: undefined },
      { label: "Dashboard", to: "/dashboard", hash: undefined },
      { label: "FAQ", to: "/", hash: "faq" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface/40">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              AI-assisted authenticity risk assessment for live video calls. TrustLens reports
              observable signals — it never claims certainty about a person's identity.
            </p>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <h3 className="text-[13px] font-semibold tracking-wide text-foreground">{g.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {g.items.map((i) => (
                  <li key={i.label}>
                    <Link
                      to={i.to}
                      hash={i.hash}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {i.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} TrustLens AI. Trust every call. Verify every face.</p>
          <p>Risk assessment tooling. Not an identity verification authority.</p>
        </div>
      </div>
    </footer>
  );
}
