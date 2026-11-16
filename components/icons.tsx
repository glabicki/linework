// Figma Icon / chevron-left, chevron-right, share, plus the Account row icons (24 × 24)
const PATHS = {
  left: "M15 5l-7 7 7 7",
  right: "M9 5l7 7-7 7",
  share: "M12 3v12M7.5 7.5L12 3l4.5 4.5M5 11v9h14v-9",
  close: "M6 6l12 12M18 6L6 18",
  // Account rows (1.6px, like share)
  save: "M12 4v11M7.5 10.5L12 15l4.5-4.5M5 15v5h14v-5",
  restore: "M4.5 13a7.5 7.5 0 1 0 2.2-6.3M4.5 4v4.5H9",
  grid: "M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z",
  bell: "M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5zM10 20.5h4",
  table: "M4 5h16v14H4zM4 10h16M4 14.5h16M10 5v14",
  lock: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  trash: "M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10.5 11v5M13.5 11v5",
};
const THIN = new Set(["share", "save", "restore", "grid", "bell", "table", "lock", "trash"]);
export function Icon({ name, size = 24 }: { name: keyof typeof PATHS; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d={PATHS[name]} fill="none" stroke="currentColor" strokeWidth={THIN.has(name) ? 1.6 : 2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
