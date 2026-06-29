import type { HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
}

export function BevelPanel({ inset, className = "", children, ...rest }: Props) {
  return (
    <div
      {...rest}
      className={[
        inset ? "bevel-in bg-paper" : "bevel bg-panel",
        "border-2 border-ink",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
