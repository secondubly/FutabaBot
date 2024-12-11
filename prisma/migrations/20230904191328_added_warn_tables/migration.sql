/*
  Warnings:

  - You are about to drop the `MemberWarnings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Warn" DROP CONSTRAINT "Warn_targetId_fkey";

-- DropTable
DROP TABLE "MemberWarnings";

-- CreateTable
CREATE TABLE "WarnAction" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "severity" INTEGER NOT NULL,
    "expiration" INTEGER,
    "guildId" TEXT NOT NULL,

    CONSTRAINT "WarnAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuildWarns" (
    "id" TEXT NOT NULL,

    CONSTRAINT "GuildWarns_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Warn" ADD CONSTRAINT "Warn_id_fkey" FOREIGN KEY ("id") REFERENCES "GuildWarns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarnAction" ADD CONSTRAINT "WarnAction_action_fkey" FOREIGN KEY ("action") REFERENCES "GuildWarns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
