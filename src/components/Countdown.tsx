import { useEffect, useState } from "react";

interface Props {
  date: Date;
}

function diff(target: Date) {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) {
    return { d: 0, h: 0, m: 0, s: 0 };
  }
  const s = Math.floor(ms / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

export function Countdown({ date }: Props) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Force immediate recalc on mount to avoid flash of --
    setT(diff(date));
    const id = setInterval(() => setT(diff(date)), 1000);
    return () => clearInterval(id);
  }, [date]);

  const Tile = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card/40 p-3">
      <div className="font-display text-2xl font-semibold tabular-nums tracking-tight text-foreground sm:text-3xl">
        {mounted ? String(value).padStart(2, "0") : "00"}
      </div>
      <div className="mt-1 text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Countdown
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          <Tile value={t.d} label="Days" />
          <Tile value={t.h} label="Hrs" />
          <Tile value={t.m} label="Min" />
          <Tile value={t.s} label="Sec" />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4 text-xs font-medium text-muted-foreground">
        <span>Target Election Date</span>
        <span className="text-foreground">
          {date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}
