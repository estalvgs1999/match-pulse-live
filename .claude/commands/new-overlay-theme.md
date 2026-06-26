Create a new broadcast overlay theme for MatchPulse Live.

## Arguments

`$ARGUMENTS` — **theme display name** followed by optional description. Examples:
- `"La Liga" paleta roja y blanca, tipografía condensada, líneas finas`
- `"Copa MX" inspirado en colores azteca/dorado, estilo magazine deportivo`

If the user has attached images in the conversation, read every image provided — they are the primary design reference.

---

## Your job

Design and implement a complete overlay theme: 8 component pairs (TSX + CSS Module), wired into the schema, API, overlay page, and dashboard creation form. The theme must match the visual design from the reference as closely as possible while preserving ALL existing behavior from the Champions template.

---

## Step 0 — Derive the theme key

From the theme name, produce a `themeKey`: lowercase, alphanumeric + hyphens only. Examples:
- "La Liga" → `laliga`
- "Copa MX" → `copamx`
- "Euro 2024" → `euro`

This key is the directory name and schema value.

---

## Step 1 — Analyze design references

If images were provided, read each one carefully and extract:
- **Color palette**: primary background, secondary surfaces, accent/highlight colors, text colors
- **Typography**: font weight, letter-spacing, text-transform, size hierarchy
- **Shape language**: border-radius (sharp/rounded), border styles, dividers
- **Graphic elements**: gradients, textures, patterns, decorative lines or bars
- **Score bug structure**: layout of time | teams | score sections
- **Screen layouts**: how information is organized in full-screen graphics

If no images, use the text description to define the same properties.

---

## Step 2 — Read the reference implementation

Read all Champions template files to understand exact behavior, prop interfaces, and CSS patterns to replicate:

- `src/components/overlay/champions/MainBug.tsx`
- `src/components/overlay/champions/MainBug.module.css`
- `src/components/overlay/champions/HTFTScreen.tsx`
- `src/components/overlay/champions/HTFTScreen.module.css`
- `src/components/overlay/champions/LineupsScreen.tsx`
- `src/components/overlay/champions/LineupsScreen.module.css`
- `src/components/overlay/champions/StandingsScreen.tsx`
- `src/components/overlay/champions/StandingsScreen.module.css`
- `src/components/overlay/champions/StatsScreen.tsx`
- `src/components/overlay/champions/StatsScreen.module.css`
- `src/components/overlay/champions/MatchEventChip.tsx`
- `src/components/overlay/champions/MatchEventChip.module.css`
- `src/components/overlay/champions/PlayerEventChip.tsx`
- `src/components/overlay/champions/PlayerEventChip.module.css`
- `src/components/overlay/champions/PreMatchScreen.tsx`
- `src/components/overlay/champions/PreMatchScreen.module.css`

Also read: `src/lib/format.ts`, `src/lib/clock-display.ts`, `src/models/MatchState.ts`, `src/lib/pusher-shared.ts`

---

## Step 3 — Create component directory and all 16 files

Create directory: `src/components/overlay/{themeKey}/`

### Invariants that MUST be preserved in every component

**Positioning (never change these):**
- MainBug: `position: absolute; top: 32px; left: 32px`
- PreMatchScreen, LineupsScreen, StandingsScreen, StatsScreen: centered via `top: 50%; left: 50%; transform: translate(-50%, -50%)`
- HTFTScreen: `position: absolute; bottom: ~56px; left: 50%; transform: translateX(-50%)` — centered, not full-width, not flush to bottom
- PlayerEventChip: rendered inside MainBug wrapper, appears below the scorebug bar
- MatchEventChip: positioned below the full scorebug area

