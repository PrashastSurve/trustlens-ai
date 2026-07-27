export type SignalKey = "blink" | "lipsync" | "lighting" | "landmarks" | "head" | "voice";

export interface SignalDef {
  key: SignalKey;
  label: string;
  description: string;
}

export const SIGNALS: SignalDef[] = [
  { key: "landmarks", label: "Facial landmarks", description: "Geometric stability of 468 tracked points" },
  { key: "blink", label: "Blink cadence", description: "Natural blink rate and eyelid dynamics" },
  { key: "lipsync", label: "Lip sync", description: "Alignment between mouth motion and audio envelope" },
  { key: "lighting", label: "Lighting coherence", description: "Consistency of illumination across the face" },
  { key: "head", label: "Head movement", description: "Micro-motion and parallax realism" },
  { key: "voice", label: "Voice characteristics", description: "Spectral naturalness of the speaker" },
];

export type RiskLevel = "low" | "medium" | "high";

export function riskFromScore(score: number): RiskLevel {
  if (score >= 75) return "low";
  if (score >= 50) return "medium";
  return "high";
}

export function riskLabel(level: RiskLevel): string {
  return level === "low" ? "Low risk" : level === "medium" ? "Elevated risk" : "High risk";
}

export function riskToneClass(level: RiskLevel): string {
  return level === "low"
    ? "text-success"
    : level === "medium"
      ? "text-warning"
      : "text-danger";
}

export function riskBadgeClass(level: RiskLevel): string {
  return level === "low"
    ? "bg-success/10 text-success border-success/25"
    : level === "medium"
      ? "bg-warning/10 text-warning border-warning/25"
      : "bg-danger/10 text-danger border-danger/25";
}

export function explain(score: number, weakest: { label: string; score: number }[]): string {
  const level = riskFromScore(score);
  const weak = weakest
    .slice(0, 2)
    .map((s) => s.label.toLowerCase())
    .join(" and ");

  if (level === "low") {
    return `Observed signals are consistent with a live human participant. Landmark geometry, blink cadence and illumination all track within expected natural ranges. The lowest-scoring signals were ${weak}, but neither crossed the alert threshold. This is an assistance signal, not a verification of identity.`;
  }
  if (level === "medium") {
    return `Several signals drifted outside typical human ranges during this session, most notably ${weak}. This can be caused by poor lighting, low bandwidth or heavy compression as well as synthetic media. Treat the result as a prompt for additional verification rather than a conclusion.`;
  }
  return `Multiple independent signals disagree with a natural capture, led by ${weak}. Patterns like these are commonly produced by face-swap or re-enactment pipelines, but can also come from severe frame drops. Recommend an out-of-band identity check before continuing the conversation.`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
