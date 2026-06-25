import { z } from "zod";

export const RosterPlayerSchema = z.object({
  number: z.number().int().min(0).max(99),
  name: z.string().min(1),
  position: z.string().min(1),
  // Pre-rendered headshot for the Lineups overlay's spotlight panel — a
  // static asset uploaded once per player, not generated per match. Falls
  // back to the team's generic kit graphic when not set.
  portraitUrl: z.string().optional(),
});

export const TeamSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1),
  // Broadcast code shown on the overlay (Main Bug / HT-FT) — short on
  // purpose, e.g. "TIT", "BRA". The control panel shows `name` in full.
  shortName: z.string().min(1).max(4),
  slug: z.string().min(1),
  logoUrl: z.string().optional(),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
  }),
  kit: z.object({
    style: z.enum(["solid", "striped-vertical", "striped-horizontal"]),
    jerseyColor: z.string(),
    numberColor: z.string(),
  }),
  roster: z.array(RosterPlayerSchema).default([]),
  coach: z.string().optional(),
});

export type RosterPlayer = z.infer<typeof RosterPlayerSchema>;
export type Team = z.infer<typeof TeamSchema>;
