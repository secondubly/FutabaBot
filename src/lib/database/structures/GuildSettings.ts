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
				console.warn(`Could not find any settings for guild ${this.guildID}`)
				return undefined
			}

			const settingJSON = settingResult.settings as Prisma.JsonObject
			if(settingJSON[setting]) {
				return settingJSON[setting]
			}
			
			console.warn(`Could not find setting ${setting} in guild settings for guild ${this.guildID}`)
			return undefined
		}
	}

	set(key: string, value: any): any {
		// cache value
		this.settings.set(key, value)
		// update db in the bg
		this.updateDB()
		return value
	}

	async has(key: string): Promise<boolean> {
		// check cache
		if (this.settings.has(key)) {
			return true
		} else {
			console.info(`Could not find cached value for key: ${key}`)
			const settingResult = await container.db.settings.findFirst({
				select: { settings: true },
				where: {
					guild: this.guildID
				}
			})

			if (!settingResult) {
				console.warn(`Could not find any settings for guild ${this.guildID}`)
				return false
			}

			const settingJSON = settingResult.settings as Prisma.JsonObject
			if(settingJSON[key]) {
				return true
			}

			return false
		}
	}

	// TODO
	async updateDB() {
		const settingsObject = Object.fromEntries([...this.settings])
		const jsonString = JSON.stringify(settingsObject)

		// REF: see https://docs-git-clarify-prisma-promise-behavior-prisma.vercel.app/reference/api-reference/prisma-client-reference#prismapromise-behavior for why we use a .then()
		container.db.settings.upsert({
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
		}).then(() => {})
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
