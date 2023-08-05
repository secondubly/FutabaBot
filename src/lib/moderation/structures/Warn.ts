import type { GuildMember } from 'discord.js'
import { randomBytes } from 'crypto'

export class Warn {
	uid: string
	guildID: string
	mod: GuildMember
	reason: string | undefined
	member: GuildMember
	expiration: string | undefined

	public constructor(guildID: string, mod: GuildMember, member: GuildMember, expiration?: string, reason?: string) {
		this.guildID = guildID
		this.mod = mod
		this.reason = reason
		this.member = member

		this.uid = randomBytes(12).toString('base64')
	}
}
