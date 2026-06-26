# Operator Guide

How to run a live match from start to finish using the MatchPulse Live control panel.

---

## Before kick-off

### Create the match

Go to **Dashboard → New Match** and fill in:
- Tournament name, matchday, stadium, date
- Home and away team (pick existing from the database, or create inline)
- Overlay template (Redesigned / Classic / Champions)

<!-- SCREENSHOT: New match creation form filled in -->
> 📸 *Screenshot placeholder — New Match form*

Click **Create Match**. You'll land on the live control panel.

### Open OBS

Add the overlay URL as a Browser Source in OBS (see [Setup Guide → Step 7](setup.md#step-7--add-to-obs)). Place it above your video feed and verify the scorebug appears.

<!-- SCREENSHOT: OBS with scorebug visible over a pitch video -->
> 📸 *Screenshot placeholder — OBS with overlay active*

---

## The control panel

<!-- SCREENSHOT: Full control panel on desktop — annotated with section labels -->
> 📸 *Screenshot placeholder — full control panel (desktop)*

The panel has three sections on desktop:
- **Left** — Home team (score, cards, fouls, lineup)
- **Center** — Clock, match phase controls, graphic selector
- **Right** — Away team

On mobile the sections stack vertically (Center first, then Home, then Away).

<!-- SCREENSHOT: Control panel on mobile -->
> 📸 *Screenshot placeholder — control panel on mobile*

---

## Running the clock

| Button | What it does |
|--------|-------------|
| ▶ **Start** | Begins counting from current elapsed time |
| ⏸ **Pause** | Freezes the clock (and the overlay) |
| **Sync** | Jumps the clock to a specific time (e.g. catch up after a delay) |
| **Restart** | Resets to 00:00 |

The clock is server-anchored — reloading OBS or reconnecting Wi-Fi doesn't cause drift.

<!-- SCREENSHOT: Clock module with time running -->
> 📸 *Screenshot placeholder — clock running*

---

## Match phases

Use the **Match Flow** steps in the center panel to advance through:

```
Pre-Match → 1st Half → Half Time → 2nd Half → Full Time
                                             → Extra Time → Extra Time 2 → Penalties
```

Advancing to **Half Time** automatically switches the overlay to the HT/FT graphic. Advancing to **Full Time** shows the FT graphic.

<!-- SCREENSHOT: Match Flow panel showing 2nd Half selected -->
> 📸 *Screenshot placeholder — Match Flow panel*

---

## Score & cards

Click **+** next to the score to add a goal. A goal scorer modal appears — pick the player or skip.

<!-- SCREENSHOT: Goal scorer modal with roster list -->
> 📸 *Screenshot placeholder — goal scorer modal*

| Button | Effect |
|--------|--------|
| **+ Goal** | Increments score, prompts for scorer name |
| **Yellow card** | Adds a yellow card (counted toward fouls) |
| **Red card** | Adds a red card icon above the scorebug |
| **Foul** | Increments the foul counter (shown as dots below the scorebug) |

---

## Graphics

Click a graphic in the **Active Graphic** selector to switch what OBS shows:

| Graphic | Shows |
|---------|-------|
| **Scorebug** | Main scorebug (time, score, fouls) — the default "on air" state |
| **HT/FT** | Half time / Full time card with scorer names |
| **Pre-Match** | Pre-match team card |
| **Lineups** | Starting lineup with player spotlight |
| **Standings** | Live league table or bracket |
| **Stats** | Possession, corners, shots |

<!-- SCREENSHOT: Graphic selector panel with "Lineups" active -->
> 📸 *Screenshot placeholder — graphic selector*

### Turning off all graphics

Select **None** in the graphic selector. The overlay goes fully transparent — no graphics on screen.

---

## Lineups

Open the **Lineup Editor** (roster icon on the team panel) to configure:
- Starting 5
- Captain
- Spotlight player (the one with their portrait highlighted)

When you switch the active graphic to **Lineups**, the overlay plays an automatic intro scan — the spotlight cycles through each player once, then settles on whoever the operator has selected.

To switch between Home and Away lineup while the graphic is live, use the home/away toggle above the graphic selector. The overlay plays an exit + enter animation automatically.

<!-- SCREENSHOT: Lineup editor modal open -->
> 📸 *Screenshot placeholder — lineup editor*

<!-- SCREENSHOT: Overlay showing the lineups screen -->
> 📸 *Screenshot placeholder — lineups screen on overlay*

---

## Penalty shootout

When the match reaches **Penalties** phase:

1. The scorebug switches to penalty mode — the clock is hidden, penalty dot indicators appear
2. Use the **penalty grid** to record each kick: click the dot → toggle Scored / Missed
3. The overlay automatically advances through each round; the visible window follows sudden death past round 5

<!-- SCREENSHOT: Penalty grid in the control panel -->
> 📸 *Screenshot placeholder — penalty grid*

---

## Timeout & replay chips

In the **Match Flow** panel:

- **Timeout** — click the timeout button and select Home or Away. A "Timeout" lower-third appears on the overlay for that team.
- **Replay** — click Replay to show a "Replay" chip on the overlay. Click again to dismiss.

<!-- SCREENSHOT: Timeout chip on the overlay -->
> 📸 *Screenshot placeholder — timeout chip overlay*

---

## Standings & stats

Click the **Edit** button in the graphic selector to open the editors for standings and stats:

- **Standings** — add rows (team name, played, won, drawn, lost, points) or configure a bracket
- **Stats** — enter possession %, corners, and shots for each team

Changes are reflected immediately on the overlay when the corresponding graphic is active.

<!-- SCREENSHOT: Standings editor -->
> 📸 *Screenshot placeholder — standings editor*

---

## Aggregate score

For cup ties (two-legged matches), enable the aggregate score in **Match Settings** (gear icon):
- Enter the score from the first leg
- The scorebug shows an AGG tab to the right of the main widget

<!-- SCREENSHOT: Match Settings modal with aggregate enabled -->
> 📸 *Screenshot placeholder — match settings*

<!-- SCREENSHOT: Scorebug with AGG tab visible -->
> 📸 *Screenshot placeholder — scorebug with aggregate*

---

## End of match

1. Advance Match Flow to **Full Time** (the FT graphic shows automatically)
2. When done, click **Lock Match** — this freezes the state permanently. No further edits are possible (useful to prevent accidental changes after broadcast)

---

## Multi-operator setup

Multiple people can open `/control/[matchId]` simultaneously. All operators see the same live state. Useful for:
- One operator on clock/score, another on graphics
- A remote producer controlling graphics while a pitch-side operator handles score

All control actions propagate via Pusher in real time.

---

**← Back to [Setup Guide](setup.md)**