**Behavior (copy from Champions — only change CSS, not logic):**
- `useScorePulse` in MainBug: flashes score section on goal
- `useIntroScan` in LineupsScreen: scans through players on reveal
- `useTeamCycle` in LineupsScreen: replays animation when team switches
- `AnimatePresence` / framer-motion patterns if used (optional — Champions doesn't use it, redesigned does)
- Scorer list reversal in HTFTScreen: newest scorer at top
- HTFTScreen scorer section ALWAYS rendered (even empty)
- `visiblePenaltyWindow` for penalty mode dots
- `deriveClockDisplay` + `formatMatchClock` for time display
- `aggregateEnabled` / `aggregateHomeScore` / `aggregateAwayScore` on MainBug
- `useIntroScan` and `useTeamCycle` must use `effectiveVisible` throughout LineupsScreen

**CSS rules (never break these):**
- CSS Modules ONLY — no Tailwind classes anywhere in overlay components
- No `background` on the root container of the overlay page component
- Font: `var(--font-montserrat), sans-serif` on all overlay components
- `font-variant-numeric: tabular-nums` on all clocks and scores
- Transitions/animations for show/hide — `opacity` + `transform` via `.visible` modifier class
- `overflow: visible` on any wrapper that has absolutely-positioned children overflowing its bounds
- `box-sizing: border-box` where padding/border affects dimensions

**TypeScript rules:**
- Copy prop interfaces EXACTLY from Champions (same names, types, optional flags)
- No `any` types
- All functions typed

### HTFTScreen specific
- Width: 1000–1200px centered (leave significant lateral space on 1920px)
- `bottom: 56px` (or similar breathing room)
- `overflow: visible` on the card to allow logo circles to protrude
- Logo circles: `position: absolute; top: 50%; transform: translateY(-50%)` on `.main`, centered on left/right card borders (i.e., `left: -[radius]px` and `right: -[radius]px`)
- Inner padding 60–70px on each side to clear the protruding logos
- Scorer section: `min-height` so it shows even when empty

### MainBug aggregate tab
- The `.aggregateTab` must be a **sibling of `.mainBar`** inside a `.mainBarWrap` container — not a child of `.mainBar` (which has `overflow: hidden` for border-radius clipping)
- `.mainBarWrap { position: relative; display: flex; align-items: stretch; }`
- `.aggregateTab { position: absolute; top: 0; right: -[width+gap]px; ... }`

---

## Step 4 — Write each component

For each of the 8 components, write `.tsx` first (behavior from Champions, adapted for new design token names), then `.module.css` (all new visual design).

### Design approach
- Define your color tokens as CSS custom properties or direct values in the CSS Module
- The ENTIRE visual difference from Champions should live in `.module.css` — not in `.tsx`
- TSX changes from Champions are only: class names if you rename them, and removing Champions-specific design comments
- Keep ALL the same CSS class names from Champions if possible — this minimizes TSX diff

---

## Step 5 — Wire into schema and routing

### 5a. `src/models/Match.ts`

Add `"{themeKey}"` to the `OverlayTemplateSchema` enum:
```ts
export const OverlayTemplateSchema = z.enum(["classic", "redesigned", "champions", "{themeKey}"]);
```

### 5b. `src/app/api/matches/route.ts`

Extend the `overlayTemplate` ternary chain (in the `POST` handler, `matchDoc` object):
```ts
overlayTemplate: overlayTemplate === "classic" ? "classic"
  : overlayTemplate === "champions" ? "champions"
  : overlayTemplate === "{themeKey}" ? "{themeKey}"
  : "redesigned",
```

### 5c. `src/app/overlay/[matchId]/page.tsx`

Add imports at the top (Champions block already exists as a pattern):
```ts
// {ThemeName} template
import { MainBug as {ThemeKey}MainBug } from "@/components/overlay/{themeKey}/MainBug";
// ... (all 7 components, same pattern)
```

Add the namespace constant:
```ts
const {THEMEKEY} = {
  MainBug: {ThemeKey}MainBug,
  HTFTScreen: {ThemeKey}HTFTScreen,
  // ... rest
};
```

Update template selection (`const C = ...`):
```ts
const C = tmpl === "classic" ? CLASSIC
  : tmpl === "champions" ? CHAMPIONS
  : tmpl === "{themeKey}" ? {THEMEKEY}
  : REDESIGNED;
```

### 5d. `src/app/dashboard/new/NewProjectClient.tsx`

Add to the `OverlayTemplate` type:
```ts
type OverlayTemplate = "classic" | "redesigned" | "champions" | "{themeKey}";
```

Add a new card object to the template array (the array has `as const` — append before the closing `] as const`):
```tsx
{
  id: "{themeKey}" as const,
  label: "{ThemeName}",
  desc: "...",  // one sentence describing the visual style
  icon: "...",  // a Material Symbol name that fits the theme
  preview: (
    // Small scorebug preview using inline Tailwind + style={{ }}
    // Use the theme's primary bg color, score pill color, etc.
    // Follow the same structure as the Champions card preview
    <div className="flex items-center justify-between mt-3 px-3 py-2 rounded-lg ..."
         style={{ backgroundColor: "{primaryBg}" }}>
      ...
    </div>
  ),
},
```

Change `grid-cols-3` to `grid-cols-4` (or keep 3 and use a 2-row grid) if adding a 4th card causes layout issues — check the existing `sm:grid-cols-3` class on the grid and update it.

---

## Step 6 — Verify

Run `npx tsc --noEmit 2>&1 | head -30` and fix any TypeScript errors before finishing.

---

## What NOT to do

- Do not modify any existing template files (classic, redesigned, champions)
- Do not change any control panel files (`LiveConsole.tsx`, `ClockModule.tsx`, etc.)
- Do not change any API routes except the two listed above
- Do not add Tailwind classes to overlay components
- Do not set a background on the root overlay page element
- Do not change prop interface names or types (breaks the overlay page call sites)
- Do not skip `useTeamCycle` or `useIntroScan` in LineupsScreen — they are behavior, not style

---

## Output when done

Report:
1. Theme key chosen and why
2. Color palette extracted/designed (3–5 colors with hex values)
3. List of all 16 new files created
4. List of the 4 updated files and what changed in each
5. Any design decisions made when the reference was ambiguous
