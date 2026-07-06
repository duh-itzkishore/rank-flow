import type { ReactNode } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

/**
 * A premium section wrapper with built-in scroll reveal animations
 * and modern color systems (dark, light, muted).
 */
export function Section({
  id,
  children,
  tone = "light",
  className = "",
  stagger = false,
}: {
  id?: string;
  children: ReactNode;
  tone?: "dark" | "light" | "muted";
  className?: string;
  stagger?: boolean;
}) {
  const { ref, isIntersecting } = useScrollReveal(0.05);

  const bgClass =
    tone === "dark"
      ? "bg-[#07070a] text-white"
      : tone === "muted"
      ? "bg-[#f8f8fa] text-gray-900"
      : "bg-white text-gray-900";

  return (
    <section
      id={id}
      ref={ref as any}
      className={`relative overflow-hidden py-20 sm:py-28 transition-colors duration-500 ${bgClass} ${
        stagger ? "reveal-stagger" : "reveal-on-scroll"
      } ${isIntersecting ? "revealed" : ""} ${className}`}
    >
      {children}
    </section>
  );
}

export function SectionKicker({
  number,
  label,
}: {
  number?: string;
  label: string;
}) {
  return (
    <div className="flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-indigo-600 mb-3">
      {number && <span className="font-mono text-indigo-600/70">{number}</span>}
      {number && <span className="h-1 w-1 rounded-full bg-indigo-600/50" />}
      <span>{label}</span>
    </div>
  );
}

export function DisplayHeading({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={`text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-current leading-[1.1] ${className}`}
    >
      {children}
    </h2>
  );
}
