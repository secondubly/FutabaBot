import type { GuildMember } from 'discord.js'
import { randomBytes } from 'crypto'

export class Warn {

	private status: string

	public constructor(readonly guildID: string, readonly uuid: string, readonly severity: number,
		readonly expiration?: string, readonly member?: GuildMember, readonly mod?: GuildMember, 
		readonly reason?: string, status: string = 'a') {
			this.status = status
		}

		public updateStatus(status: string) {
			this.status = status
		}

		public getStatus() {
			return this.status
		}
}
