import type { ReactElement } from "react";

interface Props {
  text: string | ReactElement;
  variant?: "4xl" | "default" | "xl" | "6xl" | "8xl";
  className?: string;
}

export default function Title({ text, variant = "default", className }: Props) {
  const variant_style: string =
    variant == "4xl"
      ? "text-4xl"
      : variant == "xl"
        ? "text-xl"
        : variant == "6xl"
          ? "text-6xl"
          : variant == "8xl"
            ? "text-8xl"
            : "text-2xl";
  return (
    <div className={`p-2 ${className}`}>
      <div className={`${variant_style} uppercase font-bold `}>{text}</div>
    </div>
  );
}
