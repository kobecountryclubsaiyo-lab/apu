-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Reaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fromUserId" INTEGER NOT NULL,
    "toUserId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "recruitPostId" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reaction_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reaction_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Reaction" ("createdAt", "fromUserId", "id", "recruitPostId", "toUserId", "type") SELECT "createdAt", "fromUserId", "id", coalesce("recruitPostId", 0) AS "recruitPostId", "toUserId", "type" FROM "Reaction";
DROP TABLE "Reaction";
ALTER TABLE "new_Reaction" RENAME TO "Reaction";
CREATE UNIQUE INDEX "Reaction_fromUserId_toUserId_recruitPostId_type_key" ON "Reaction"("fromUserId", "toUserId", "recruitPostId", "type");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
