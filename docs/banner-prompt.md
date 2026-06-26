# Banner Image — AI Generation Prompt

Use the prompt below with **Gemini**, **Midjourney**, **DALL·E**, **Ideogram**, or any image AI to generate the README banner.

Save the output as `docs/assets/banner.png` and it will appear automatically in the README.

---

## Prompt

```
A wide-format banner image (1920x480 pixels, dark background) for a software product called "MatchPulse Live".

Design language: sleek broadcast sports graphics control room aesthetic. Deep obsidian black background (#09090b). A glowing violet/purple accent color (#a78bfa) on key UI elements. A cyan blue highlight (#00B4FF) used sparingly.

The image should show:
- On the left: a sleek, minimal scoreboard overlay widget — football/futsal scoreboard with two team slots, a score "0 – 0" in the center, a running clock, and glowing team color rings around small circular logos. Style: floating dark glass card with subtle glow, like a broadcast lower-third.
- In the center: a faint perspective grid or holographic pitch lines suggesting a football/futsal court, slightly glowing.
- On the right: a simplified control panel UI element — dark glass panel with a few glowing buttons, a waveform-style live indicator, and a subtle "LIVE" badge in red with a pulsing dot.

Typography (top center, tasteful and minimal):
- "MatchPulse" in bold white Montserrat-style font
- "Live" in the same size but in violet/purple
- Below in small caps, light gray: "BROADCAST CONTROL SYSTEM"

Overall mood: premium, dark, high-tech broadcast sports production. No photographic elements, no people, no specific team logos. Flat-to-slightly-3D illustration style, not photorealistic. Suitable for a GitHub repository README banner.

Aspect ratio: 4:1 wide. No letterboxing or padding.
```

---

## Tips

- **Gemini:** Paste the prompt directly into [gemini.google.com](https://gemini.google.com) — use Gemini 2.0 Flash or Ultra for best image quality
- **Ideogram:** Works especially well for banners with readable text
- **Midjourney:** Add `--ar 4:1 --v 6` at the end of the prompt
- **DALL·E 3:** Paste into ChatGPT with GPT-4o

After generating, crop to exactly `1920×480` px and save as `docs/assets/banner.png`.

---

## Placeholder

Until you have a banner, the README gracefully shows nothing (the `<img>` tag is there but the file doesn't exist). Add the file and it appears automatically on the next push.
