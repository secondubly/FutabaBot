import type { Prisma } from '@prisma/client'
import { container } from '@sapphire/framework'
import { Collection } from 'discord.js'

export class GuildSettings {
	settings = new Collection()
	private guildID: string
	constructor(guildID: string, settings?: JSON) {
		// TODO: grab all data from db and store in settings Collection
		this.guildID = guildID
		if (!settings) {
			return
		}
	}

	async fetch(setting: string): Promise<any> {
		if (this.settings.has(setting)) {
			return this.settings.get(setting)
		} else {
			console.info(`Could not find cached value for key: ${setting}`)
			// check DB
			const settingResult = await container.db.settings.findFirst({
				select: { settings: true },
				where: {
					guild: this.guildID
				}
			})

			if (!settingResult) {
				console.warn(`Could not find any result for key: ${setting} in guild ${this.guildID}`)
				return undefined
			}

			const settingJSON = settingResult as Prisma.JsonValue
			console.log(settingJSON)
		}
	}

	set(key: string, value: any) {
		// cache value
		this.settings.set(key, value)
		// update db in the bg
		this.updateDB()
		return
	}

	// TODO
	async updateDB() {
		const settingsJSON = [...this.settings.entries()]
		console.log(settingsJSON)
		console.log(this.settings.toJSON())
		const upsertSettings = await container.db.settings.upsert({
			where: {
				guild: this.guildID
			},
			update: {
				settings: settingsJSON
			},
			create: {
				guild: this.guildID,
				settings: settingsJSON
			}
		})
	}
}
