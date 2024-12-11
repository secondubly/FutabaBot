-- DropForeignKey
ALTER TABLE "Warn" DROP CONSTRAINT "Warn_id_fkey";

-- AddForeignKey
ALTER TABLE "Warn" ADD CONSTRAINT "Warn_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "GuildWarns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
