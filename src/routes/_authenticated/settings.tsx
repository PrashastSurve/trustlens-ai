import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { initials, useSession } from "@/lib/use-session";

export const Route = createFileRoute("/_authenticated/settings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Settings — TrustLens AI" },
      { name: "description", content: "Manage your profile, detection sensitivity, alerts and data retention." },
      { property: "og:title", content: "Settings — TrustLens AI" },
      { property: "og:description", content: "Profile, detection sensitivity, alerts and retention." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const settings = useQuery({
    queryKey: ["user-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_settings").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [sensitivity, setSensitivity] = useState(50);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inappAlerts, setInappAlerts] = useState(true);
  const [weekly, setWeekly] = useState(false);
  const [retention, setRetention] = useState(90);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile.data) {
      setFullName(profile.data.full_name ?? "");
      setCompany(profile.data.company ?? "");
    }
  }, [profile.data]);

  useEffect(() => {
    if (settings.data) {
      setSensitivity(settings.data.sensitivity);
      setEmailAlerts(settings.data.email_alerts);
      setInappAlerts(settings.data.inapp_alerts);
      setWeekly(settings.data.weekly_reports);
      setRetention(settings.data.retention_days);
    }
  }, [settings.data]);

  async function saveProfile() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: fullName, company, email: user.email });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  }

  async function saveSettings() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("user_settings").upsert({
      user_id: user.id,
      sensitivity,
      email_alerts: emailAlerts,
      inapp_alerts: inappAlerts,
      weekly_reports: weekly,
      retention_days: retention,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Settings saved");
    queryClient.invalidateQueries({ queryKey: ["user-settings"] });
  }

  return (
    <AppShell title="Settings" description="Profile, detection behaviour and data retention">
      <div className="mx-auto max-w-3xl">
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="detection">Detection</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <div className="glass rounded-3xl p-6 sm:p-8">
              <div className="flex min-w-0 items-center gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl brand-gradient text-base font-semibold text-primary-foreground">
                  {initials(user)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">Signed in</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full name</Label>
                  <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>
              </div>

              <Button variant="hero" className="mt-6" onClick={saveProfile} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save profile
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="detection" className="mt-6">
            <div className="glass rounded-3xl p-6 sm:p-8">
              <h2 className="text-base font-semibold tracking-tight">Detection sensitivity</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Higher sensitivity raises alerts earlier and produces more false positives.
              </p>
              <div className="mt-8">
                <Slider
                  value={[sensitivity]}
                  onValueChange={(v) => setSensitivity(v[0])}
                  min={0}
                  max={100}
                  step={5}
                />
                <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                  <span>Conservative</span>
                  <span className="tabular-nums text-foreground">{sensitivity}</span>
                  <span>Aggressive</span>
                </div>
              </div>
              <Button variant="hero" className="mt-8" onClick={saveSettings} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save settings
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <div className="glass rounded-3xl p-6 sm:p-8">
              <div className="divide-y divide-border">
                <ToggleRow
                  label="Email alerts"
                  hint="Send an email when a session is flagged as high risk."
                  checked={emailAlerts}
                  onChange={setEmailAlerts}
                />
                <ToggleRow
                  label="In-app alerts"
                  hint="Show live alerts in the console during analysis."
                  checked={inappAlerts}
                  onChange={setInappAlerts}
                />
                <ToggleRow
                  label="Weekly summary"
                  hint="A digest of sessions and average trust score each Monday."
                  checked={weekly}
                  onChange={setWeekly}
                />
              </div>
              <Button variant="hero" className="mt-6" onClick={saveSettings} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save settings
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="data" className="mt-6">
            <div className="glass rounded-3xl p-6 sm:p-8">
              <h2 className="text-base font-semibold tracking-tight">Retention</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                How long sessions, detections and reports are kept in your account.
              </p>
              <div className="mt-6 max-w-[200px] space-y-2">
                <Label htmlFor="retention">Days</Label>
                <Input
                  id="retention"
                  type="number"
                  min={1}
                  max={3650}
                  value={retention}
                  onChange={(e) => setRetention(Number(e.target.value))}
                />
              </div>
              <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">
                Video frames are never uploaded or stored. Only numeric scores, detections and report
                metadata are persisted against your account.
              </p>
              <Button variant="hero" className="mt-6" onClick={saveSettings} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save settings
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
