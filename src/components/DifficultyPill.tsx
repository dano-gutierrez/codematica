import type { Difficulty } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

const labels: Record<Difficulty, string> = {
  foundation: "Foundation",
  practitioner: "Practitioner",
  senior: "Senior",
  principal: "Principal",
};

const styles: Record<Difficulty, string> = {
  foundation: "border-[#9cc7ff] bg-[#edf5ff] text-[#245fba]",
  practitioner: "border-[#6dd8cf] bg-[#e8f8f6] text-[#007c78]",
  senior: "border-[#f7cf5d] bg-[#fff5d6] text-[#7a5200]",
  principal: "border-[#c8b8ff] bg-[#f3efff] text-[#5840b8]",
};

export function DifficultyPill({ difficulty, className }: { difficulty: Difficulty; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-lg border-2 border-b-4 px-2.5 py-1 text-xs font-extrabold", styles[difficulty], className)}>
      {labels[difficulty]}
    </span>
  );
}
