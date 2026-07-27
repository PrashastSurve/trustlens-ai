import { useEffect, useRef, useState } from "react";
import { riskFromScore, riskToneClass } from "@/lib/trustlens";
import { cn } from "@/lib/utils";

interface TrustGaugeProps {
  value: number;
  size?: number;
  label?: string;
  animate?: boolean;
  className?: string;
}

export function TrustGauge({
  value,
  size = 200,
  label = "Trust score",
  animate = true,
  className,
}: TrustGaugeProps) {
  const [display, setDisplay] = useState(animate ? 0 : value);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!animate) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const from = display;
    const duration = 900;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, animate]);

  const level = riskFromScore(display);
  const stroke = 10;
  const r = (size - stroke) / 2 - 6;
  const c = 2 * Math.PI * r;
  const arc = 0.75;
  const offset = c * (1 - (display / 100) * arc);

  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-[225deg]" aria-hidden="true">
        <defs>
          <linearGradient id="tl-gauge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--secondary)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * arc} ${c}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#tl-gauge)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 120ms linear" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <span className={cn("text-5xl font-bold tabular-nums tracking-tight", riskToneClass(level))}>
          {display}
        </span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}
