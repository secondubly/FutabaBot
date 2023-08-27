import { Enumerable } from '@sapphire/decorators'
import { ApplicationCommandRegistries, Command, RegisterBehavior, SapphireClient, container } from '@sapphire/framework'
import { CLIENT_OPTIONS } from '#root/config'
import type { Message } from 'discord.js'

export class FutabaClient extends SapphireClient {
	@Enumerable(false)
	public dev = process.env.NODE_ENV !== 'production'

	public constructor() {
		super(CLIENT_OPTIONS)
	}

	public async login(token?: string) {
		ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite)
		const loginResponse = await super.login(token)
		return loginResponse
	}

	public async destroy() {
		container.db.$disconnect
		return super.destroy()
	}

	public override fetchPrefix = async (messageOrInteraction: Message | Command.ChatInputCommandInteraction) => {
		const guild = messageOrInteraction.guild

		if (!guild) {
			console.warn('fetchPrefix called from a non-server context')
			return
		}

		// TODO: set this key to a constant
		const prefix = await container.settings.readSettings(guild.id, 'DEFAULT_PREFIX')
		if (!prefix) {
			// set default prefix to cache so we can update the DB later
			container.settings.updateSetting(guild.id, 'DEFAULT_PREFIX', this.options.defaultPrefix)
			return [this.options.defaultPrefix, ''] as readonly string[]
		}

		return prefix
	}
}
