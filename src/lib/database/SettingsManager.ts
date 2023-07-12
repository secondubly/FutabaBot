import { container } from '@sapphire/framework'
import { GuildSettings } from './structures/GuildSettings'
import type { Prisma } from '@prisma/client'
import { stringify } from 'querystring'

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
			} else {
				const settingsObj = settingsJson.settings as Prisma.JsonObject
				this.settings.set(guildID, new GuildSettings(guildID, settingsObj))
			}
		}
	}

	public readSettings(guildID: string, setting: string): any {
		if (this.settings.has(guildID)) {
			const existing = this.settings.get(guildID)?.fetch(setting)
		} else {
			// TODO: When a new server is added to the bot's list, we need to add it to settings manager
			return undefined
		}
	}

	public updateSetting(guildID: string, setting: string, value: any) {
		if (!this.settings.has(guildID)) {
			console.warn("Tried to update settings for a server that hasn't been set up yet!")
			return undefined
		}

		return this.settings.get(guildID)?.set(setting, value)
	}

	async hasSetting(guildID: string, setting: string): Promise<boolean> {
		if(await this.settings.get(guildID)?.fetch(setting)) {
			return true
		}

		return false
	}
}
