interface Props {
  value: string;
  color?: string;
  className?: string;
}

/** Old-school glowing digital readout (static value). */
export function SevenSegment({ value, color = "#3ec45a", className = "" }: Props) {
  return (
    <span
      className={`font-term inline-block border-2 border-ink bg-[#0c0e0b] px-2 py-0.5 leading-none ${className}`}
      style={{ color, textShadow: `0 0 6px ${color}aa`, letterSpacing: "0.08em" }}
    >
      {value}
    </span>
  );
}
