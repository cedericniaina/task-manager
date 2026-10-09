import type { ReactElement } from "react";

/*
    Button simple avec :
    - text
    - Action
    - variant
*/
interface Props {
  text: string | ReactElement;
  variant?: "success" | "error" | "warning" | "accent";
  type?: "submit" | "reset" | "button";
  action?: () => void;
  actionBlur?: () => void;
  className?: string;
  disabled?: boolean;
}
export default function Button({
  text,
  variant,
  type,
  action,
  actionBlur,
  className,
  disabled,
}: Props) {
  const style =
    variant == "accent"
      ? "bg-accent"
      : variant == "error"
        ? "bg-error"
        : variant == "success"
          ? "bg-success"
          : variant == "warning"
            ? "bg-warning"
            : "";
  return (
    <button
      onClick={action}
      className={`py-2 px-5 my-2 ${style} rounded disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      type={type}
      onBlur={actionBlur}
      disabled={disabled}
    >
      {text}
    </button>
  );
}
