type LogoMarkProps = {
  className?: string;
  decorative?: boolean;
};

export function LogoMark({ className = "", decorative = false }: LogoMarkProps) {
  return (
    <img
      src="/choosie-mark.svg"
      alt={decorative ? "" : "Choosie"}
      aria-hidden={decorative || undefined}
      className={className}
    />
  );
}
