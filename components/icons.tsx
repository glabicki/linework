// Figma Icon / chevron-left, chevron-right, share (24 × 24, 2px strokes)
const PATHS = {
  left: "M15 5l-7 7 7 7",
  right: "M9 5l7 7-7 7",
  share: "M12 3v12M7.5 7.5L12 3l4.5 4.5M5 11v9h14v-9",
  close: "M6 6l12 12M18 6L6 18",
};
export function Icon({ name, size = 24 }: { name: keyof typeof PATHS; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d={PATHS[name]} fill="none" stroke="currentColor" strokeWidth={name === "share" ? 1.6 : 2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
