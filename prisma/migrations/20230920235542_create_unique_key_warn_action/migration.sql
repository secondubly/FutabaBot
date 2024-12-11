/*
  Warnings:

  - A unique constraint covering the columns `[guildId,severity]` on the table `WarnAction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "WarnAction_guildId_severity_key" ON "WarnAction"("guildId", "severity");
