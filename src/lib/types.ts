// SQLite has no native enum type (see prisma/schema.prisma), so these
// string unions are the source of truth for values stored in String columns.

export type RoomStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ReactionType = "AGAIN" | "FUN" | "INTERESTING";

export const REACTION_LABELS: Record<ReactionType, string> = {
  AGAIN: "また遊びたい",
  FUN: "楽しかった",
  INTERESTING: "面白かった",
};

export type ReportStatus = "OPEN" | "REVIEWED" | "DISMISSED";
