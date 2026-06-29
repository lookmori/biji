/**
 * BIJI 设计 Token 常量
 * 与 globals.css 中的 CSS 变量保持同步
 */
export const colors = {
  ink: "#17231F",
  muted: "#65726D",
  paper: "#F7F8F3",
  panel: "#FFFFFF",
  line: "#DCE3DC",
  grid: "#D8DFD8",
  green: "#1F6F54",
  greenDark: "#173E31",
  greenSoft: "#E4F0E9",
  red: "#B94B3F",
  yellow: "#F0C96B",
  heroBg: "#0F1D18",
  featureBg: "#F0F4EF",
} as const;

export const spacing = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
} as const;

export const layout = {
  headerHeight: 72,
  sidebarWidth: 232,
  pageMaxWidth: 1500,
} as const;

export const borderRadius = {
  micro: "2px",
  small: "8px",
  regular: "12px",
  medium: "16px",
  large: "20px",
  xlarge: "24px",
} as const;

export const shadows = {
  s: "0 1px 2px rgba(23,62,49,.08)",
  m: "0 7px 18px rgba(23,62,49,.16)",
  l: "0 14px 40px rgba(37,56,47,.06)",
  xl: "0 18px 55px rgba(31,49,40,.09)",
} as const;
