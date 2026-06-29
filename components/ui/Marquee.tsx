/* eslint-disable @next/next/no-img-element */

/** Decorative scrolling strip of tiny cat tiles. Purely cosmetic. */
export function Marquee({ srcs }: { srcs: string[] }) {
  const row = [...srcs, ...srcs, ...srcs, ...srcs];
  const doubled = [...row, ...row];
  return (
    <div className="pointer-events-none relative w-full select-none overflow-hidden opacity-25" aria-hidden>
      <div className="flex w-max animate-marquee gap-2">
        {doubled.map((s, i) => (
          <img
            key={i}
            src={s}
            alt=""
            className="h-12 w-12 border border-ink object-cover"
            style={{ imageRendering: "pixelated" }}
          />
        ))}
      </div>
    </div>
  );
}
