import { PermissionsPrecondition } from '#lib/structures'
import type { GuildMessage } from '#lib/types'
import { isModerator } from '#utils/functions'
import { GuildMember, Message } from 'discord.js'
import { CommandInteraction, ContextMenuCommandInteraction } from 'discord.js'

export class UserPrecondition extends PermissionsPrecondition {
	public override async messageRun(message: Message) {
		return this.handle(message as GuildMessage)
	}
	public async handle(message: GuildMessage | CommandInteraction | ContextMenuCommandInteraction): PermissionsPrecondition.AsyncResult {
		if (message instanceof Message) {
			if (message.author.id) {
				return isModerator(message.member) ? this.ok() : this.error({ message: 'Only moderators can use this command!' })
			}
		} else if (message instanceof CommandInteraction) {
			return isModerator(message.member as GuildMember) ? this.ok() : this.error({ message: 'Only moderators can use this command!' })
		}

		const guildMember = (message as unknown as ContextMenuCommandInteraction).member as GuildMember
		return isModerator(guildMember) ? this.ok() : this.error({ message: 'Only moderators can use this command!' })
	}
}
