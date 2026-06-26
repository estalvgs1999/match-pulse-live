import { z } from "zod";

export const OverlayTemplateSchema = z.enum(["classic", "redesigned", "champions"]);
export type OverlayTemplate = z.infer<typeof OverlayTemplateSchema>;

const TeamSnapshotSchema = z.object({
  name: z.string(),
  shortName: z.string(),
  logoUrl: z.string().default(""),
  colors: z.object({ primary: z.string(), secondary: z.string(), accent: z.string() }),
  roster: z.array(z.object({
    number: z.number().int(),
    name: z.string(),
    position: z.string().default(""),
    portraitUrl: z.string().optional(),
  })).default([]),
  coach: z.string().default(""),
});
export type TeamSnapshot = z.infer<typeof TeamSnapshotSchema>;

export const MatchSchema = z.object({
  _id: z.string().optional(),
  homeTeamId: z.string(),
  awayTeamId: z.string(),
  // Preserved when the team document is deleted — the match record stays intact.
  homeTeamSnapshot: TeamSnapshotSchema.optional(),
  awayTeamSnapshot: TeamSnapshotSchema.optional(),
  tournament: z.string(),
  matchday: z.string(),
  stadium: z.string(),
  date: z.string(), // ISO 8601
  overlayTemplate: OverlayTemplateSchema.default("redesigned"),
});

export type Match = z.infer<typeof MatchSchema>;
