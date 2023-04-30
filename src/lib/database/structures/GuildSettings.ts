import type { Prisma } from '@prisma/client'
import { container } from '@sapphire/framework'
import { Collection } from 'discord.js'

export class GuildSettings {
	settings = new Collection()
	private guildID: string
	constructor(guildID: string, settings?: Prisma.JsonObject) {
		this.guildID = guildID
		if (!settings) {
			return
		}

		this.setup(settings)
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

	set(key: string, value: any): any {
		// cache value
		this.settings.set(key, value)
		// update db in the bg
		this.updateDB()
		return value
	}

	// TODO
	async updateDB() {
		const settingsJSON = [...this.settings][0]
		const jsonString = this.arrayTOJSON(settingsJSON)

		const upsertSettings = container.db.settings.upsert({
			where: {
				guild: this.guildID
			},
			update: {
				settings: jsonString
			},
			create: {
				guild: this.guildID,
				settings: jsonString
			}
		})
	}

	private arrayTOJSON(arr: unknown[]): string {
		const arrayJSON: { [key: string]: any } = {}
		for (let i = 0; i < arr.length; i = i + 2) {
			const key = arr[i] as string
			const value = arr[i + 1] as any
			arrayJSON[key] = value
		}

		return JSON.stringify(arrayJSON)
	}

	private setup(settings: Prisma.JsonObject) {
		// @ts-ignore: Argument of type <whatever> is not assignable to parameter of type 'string'.
		const settingsObj = JSON.parse(settings)
		for (const [key, value] of Object.entries(settingsObj)) {
			this.settings.set(key, value)
		}
	}
}
