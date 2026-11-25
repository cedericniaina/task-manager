import type { LucideIcon } from "lucide-react";
import Card from "./Card";

interface ProgressCardProps {
  label: string;
  value: number;
  total?: number;
  detail?: string;
  icon?: LucideIcon;
  badgeClassName?: string;
}

export default function ProgressCard({
  label,
  value,
  total = 0,
  detail,
  icon: Icon,
  badgeClassName = "bg-primary/10 text-primary",
}: ProgressCardProps) {
  const percentage =
    total > 0 ? Math.min(100, Math.max(0, Math.round((value / total) * 100))) : 0;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClassName}`}>
          {label}
        </span>
        {Icon && <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />}
      </div>
      {detail && <p className="mt-3 text-sm text-foreground/70">{detail}</p>}
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-base"
        role="progressbar"
        aria-label={`${label} : ${percentage}%`}
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
      </div>
      <p className="mt-2 text-right text-xs font-medium text-foreground/60">{percentage}%</p>
    </Card>
  );
}
