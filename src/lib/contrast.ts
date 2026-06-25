// WCAG 2.1 contrast utilities.
// Decision criterion: 4.5:1 ratio (WCAG AA for normal text).

function linearize(channel: number): number {
  const s = channel / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const r = linearize(parseInt(hex.slice(1, 3), 16));
  const g = linearize(parseInt(hex.slice(3, 5), 16));
  const b = linearize(parseInt(hex.slice(5, 7), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const WCAG_AA = 4.5;

// Returns #ffffff or #000000.
// Primary criterion: whichever meets the WCAG AA 4.5:1 threshold.
// When both pass (or both fail), picks the one with the higher ratio.
export function readableTextColor(bgHex: string): "#ffffff" | "#000000" {
  const onWhite = contrastRatio(bgHex, "#ffffff");
  const onBlack = contrastRatio(bgHex, "#000000");
  const whitePass = onWhite >= WCAG_AA;
  const blackPass = onBlack >= WCAG_AA;

  if (whitePass && !blackPass) return "#ffffff";
  if (blackPass && !whitePass) return "#000000";
  // Both pass or both fail — take the higher ratio.
  return onWhite >= onBlack ? "#ffffff" : "#000000";
}

// Dimmed variant for secondary text (labels, first names).
export function dimTextColor(
  bgHex: string,
  lightAlpha = 0.75,
  darkAlpha = 0.55
): string {
  return readableTextColor(bgHex) === "#ffffff"
    ? `rgba(255,255,255,${lightAlpha})`
    : `rgba(0,0,0,${darkAlpha})`;
}
