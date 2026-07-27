import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import {
  formatDateTime,
  formatDuration,
  riskBadgeClass,
  riskFromScore,
  riskLabel,
} from "@/lib/trustlens";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/sessions")({
  head: () => ({
    meta: [
      { title: "Sessions — TrustLens AI" },
      { name: "description", content: "Browse every analyzed session with its trust score and duration." },
      { property: "og:title", content: "Sessions — TrustLens AI" },
      { property: "og:description", content: "Browse every analyzed session and its trust score." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Sessions,
});

function Sessions() {
  const [q, setQ] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["sessions", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analysis_sessions")
        .select("*")
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const rows = (data ?? []).filter(
    (r) =>
      r.title.toLowerCase().includes(q.toLowerCase()) ||
      (r.participant ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  async function remove(id: string) {
    const { error } = await supabase.from("analysis_sessions").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Session deleted");
    queryClient.invalidateQueries({ queryKey: ["sessions"] });
  }

  return (
    <AppShell
      title="Sessions"
      description="Every analysis you have run"
      actions={
        <Button variant="hero" asChild>
          <Link to="/live">
            New analysis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      }
    >
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search sessions"
            className="pl-9"
          />
        </div>

        <div className="glass overflow-hidden rounded-3xl">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="grid place-items-center gap-3 p-16 text-center">
              <p className="text-sm text-muted-foreground">
                {q ? "No sessions match that search." : "No sessions recorded yet."}
              </p>
              {!q && (
                <Button variant="glass" asChild>
                  <Link to="/live">Run your first analysis</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Session</TableHead>
                    <TableHead>Participant</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const level = riskFromScore(r.trust_score);
                    return (
                      <TableRow key={r.id} className="border-border">
                        <TableCell className="max-w-[220px] truncate font-medium">{r.title}</TableCell>
                        <TableCell className="text-muted-foreground">{r.participant ?? "—"}</TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDateTime(r.started_at)}
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {formatDuration(r.duration_seconds)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium",
                              riskBadgeClass(level),
                            )}
                          >
                            {riskLabel(level)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-base font-semibold tabular-nums">
                          {r.trust_score}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${r.title}`}
                            onClick={() => remove(r.id)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
