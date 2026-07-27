import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CameraOff, Loader2, Play, Save, Square, Video } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { TrustGauge } from "@/components/app/TrustGauge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import {
  SIGNALS,
  explain,
  formatDuration,
  riskBadgeClass,
  riskFromScore,
  riskLabel,
  type SignalKey,
} from "@/lib/trustlens";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/live")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Live analysis — TrustLens AI" },
      { name: "description", content: "Run real-time authenticity analysis on a live camera feed." },
      { property: "og:title", content: "Live analysis — TrustLens AI" },
      { property: "og:description", content: "Real-time authenticity analysis on a live camera feed." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LiveAnalysis,
});

type Scores = Record<SignalKey, number>;

const initialScores: Scores = {
  landmarks: 0,
  blink: 0,
  lipsync: 0,
  lighting: 0,
  head: 0,
  voice: 0,
};

interface Alert {
  id: string;
  atMs: number;
  signal: SignalKey;
  score: number;
  severity: "info" | "warning" | "critical";
  message: string;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function LiveAnalysis() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const prevFrame = useRef<Uint8ClampedArray | null>(null);
  const prevMouth = useRef<number>(0);
  const historyRef = useRef<{ motion: number[]; mouth: number[]; audio: number[] }>({
    motion: [],
    mouth: [],
    audio: [],
  });
  const scoresRef = useRef<Scores>(initialScores);
  const startedAt = useRef<number>(0);

