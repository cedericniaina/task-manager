import Title from "../Title";

interface Props {
  className?: string;
  variant?: "4xl" | "default" | "xl" | "6xl" | "8xl";
}

export default function LogoTaskManager({ className, variant }: Props) {
  return (
    <Title
      text={
        <>
          <span className="text-primary">Task-</span>
          <span className="text-secondary">Manager</span>
        </>
      }
      className={className}
      variant={variant}
    ></Title>
  );
}
