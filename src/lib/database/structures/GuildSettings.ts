import { Collection } from 'discord.js'

export class GuildSettings {
	settings = new Collection()
	constructor(_settings: JSON) {
		// TODO: grab all data from db and store in settings Collection
	}

	fetch(setting: string): any | undefined {
		if (this.settings.has(setting)) {
			return this.settings.get(setting)
		} else {
			console.warn(`Could not find value for key: ${setting}`)
			return undefined
		}
	}

	set(_key: string, _value: any) {}
}
