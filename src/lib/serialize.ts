import type { User } from "@prisma/client";

/** Fields safe to send to the client (never includes passwordHash). */
export function publicUser(user: User) {
  return {
    id: user.id,
    memberNumber: String(user.id).padStart(4, "0"),
    name: user.name,
    headline: user.headline,
    avatarInitial: user.avatarInitial,
    avatarColor: user.avatarColor,
    offlineMeetCount: user.offlineMeetCount,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
  };
}

export type PublicUser = ReturnType<typeof publicUser>;
