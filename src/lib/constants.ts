import { join } from 'path'
import type { ClientOptions } from 'discord.js'
import { LogLevel } from '@sapphire/framework'
import { envParseString } from '@skyra/env-utilities'
export const rootDir = join(__dirname, '..', '..')
export const srcDir = join(rootDir, 'src')
export const CLIENT_OPTIONS: ClientOptions = {
	defaultPrefix: '!',
	caseInsensitiveCommands: true,
	logger: {
		level: envParseString('NODE_ENV') === 'production' ? LogLevel.Info : LogLevel.Debug
	},
	intents: [
		'Guilds',
		'GuildMembers',
		'GuildBans',
		'GuildEmojisAndStickers',
		'GuildVoiceStates',
		'GuildMessages',
		'GuildMessageReactions',
		'DirectMessages',
		'DirectMessageReactions'
	],
	loadMessageCommandListeners: true
}