  const [status, setStatus] = useState<"idle" | "starting" | "running" | "stopped">("idle");
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<Scores>(initialScores);
  const [trust, setTrust] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [title, setTitle] = useState("Live session");
  const [participant, setParticipant] = useState("");
  const [saving, setSaving] = useState(false);

  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, []);

  useEffect(() => () => stop(), [stop]);

  async function start() {
    setError(null);
    setStatus("starting");
    setAlerts([]);
    prevFrame.current = null;
    historyRef.current = { motion: [], mouth: [], audio: [] };
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx && stream.getAudioTracks().length) {
        const ctx = new AudioCtx();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        src.connect(analyser);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
      }
      startedAt.current = Date.now();
      setElapsed(0);
      setStatus("running");
    } catch (err) {
      setStatus("idle");
      setError(
        err instanceof Error && err.name === "NotAllowedError"
          ? "Camera access was blocked. Allow camera and microphone permissions, then try again."
          : "Could not access a camera on this device.",
      );
    }
  }

  function end() {
    stop();
    setStatus("stopped");
  }

  // Analysis loop
  useEffect(() => {
    if (status !== "running") return;
    let raf = 0;
    let last = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < 180) return;
      last = now;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;
      const w = 160;
      const h = 120;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, w, h);
      const frame = ctx.getImageData(0, 0, w, h).data;

      // luminance grid
      const lum = new Float32Array(w * h);
      for (let i = 0, p = 0; i < frame.length; i += 4, p++) {
        lum[p] = (frame[i] * 0.2126 + frame[i + 1] * 0.7152 + frame[i + 2] * 0.0722) / 255;
      }

      // region means for lighting coherence (left / right / top / bottom of central face box)
      const region = (x0: number, y0: number, x1: number, y1: number) => {
        let sum = 0;
        let n = 0;
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            sum += lum[y * w + x];
            n++;
          }
        }
        return n ? sum / n : 0;
      };
      const fx0 = Math.round(w * 0.3);
      const fx1 = Math.round(w * 0.7);
      const fy0 = Math.round(h * 0.18);
      const fy1 = Math.round(h * 0.82);
      const left = region(fx0, fy0, Math.round((fx0 + fx1) / 2), fy1);
      const right = region(Math.round((fx0 + fx1) / 2), fy0, fx1, fy1);
      const top = region(fx0, fy0, fx1, Math.round((fy0 + fy1) / 2));
      const bottom = region(fx0, Math.round((fy0 + fy1) / 2), fx1, fy1);
      const faceMean = region(fx0, fy0, fx1, fy1);

      // temporal motion
      let motion = 0;
      let eyeMotion = 0;
      let mouthMotion = 0;
      if (prevFrame.current) {
        const prev = prevFrame.current;
        for (let y = fy0; y < fy1; y += 2) {
          for (let x = fx0; x < fx1; x += 2) {
            const i = (y * w + x) * 4;
            const d = Math.abs(frame[i] - prev[i]) / 255;
            motion += d;
            if (y > fy0 + (fy1 - fy0) * 0.2 && y < fy0 + (fy1 - fy0) * 0.42) eyeMotion += d;
            if (y > fy0 + (fy1 - fy0) * 0.6) mouthMotion += d;
          }
        }
        const cells = ((fy1 - fy0) / 2) * ((fx1 - fx0) / 2);
        motion /= cells;
        eyeMotion /= cells * 0.22;
        mouthMotion /= cells * 0.4;
      }
      prevFrame.current = new Uint8ClampedArray(frame);

      // audio energy
      let audio = 0;
      if (analyserRef.current) {
        const buf = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        audio = Math.sqrt(sum / buf.length);
      }

      const hist = historyRef.current;
      hist.motion.push(motion);
      hist.mouth.push(mouthMotion);
      hist.audio.push(audio);
      if (hist.motion.length > 60) {
        hist.motion.shift();
        hist.mouth.shift();
        hist.audio.shift();
      }

      const faceDetected = faceMean > 0.06 && faceMean < 0.98;

      // ---- signal scoring (heuristic, browser-side) ----
      const lightingDelta = Math.abs(left - right) + Math.abs(top - bottom) * 0.5;
      const lighting = clamp(100 - lightingDelta * 220);

      const motionMean = hist.motion.reduce((a, b) => a + b, 0) / Math.max(1, hist.motion.length);
      const motionVar =
        hist.motion.reduce((a, b) => a + (b - motionMean) ** 2, 0) / Math.max(1, hist.motion.length);
      // natural head motion is present but not extreme, and varies over time
      const head = clamp(
        100 - Math.abs(motionMean - 0.035) * 900 - (motionVar < 0.000004 ? 30 : 0),
      );

      // landmark stability proxy: face present + bounded frame-to-frame deformation
      const landmarks = faceDetected ? clamp(100 - Math.max(0, motionMean - 0.09) * 700) : 22;

      // blink proxy: periodic spikes in eye-region motion
      const blinkSpike = eyeMotion > motionMean * 1.8 ? 1 : 0;
      const blinkScore = clamp(72 + blinkSpike * 22 + (motionVar > 0.000008 ? 8 : -8));

      // lip sync proxy: correlation of mouth motion with audio energy
      const n = hist.mouth.length;
      let corr = 0;
      if (n > 8) {
        const mMean = hist.mouth.reduce((a, b) => a + b, 0) / n;
        const aMean = hist.audio.reduce((a, b) => a + b, 0) / n;
        let num = 0;
        let dm = 0;
        let da = 0;
        for (let i = 0; i < n; i++) {
          const x = hist.mouth[i] - mMean;
          const y = hist.audio[i] - aMean;
          num += x * y;
          dm += x * x;
          da += y * y;
        }
        corr = dm > 0 && da > 0 ? num / Math.sqrt(dm * da) : 0;
      }
      const speaking = hist.audio.some((a) => a > 0.02);
      const lipsync = clamp(speaking ? 55 + corr * 45 : 84);
      prevMouth.current = mouthMotion;

      // voice naturalness proxy: energy dynamics present, not flat or clipped
      const aMax = Math.max(...hist.audio, 0);
      const voice = clamp(analyserRef.current ? (aMax > 0.005 ? 80 + corr * 12 : 74) : 60);

      const next: Scores = { landmarks, blink: blinkScore, lipsync, lighting, head, voice };
      // smooth
      const prevScores = scoresRef.current;
      const smoothed = Object.fromEntries(
        (Object.keys(next) as SignalKey[]).map((k) => [
          k,
          prevScores[k] === 0 ? next[k] : Math.round(prevScores[k] * 0.75 + next[k] * 0.25),
        ]),
      ) as Scores;
      scoresRef.current = smoothed;
      setScores(smoothed);

      const weights: Record<SignalKey, number> = {
        landmarks: 0.26,
        blink: 0.14,
        lipsync: 0.2,
        lighting: 0.16,
        head: 0.14,
        voice: 0.1,
      };
      const fused = clamp(
        (Object.keys(smoothed) as SignalKey[]).reduce((a, k) => a + smoothed[k] * weights[k], 0),
      );
      setTrust(fused);

      const at = Date.now() - startedAt.current;
      setElapsed(Math.floor(at / 1000));

      // alerts
      (Object.keys(smoothed) as SignalKey[]).forEach((k) => {
        if (smoothed[k] >= 55) return;
        setAlerts((prev) => {
          const recent = prev.find((a) => a.signal === k && at - a.atMs < 12000);
          if (recent) return prev;
          const def = SIGNALS.find((s) => s.key === k)!;
          return [
            {
              id: `${k}-${at}`,
              atMs: at,
              signal: k,
              score: smoothed[k],
              severity: (smoothed[k] < 40 ? "critical" : "warning") as Alert["severity"],
              message: `${def.label} dropped to ${smoothed[k]}`,
            },
            ...prev,
          ].slice(0, 40);
        });
      });
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status]);

  async function save() {
    if (!user) return;
    setSaving(true);
    try {
      const level = riskFromScore(trust);
      const { data: session, error } = await supabase
        .from("analysis_sessions")
        .insert({
          user_id: user.id,
          title: title || "Live session",
          participant: participant || null,
          trust_score: trust,
          risk_level: level,
          status: "completed",
          duration_seconds: elapsed,
          started_at: new Date(startedAt.current).toISOString(),
          ended_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;

      const rows = (Object.keys(scores) as SignalKey[]).map((k) => ({
        user_id: user.id,
        session_id: session.id,
        signal: k,
        score: scores[k],
        severity: scores[k] < 50 ? "critical" : scores[k] < 75 ? "warning" : "info",
        at_ms: elapsed * 1000,
        message: SIGNALS.find((s) => s.key === k)?.description ?? null,
      }));
      const alertRows = alerts.map((a) => ({
        user_id: user.id,
        session_id: session.id,
        signal: a.signal,
        score: a.score,
        severity: a.severity,
        at_ms: a.atMs,
        message: a.message,
      }));
      const { error: detErr } = await supabase.from("detections").insert([...rows, ...alertRows]);
      if (detErr) throw detErr;

      const weakest = (Object.keys(scores) as SignalKey[])
        .map((k) => ({ label: SIGNALS.find((s) => s.key === k)!.label, score: scores[k] }))
        .sort((a, b) => a.score - b.score);

      const { error: repErr } = await supabase.from("reports").insert({
        user_id: user.id,
        session_id: session.id,
        title: `${title || "Live session"} — authenticity report`,
        risk_score: trust,
        risk_level: level,
        summary: explain(trust, weakest),
        recommendation:
          level === "low"
            ? "No further verification required. Retain this report for your records."
            : level === "medium"
              ? "Request a secondary verification factor before acting on this call."
              : "Do not act on requests from this call. Verify identity out of band immediately.",
      });
      if (repErr) throw repErr;

      await queryClient.invalidateQueries();
      toast.success("Session saved", { description: "Report generated in Reports." });
      navigate({ to: "/sessions" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save session");
    } finally {
      setSaving(false);
    }
  }

  const level = riskFromScore(trust);
  const weakest = (Object.keys(scores) as SignalKey[])
    .map((k) => ({ label: SIGNALS.find((s) => s.key === k)!.label, score: scores[k] }))
    .sort((a, b) => a.score - b.score);

  return (
    <AppShell
      title="Live analysis"
      description="Real-time authenticity assessment of the active camera feed"
      actions={
        status === "running" ? (
          <Button variant="destructive" onClick={end}>
            <Square className="h-4 w-4" />
            End session
          </Button>
        ) : (
          <Button variant="hero" onClick={start} disabled={status === "starting"}>
            {status === "starting" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {status === "stopped" ? "Start again" : "Start analysis"}
          </Button>
        )
      }
    >
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <div className="glass overflow-hidden rounded-3xl p-4 sm:p-6">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest",
                    status === "running"
                      ? "bg-danger/10 text-danger"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      status === "running" ? "animate-pulse bg-danger" : "bg-muted-foreground",
                    )}
                  />
                  {status === "running" ? "Live" : status === "stopped" ? "Ended" : "Idle"}
                </span>
              </div>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {formatDuration(elapsed)}
              </span>
            </div>

            <div className="relative mt-5 aspect-video overflow-hidden rounded-2xl border border-border bg-background">
              <video
                ref={videoRef}
                muted
                playsInline
                className={cn(
                  "h-full w-full scale-x-[-1] object-cover transition-opacity",
                  status === "running" ? "opacity-100" : "opacity-40",
                )}
              />
              <canvas ref={canvasRef} className="hidden" />

              {status === "running" && (
                <>
                  <div className="pointer-events-none absolute left-1/2 top-1/2 h-[64%] w-[40%] -translate-x-1/2 -translate-y-1/2 rounded-[46%] border-2 border-primary/70" />
                  <div className="pointer-events-none absolute inset-x-0 top-1/2 h-24 animate-scan bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
                  <div className="pointer-events-none absolute bottom-4 left-4 rounded-xl glass px-3 py-2 text-xs">
                    Analyzing · {SIGNALS.length} signals
                  </div>
                </>
              )}

              {status !== "running" && (
                <div className="absolute inset-0 grid place-content-center gap-3 text-center">
                  {error ? (
                    <>
                      <CameraOff className="mx-auto h-8 w-8 text-danger" />
                      <p className="max-w-xs px-6 text-sm text-muted-foreground">{error}</p>
                    </>
                  ) : (
                    <>
                      <Video className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="max-w-xs px-6 text-sm text-muted-foreground">
                        {status === "stopped"
                          ? "Session ended. Save it to generate a report."
                          : "Start the analysis to grant camera access and begin scoring."}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {SIGNALS.map((s) => {
                const v = scores[s.key];
                return (
                  <div key={s.key} className="rounded-2xl border border-border bg-surface/60 p-4">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                      <p className="truncate text-sm font-medium">{s.label}</p>
                      <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{v}</span>
                    </div>
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          v >= 75 ? "bg-success" : v >= 50 ? "bg-warning" : "bg-danger",
                        )}
                        style={{ width: `${v}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                      {s.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass grid place-items-center rounded-3xl p-6">
            <TrustGauge value={trust} size={210} />
            <span
              className={cn(
                "mt-3 rounded-full border px-3 py-1 text-[11px] font-medium",
                riskBadgeClass(level),
              )}
            >
              {riskLabel(level)}
            </span>
          </div>

          <div className="glass rounded-3xl p-6">
            <h2 className="text-sm font-semibold">AI explanation</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {trust === 0
                ? "Start a session to generate a live assessment."
                : explain(trust, weakest)}
            </p>
          </div>

          <div className="glass rounded-3xl p-6">
            <h2 className="text-sm font-semibold">Alert timeline</h2>
            <div className="mt-4 max-h-64 space-y-2.5 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {alerts.length === 0 && (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    No alerts raised yet.
                  </p>
                )}
                {alerts.map((a) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border px-3.5 py-2.5",
                      a.severity === "critical"
                        ? "border-danger/25 bg-danger/10"
                        : "border-warning/25 bg-warning/10",
                    )}
                  >
                    <AlertTriangle
                      className={cn(
                        "h-4 w-4 shrink-0",
                        a.severity === "critical" ? "text-danger" : "text-warning",
                      )}
                    />
                    <p className="truncate text-xs">{a.message}</p>
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      {formatDuration(a.atMs / 1000)}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {status === "stopped" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-3xl p-6"
            >
              <h2 className="text-sm font-semibold">Save this session</h2>
              <div className="mt-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="s-title">Session title</Label>
                  <Input id="s-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-part">Participant (optional)</Label>
                  <Input
                    id="s-part"
                    value={participant}
                    onChange={(e) => setParticipant(e.target.value)}
                    placeholder="Name or reference"
                  />
                </div>
                <Button variant="hero" className="w-full" onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save & generate report
                </Button>
              </div>
            </motion.div>
          )}

          <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
            TrustLens produces an AI-assisted risk assessment from observable capture signals. It is
            not proof of identity or intent. Video frames are analyzed in your browser and are never
            uploaded — only scores and metadata are saved.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
