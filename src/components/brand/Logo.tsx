import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className, to = "/" }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={cn("group flex items-center gap-2.5", className)}>
      <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl brand-gradient shadow-glow">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M12 4c4.6 0 8.2 3.2 9.5 8-1.3 4.8-4.9 8-9.5 8s-8.2-3.2-9.5-8C3.8 7.2 7.4 4 12 4Z"
            stroke="currentColor"
            strokeWidth="1.6"
            className="text-primary-foreground"
          />
          <circle cx="12" cy="12" r="3.2" fill="currentColor" className="text-primary-foreground" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight">
        TrustLens<span className="text-muted-foreground"> AI</span>
      </span>
    </Link>
  );
}
