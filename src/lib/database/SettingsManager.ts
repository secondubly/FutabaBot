import { container } from '@sapphire/framework'
import { GuildSettings } from './structures/GuildSettings'
import type { Prisma, settings } from '@prisma/client'

export class SettingsManager {
	settings: Map<string, GuildSettings> = new Map<string, GuildSettings>()


	constructor(guildIDs: string[], settings: settings[]) {
		for (const guildID of guildIDs) {
			const settingsJson = settings.find((setting) => setting.guild === guildID) ?? new GuildSettings(guildID)
			if (!settingsJson) {
				// create an empty settings map
				this.settings.set(guildID, new GuildSettings(guildID))
			} else {
				const settingsObj = settingsJson.settings as Prisma.JsonObject
				this.settings.set(guildID, new GuildSettings(guildID, settingsObj))
			}
		}
	}

	async readSettings(guildID: string, setting: string): Promise<unknown> {
		if (this.settings.has(guildID)) {
			// check the cache first
			const settingResult = await this.settings.get(guildID)?.fetch(setting)
			if (settingResult) {
				return settingResult
			}
		}
		
		return undefined // TODO: When a new server is added to the bot's list, we need to add it to settings manager
	}

	updateSetting(guildID: string, setting: string, value: unknown) {
		if (!this.settings.has(guildID)) {
			console.warn("Tried to update settings for a server that hasn't been set up yet!")
			return undefined
		}

		return this.settings.get(guildID)?.set(setting, value)
	}

	async hasSetting(guildID: string, setting: string): Promise<boolean> {
		if (this.settings.has(guildID)) {
			return await this.settings.get(guildID)?.has(setting) ?? false
		}

		return false
	}

	createDefaultSettings(guildID: string) {
		// create empty settings map
		this.settings.set(guildID, new GuildSettings(guildID))
	}
}
