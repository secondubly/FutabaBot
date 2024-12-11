import type { GuildMember } from 'discord.js'
import { randomBytes } from 'crypto'

export class Warn {

	private status: string
	public created: Date

	public constructor(readonly guildID: string, readonly uuid: string, readonly severity: number, 
		readonly expiration: Date, readonly member: GuildMember, readonly mod: GuildMember, 
		readonly reason: string | null, status: string = 'a', created?: Date) {
			this.status = status
			this.created = created ?? new Date()
		}

		public updateStatus(status: string) {
			this.status = status
		}

		public getStatus() {
			return this.status
		}
}
