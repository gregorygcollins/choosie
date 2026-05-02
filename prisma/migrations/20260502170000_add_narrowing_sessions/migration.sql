CREATE TABLE "NarrowingSession" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "mode" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "winnerItemId" TEXT,
    "startingItemCount" INTEGER NOT NULL,
    "roundsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NarrowingSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NarrowingSession_listId_completedAt_idx" ON "NarrowingSession"("listId", "completedAt");

ALTER TABLE "NarrowingSession" ADD CONSTRAINT "NarrowingSession_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;
