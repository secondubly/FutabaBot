-- CreateTable
CREATE TABLE "playing_status" (
    "id" SERIAL NOT NULL,
    "guild" TEXT NOT NULL,
    "status_type" TEXT NOT NULL,
    "status_string" TEXT NOT NULL,

    CONSTRAINT "playing_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_song" (
    "id" SERIAL NOT NULL,
    "music_playlist_id" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "query" TEXT,
    "title" TEXT NOT NULL,
    "uri" TEXT NOT NULL,

    CONSTRAINT "playlist_song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlists" (
    "id" SERIAL NOT NULL,
    "guild" TEXT NOT NULL,
    "author" TEXT,
    "author_id" INTEGER,
    "name" TEXT,

    CONSTRAINT "PK_playlists" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "guild" TEXT NOT NULL,
    "settings" JSONB NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("guild")
);

-- AddForeignKey
ALTER TABLE "playlist_song" ADD CONSTRAINT "playlist_song_music_playlist_id_fkey" FOREIGN KEY ("music_playlist_id") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
