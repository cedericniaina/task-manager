import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <article className={`rounded-xl border border-secondary bg-light shadow-sm ${className}`}>
      {children}
    </article>
  );
}
