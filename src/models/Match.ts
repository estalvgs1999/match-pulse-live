import { z } from "zod";

export const MatchSchema = z.object({
  _id: z.string().optional(),
  homeTeamId: z.string(),
  awayTeamId: z.string(),
  tournament: z.string(),
  matchday: z.string(),
  stadium: z.string(),
  date: z.string(), // ISO 8601
});

export type Match = z.infer<typeof MatchSchema>;
