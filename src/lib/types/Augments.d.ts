import type { SettingsManager } from '#lib/database/SettingsManager'
import type { WarningManager } from '#lib/database/WarningManager'
import { WarnActionManager } from '#lib/moderation/structures/WarnActionManager'
import type { PrismaClient } from '@prisma/client'
import type { ArrayString } from '@skyra/env-utilities'

declare module '@skyra/env-utilities' {
	export interface Env {
		CLIENT_OWNERS: ArrayString
		COMMAND_GUILD_IDS: ArrayString
	}
}

declare module '@sapphire/pieces' {
	interface Container {
		settings: SettingsManager
		warns: WarningManager
		actions: WarnActionManager
		db: PrismaClient
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		Administrator: never
		BotOwner: never
		Everyone: never
		Moderator: never
		ServerOwner: never
	}
}
