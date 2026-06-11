import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

export function ControlsLegend() {
  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-6 text-muted-foreground/80">
      <Hint icon={<ChevronUp className="w-5 h-5" />} label="Jump" />
      <Hint icon={<ChevronLeft className="w-5 h-5" />} label="Left" />
      <Hint icon={<ChevronDown className="w-5 h-5" />} label="Slide" />
      <Hint icon={<ChevronRight className="w-5 h-5" />} label="Right" />
    </div>
  );
}

function Hint({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-primary/80">{icon}</div>
      <span className="text-[10px] font-cinzel uppercase tracking-wider">{label}</span>
    </div>
  );
}
