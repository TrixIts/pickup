import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

/** Inline spinner icon */
export function Spinner({ className, size = "md" }: SpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin text-emerald-500", sizeClasses[size], className)}
    />
  );
}

/** Full-page centered spinner */
export function PageSpinner({ label }: { label?: string }) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <Spinner size="md" />
      {label && <p className="text-zinc-500 font-medium">{label}</p>}
    </div>
  );
}

/** Inline centered spinner for content areas */
export function ContentSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <Spinner size="md" />
      {label && <p className="text-zinc-500 font-medium">{label}</p>}
    </div>
  );
}
