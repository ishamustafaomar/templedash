interface Props { lane: number; angle: number; }

export function TiltIndicator({ lane, angle }: Props) {
  return (
    <div className="absolute bottom-6 left-6 z-20 flex flex-col items-center gap-2 rounded-2xl bg-black/40 backdrop-blur-md border border-border px-3 py-2">
      <div className="flex gap-2">
        {[0,1,2].map(i => (
          <div key={i} className={`w-3 h-3 rounded-full ${i === lane ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>
      <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden relative">
        <div
          className="absolute top-0 h-full w-1.5 bg-primary"
          style={{ left: `${50 + Math.max(-50, Math.min(50, angle * 2))}%`, transform: "translateX(-50%)" }}
        />
      </div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Tilt</div>
    </div>
  );
}
