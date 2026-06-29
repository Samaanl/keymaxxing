interface Props {
  count: number; // 0..3
  size?: string; // tailwind text size class
  className?: string;
}

export function Stars({ count, size = "text-lg", className = "" }: Props) {
  return (
    <span className={`font-term ${size} ${className}`} aria-label={`${count} of 3 stars`}>
      <span className="text-warn">{"★".repeat(Math.max(0, count))}</span>
      <span className="text-bevelDark">{"☆".repeat(Math.max(0, 3 - count))}</span>
    </span>
  );
}
