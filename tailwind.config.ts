import type { Config } from "tailwindcss";

/**
 * PixRecall theme — early-2000s Flash-era palette, clean.
 * "Drool" cyan is the brand accent (ties to the drooling-cat meme);
 * green/red/yellow are gameplay feedback colors.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#cfccbe", // pale warm grey background
        panel: "#e7e4d7", // lighter raised panel
        ink: "#181820", // near-black text
        drool: "#2bb6e6", // brand accent (the drool)
        droolDeep: "#1d86b8",
        good: "#3ec45a", // correct
        bad: "#e94b4b", // wrong
        warn: "#f4c20d", // streak / caution
        bevelLight: "#fffdf5",
        bevelDark: "#8b8675",
      },
      fontFamily: {
        pixel: ["var(--font-pixel)", "monospace"],
        term: ["var(--font-term)", "monospace"],
      },
      boxShadow: {
        bevel: "inset 2px 2px 0 0 var(--tw-shadow-color), inset -2px -2px 0 0 #8b8675",
        bevelIn: "inset -2px -2px 0 0 #fffdf5, inset 2px 2px 0 0 #8b8675",
      },
      keyframes: {
        flashGood: {
          "0%": { backgroundColor: "rgba(62,196,90,0.9)" },
          "100%": { backgroundColor: "rgba(62,196,90,0)" },
        },
        flashBad: {
          "0%": { backgroundColor: "rgba(233,75,75,0.9)" },
          "100%": { backgroundColor: "rgba(233,75,75,0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        pop: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "60%": { transform: "scale(1.15)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        blink: {
          "0%,49%": { opacity: "1" },
          "50%,100%": { opacity: "0.25" },
        },
      },
      animation: {
        flashGood: "flashGood 450ms ease-out forwards",
        flashBad: "flashBad 450ms ease-out forwards",
        marquee: "marquee 30s linear infinite",
        pop: "pop 300ms ease-out forwards",
        blink: "blink 1s step-end infinite",
      },
    },
  },
  plugins: [],
};

export default config;
