import { z } from "zod";

export const OverlayTemplateSchema = z.enum(["classic", "redesigned", "champions"]);
export type OverlayTemplate = z.infer<typeof OverlayTemplateSchema>;

export const MatchSchema = z.object({
  _id: z.string().optional(),
  homeTeamId: z.string(),
  awayTeamId: z.string(),
  tournament: z.string(),
  matchday: z.string(),
  stadium: z.string(),
  date: z.string(), // ISO 8601
  overlayTemplate: OverlayTemplateSchema.default("redesigned"),
});

export type Match = z.infer<typeof MatchSchema>;
