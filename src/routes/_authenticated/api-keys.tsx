import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, KeyRound, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { formatDateTime } from "@/lib/trustlens";

export const Route = createFileRoute("/_authenticated/api-keys")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "API keys — TrustLens AI" },
      { name: "description", content: "Create and revoke API keys for programmatic TrustLens access." },
      { property: "og:title", content: "API keys — TrustLens AI" },
      { property: "og:description", content: "Create and revoke TrustLens API keys." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ApiKeys,
});

async function sha256(value: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function ApiKeys() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [created, setCreated] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function create() {
    if (!user || !name.trim()) return;
    setBusy(true);
    try {
      const bytes = crypto.getRandomValues(new Uint8Array(24));
      const secret =
        "tl_live_" +
        Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      const { error } = await supabase.from("api_keys").insert({
        user_id: user.id,
        name: name.trim(),
        key_prefix: secret.slice(0, 16),
        key_hash: await sha256(secret),
      });
      if (error) throw error;
      setCreated(secret);
      setName("");
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create key");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    const { error } = await supabase.from("api_keys").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Key revoked");
    queryClient.invalidateQueries({ queryKey: ["api-keys"] });
  }

  const rows = data ?? [];

  return (
    <AppShell title="API keys" description="Programmatic access to your TrustLens account">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="glass rounded-3xl p-6 sm:p-8">
          <h2 className="text-base font-semibold tracking-tight">Create a key</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            The secret is shown once at creation. Only a hash is stored.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="key-name">Key name</Label>
              <Input
                id="key-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Production backend"
              />
            </div>
            <Button variant="hero" onClick={create} disabled={busy || !name.trim()}>
              <Plus className="h-4 w-4" />
              Create key
            </Button>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 sm:p-8">
          <h2 className="text-base font-semibold tracking-tight">Your keys</h2>
          <div className="mt-5 divide-y divide-border">
            {isLoading && [0, 1].map((i) => <Skeleton key={i} className="my-3 h-12 w-full" />)}
            {!isLoading && rows.length === 0 && (
              <div className="grid place-items-center gap-2 py-10 text-center">
                <KeyRound className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No API keys yet.</p>
              </div>
            )}
            {rows.map((k) => (
              <div key={k.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{k.name}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {k.key_prefix}••••••••••••••••
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    Created {formatDateTime(k.created_at)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Revoke ${k.name}`}
                  onClick={() => revoke(k.id)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
          The public REST API is on the roadmap. Keys created today are reserved for your account and
          can be revoked at any time.
        </p>
      </div>

      <Dialog open={!!created} onOpenChange={() => setCreated(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy your API key</DialogTitle>
            <DialogDescription>
              This is the only time the full key will be shown. Store it somewhere safe.
            </DialogDescription>
          </DialogHeader>
          <code className="block break-all rounded-2xl border border-border bg-surface/70 p-4 font-mono text-xs">
            {created}
          </code>
          <DialogFooter>
            <Button
              variant="hero"
              onClick={() => {
                if (created) navigator.clipboard.writeText(created);
                toast.success("Copied to clipboard");
                setCreated(null);
              }}
            >
              <Copy className="h-4 w-4" />
              Copy and close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
