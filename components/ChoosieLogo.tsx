type ChoosieLogoProps = {
  size?: "nav" | "hero";
  className?: string;
};

export default function ChoosieLogo({ size = "nav", className = "" }: ChoosieLogoProps) {
  const isHero = size === "hero";

  return (
    <span
      aria-label="Choosie"
      className={[
        "inline-flex items-center",
        isHero ? "w-full max-w-[42rem] justify-center" : "w-[6.75rem] sm:w-[8.5rem]",
        className,
      ].join(" ")}
    >
      <img
        src="/choosie-logo-nav-flat.png"
        alt=""
        aria-hidden="true"
        className={[
          "block h-auto w-full object-contain",
          isHero ? "max-h-64" : "max-h-12",
        ].join(" ")}
      />
    </span>
  );
}
