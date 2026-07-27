import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Timer,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/app/AppShell";
import { TrustGauge } from "@/components/app/TrustGauge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { displayName, useSession } from "@/lib/use-session";
import {
  formatDateTime,
  formatDuration,
  riskBadgeClass,
  riskFromScore,
  riskLabel,
} from "@/lib/trustlens";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — TrustLens AI" },
      { name: "description", content: "Your authenticity analysis overview, trends and recent sessions." },
      { property: "og:title", content: "Dashboard — TrustLens AI" },
      { property: "og:description", content: "Authenticity analysis overview and recent sessions." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useSession();

  const sessions = useQuery({
    queryKey: ["sessions", "recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analysis_sessions")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const detections = useQuery({
    queryKey: ["detections", "recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("detections")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const rows = sessions.data ?? [];
  const total = rows.length;
  const avg = total ? Math.round(rows.reduce((a, r) => a + r.trust_score, 0) / total) : 0;
  const flagged = rows.filter((r) => r.trust_score < 75).length;
  const minutes = Math.round(rows.reduce((a, r) => a + r.duration_seconds, 0) / 60);

  const trend = [...rows]
    .reverse()
    .slice(-14)
    .map((r, i) => ({
      name: `S${i + 1}`,
      score: r.trust_score,
    }));

  const bySignal = (detections.data ?? []).reduce<Record<string, { n: number; sum: number }>>(
    (acc, d) => {
      acc[d.signal] = acc[d.signal] ?? { n: 0, sum: 0 };
      acc[d.signal].n += 1;
      acc[d.signal].sum += d.score;
      return acc;
    },
    {},
  );
  const signalData = Object.entries(bySignal).map(([signal, v]) => ({
    signal: signal.slice(0, 10),
    score: Math.round(v.sum / v.n),
  }));

  const stats = [
    { label: "Sessions analyzed", value: String(total), icon: Activity },
    { label: "Average trust score", value: total ? String(avg) : "—", icon: ShieldCheck },
    { label: "Sessions flagged", value: String(flagged), icon: AlertTriangle },
    { label: "Minutes analyzed", value: String(minutes), icon: Timer },
  ];

  return (
    <AppShell
      title={`Welcome back, ${displayName(user).split(" ")[0]}`}
      description="Your authenticity analysis at a glance"
      actions={
        <Button variant="hero" asChild>
          <Link to="/live">
            Start analysis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      }
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="glass rounded-3xl p-6"
            >
              <div className="flex items-start justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <s.icon className="h-4.5 w-4.5" />
                </span>
              </div>
              <p className="mt-5 text-3xl font-bold tracking-tight tabular-nums">
                {sessions.isLoading ? <Skeleton className="h-8 w-16" /> : s.value}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="glass rounded-3xl p-6">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold tracking-tight">Trust score trend</h2>
                <p className="truncate text-xs text-muted-foreground">Last {trend.length} sessions</p>
              </div>
            </div>
            <div className="mt-6 h-[260px]">
              {trend.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="tl-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 14,
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fill="url(#tl-area)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="glass grid place-items-center rounded-3xl p-6">
            <TrustGauge value={avg} label="Average score" />
            <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
              {total
                ? `${riskLabel(riskFromScore(avg))} across ${total} analyzed session${total === 1 ? "" : "s"}.`
                : "Run your first live analysis to populate this score."}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="glass rounded-3xl p-6">
            <h2 className="text-base font-semibold tracking-tight">Average score by signal</h2>
            <p className="text-xs text-muted-foreground">Across your recorded detections</p>
            <div className="mt-6 h-[240px]">
              {signalData.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={signalData} margin={{ left: -20, right: 8, top: 8 }}>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="signal" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: "var(--accent)" }}
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 14,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="score" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
              <h2 className="truncate text-base font-semibold tracking-tight">Recent sessions</h2>
              <Link
                to="/sessions"
                className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                View all
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-5 divide-y divide-border">
              {sessions.isLoading &&
                [0, 1, 2].map((i) => <Skeleton key={i} className="my-3 h-12 w-full" />)}
              {!sessions.isLoading && rows.length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No sessions yet. Start a live analysis to see results here.
                </p>
              )}
              {rows.slice(0, 6).map((r) => {
                const level = riskFromScore(r.trust_score);
                return (
                  <div key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatDateTime(r.started_at)} · {formatDuration(r.duration_seconds)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium tabular-nums",
                        riskBadgeClass(level),
                      )}
                    >
                      {r.trust_score}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function EmptyChart() {
  return (
    <div className="grid h-full place-items-center rounded-2xl border border-dashed border-border">
      <p className="text-sm text-muted-foreground">No data yet</p>
    </div>
  );
}
