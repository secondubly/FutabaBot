import { container } from '@sapphire/framework'
import { GuildSettings } from './structures/GuildSettings'
import type { Prisma } from '@prisma/client'

export class SettingsManager {
	settings: Map<string, GuildSettings> = new Map<string, GuildSettings>()

	async setup(guildIDs: string[]) {
		const guildSettings = await container.db.settings.findMany({
			where: { guild: { in: guildIDs } }
		})

		for (const guildID of guildIDs) {
			const settingsJson = guildSettings.find((setting) => setting.guild === guildID)
			if (!settingsJson) {
				// create an empty settings map
				this.settings.set(guildID, new GuildSettings(guildID))
			}
		}
		for (const setting of guildSettings) {
			const settingsJson = setting.settings as Prisma.JsonObject
			console.log(settingsJson)
			// this.settings.set(setting.guild, new GuildSettings(setting.settings))
		}
	}

	public readSettings(guildID: string, setting: string) {
		if (this.settings.has(guildID)) {
			const existing = this.settings.get(guildID)!.fetch(setting)
		}
	}
}
