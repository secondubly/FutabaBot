/*
  Warnings:

  - You are about to drop the `playing_status` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `playlist_song` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "playlist_song" DROP CONSTRAINT "playlist_song_music_playlist_id_fkey";

-- DropTable
DROP TABLE "playing_status";

-- DropTable
DROP TABLE "playlist_song";

-- CreateTable
CREATE TABLE "PlayingStatus" (
    "id" SERIAL NOT NULL,
    "guild" TEXT NOT NULL,
    "status_type" TEXT NOT NULL,
    "status_string" TEXT NOT NULL,

    CONSTRAINT "PlayingStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaylistSong" (
    "id" SERIAL NOT NULL,
    "music_playlist_id" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "query" TEXT,
    "title" TEXT NOT NULL,
    "uri" TEXT NOT NULL,

    CONSTRAINT "PlaylistSong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warn" (
    "id" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "expiration" TIMESTAMP(3) NOT NULL,
    "mod" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "severity" INTEGER NOT NULL,

    CONSTRAINT "Warn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberWarnings" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,

    CONSTRAINT "MemberWarnings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlaylistSong" ADD CONSTRAINT "PlaylistSong_music_playlist_id_fkey" FOREIGN KEY ("music_playlist_id") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Warn" ADD CONSTRAINT "Warn_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "MemberWarnings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
