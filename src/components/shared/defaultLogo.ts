// Fallback crest shown when a team has no logoUrl yet — ported from scores.html.
// White strokes, meant for the transparent/dark badge backgrounds used in
// MainBug and HTFTScreen.
export const DEFAULT_TEAM_LOGO =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><polygon points='50,15 80,35 80,65 50,85 20,65 20,35' fill='none' stroke='%23ffffff' stroke-width='6'/><polygon points='50,15 50,50 80,65' fill='none' stroke='%23ffffff' stroke-width='6'/><polygon points='50,15 50,50 20,65' fill='none' stroke='%23ffffff' stroke-width='6'/><line x1='50' y1='50' x2='50' y2='85' stroke='%23ffffff' stroke-width='6'/></svg>";

// Same crest, dark strokes — for the solid-white badge background used in
// LineupsScreen (matching the reference's flag-badge treatment). The white
// version is invisible there since it's white-on-white.
export const DEFAULT_TEAM_LOGO_DARK =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><polygon points='50,15 80,35 80,65 50,85 20,65 20,35' fill='none' stroke='%231a1a1a' stroke-width='6'/><polygon points='50,15 50,50 80,65' fill='none' stroke='%231a1a1a' stroke-width='6'/><polygon points='50,15 50,50 20,65' fill='none' stroke='%231a1a1a' stroke-width='6'/><line x1='50' y1='50' x2='50' y2='85' stroke='%231a1a1a' stroke-width='6'/></svg>";
