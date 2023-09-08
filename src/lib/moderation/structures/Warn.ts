import type { GuildMember } from 'discord.js'
import { randomBytes } from 'crypto'

export class Warn {

	public constructor(readonly guildID: string, readonly uuid: string, readonly severity: number,
		readonly expiration?: string, readonly member?: GuildMember, readonly mod?: GuildMember, 
		readonly reason?: string) {}
}
