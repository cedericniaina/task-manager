import type { ReactElement } from "react";
import { Link } from "react-router";

/*
    Comme button mais avec un anchor pour deplacer vers une autre page.
    Params :
    - text
    - link
    - variant
*/
interface Props {
  text: string | ReactElement;
  to: string;
  action?: () => void;
  variant?: "suggestion" | "danger" | "default";
}
export default function LinkButton({ text, to, action, variant }: Props) {
  const style =
    variant == "suggestion"
      ? "text-success"
      : variant == "danger"
        ? "text-error"
        : "";
  return (
    <Link to={to} onClick={action} className={style}>
      {text}
    </Link>
  );
}
