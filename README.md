<p align="center">
  <img src="docs/assets/banner.png" alt="MatchPulse Live" width="100%" />
</p>

<p align="center">
  <a href="https://github.com/estalvgs1999/match-pulse-live/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-violet?style=flat-square" alt="MIT License" />
  </a>
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MongoDB-7-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB 7" />
  <img src="https://img.shields.io/badge/Pusher-Channels-300D4F?style=flat-square&logo=pusher&logoColor=white" alt="Pusher" />
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/OBS-Browser%20Source-302E31?style=flat-square&logo=obsstudio&logoColor=white" alt="OBS" />
</p>

<h1 align="center">MatchPulse Live</h1>

<p align="center">
  <strong>Real-time broadcast graphics for football & futsal.</strong><br/>
  Control scores, clocks, and graphics from any device. Display them live in OBS — no plugins, no capture cards.
</p>

---

<p align="center">
  <a href="docs/setup.md"><b>Local Setup</b></a> ·
  <a href="docs/deployment.md"><b>Deployment</b></a> ·
  <a href="docs/usage.md"><b>Operator Guide</b></a> ·
  <a href="#overlay-templates"><b>Templates</b></a>
</p>

---

## What you get

**A control panel.** Open it on any browser — desktop, tablet, or phone. Manage the live clock, score, cards, lineups, standings, and which graphic is on air. Multiple operators can connect simultaneously.

**A broadcast overlay.** Add it to OBS as a Browser Source (1920×1080, transparent). It updates within ~100 ms of every operator action, with smooth animated transitions. The clock is server-anchored and never drifts.

**Three visual templates.** Switch between *Redesigned*, *Classic*, and *Champions* per match. Generate new themes from a reference image with one command.

---

## Quick Start

```bash
git clone https://github.com/estalvgs1999/match-pulse-live.git
cd match-pulse-live
bash install.sh
```

Requires: Docker + a free [Pusher Channels](https://pusher.com/channels) account. MongoDB runs locally in Docker — no Atlas needed for local setup.

→ **[Full setup guide](docs/setup.md)** · **[Production deployment](docs/deployment.md)**

---

## Overlay Templates

| | Template | Style |
|-|----------|-------|
| 🟢 | **Redesigned** | Obsidian dark; team-color accent rings; adaptive tints |
| 📺 | **Classic** | Broadcast green; clean rectangular scorebug |
| 🏆 | **Champions** | UCL-inspired; deep navy; cyan accent; split-section widget |

Add a custom theme from a reference image:
```
/new-overlay-theme "Copa MX" paleta dorada, tipografía condensada
```

---

## Documentation

| | |
|-|-|
| [Local Setup](docs/setup.md) | Docker stack, Pusher credentials, OBS connection |
| [Production Deployment](docs/deployment.md) | Atlas + VPS, HTTPS, updates |
| [Operator Guide](docs/usage.md) | Running a match from start to finish |

---

## License

MIT — see [LICENSE](LICENSE).
