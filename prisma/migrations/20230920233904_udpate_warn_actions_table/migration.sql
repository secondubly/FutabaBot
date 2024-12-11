/*
  Warnings:

  - The primary key for the `WarnAction` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `WarnAction` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "WarnAction" DROP CONSTRAINT "WarnAction_action_fkey";

-- AlterTable
ALTER TABLE "WarnAction" DROP CONSTRAINT "WarnAction_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "WarnAction_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "WarnAction" ADD CONSTRAINT "WarnAction_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "GuildWarns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
