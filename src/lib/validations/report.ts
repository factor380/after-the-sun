import { z } from "zod";

export const REPORT_REASONS = [
  "inappropriatePhoto",
  "wrongLocation",
  "spam",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const createReportSchema = z.object({
  reason: z.enum(REPORT_REASONS),
  details: z.string().trim().max(500).optional().nullable(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
