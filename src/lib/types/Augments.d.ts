import type { ArrayString } from '@skyra/env-utilities'

declare module '@skyra/env-utilities' {
	export interface Env {
		CLIENT_OWNERS: ArrayString
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
