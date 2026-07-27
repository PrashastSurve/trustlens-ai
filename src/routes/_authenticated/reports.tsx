import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, riskBadgeClass, riskFromScore, riskLabel } from "@/lib/trustlens";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — TrustLens AI" },
      { name: "description", content: "Generated authenticity reports with summaries and recommendations." },
      { property: "og:title", content: "Reports — TrustLens AI" },
      { property: "og:description", content: "Authenticity reports with summaries and recommendations." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Reports,
});

function Reports() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const rows = data ?? [];

  function exportCsv() {
    const header = ["title", "risk_score", "risk_level", "created_at", "summary", "recommendation"];
    const body = rows.map((r) =>
      [r.title, r.risk_score, r.risk_level, r.created_at, r.summary ?? "", r.recommendation ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...body].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trustlens-reports.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell
      title="Reports"
      description="Summaries and recommendations generated from your sessions"
      actions={
        <Button variant="glass" onClick={exportCsv} disabled={rows.length === 0}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      }
    >
      <div className="mx-auto max-w-5xl space-y-4">
        {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-40 w-full rounded-3xl" />)}

        {!isLoading && rows.length === 0 && (
          <div className="glass grid place-items-center gap-3 rounded-3xl p-16 text-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Reports are generated automatically when you save a live session.
            </p>
            <Button variant="glass" asChild>
              <Link to="/live">Run an analysis</Link>
            </Button>
          </div>
        )}

        {rows.map((r) => {
          const level = riskFromScore(r.risk_score);
          return (
            <article key={r.id} className="glass rounded-3xl p-6 sm:p-8">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold tracking-tight">{r.title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(r.created_at)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={cn(
                      "whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium",
                      riskBadgeClass(level),
                    )}
                  >
                    {riskLabel(level)}
                  </span>
                  <span className="text-2xl font-bold tabular-nums">{r.risk_score}</span>
                </div>
              </div>

              {r.summary && (
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{r.summary}</p>
              )}
              {r.recommendation && (
                <div className="mt-5 rounded-2xl border border-border bg-surface/60 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    Recommendation
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">{r.recommendation}</p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
