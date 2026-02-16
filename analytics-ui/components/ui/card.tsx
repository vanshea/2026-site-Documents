import { PropsWithChildren } from "react";

type CardProps = PropsWithChildren<{
  className?: string;
}>;

export function Card({ className = "", children }: CardProps) {
  return (
    <section
      className={`rounded-xl border border-border bg-panel p-4 shadow-card md:p-5 ${className}`.trim()}
    >
      {children}
    </section>
  );
}
