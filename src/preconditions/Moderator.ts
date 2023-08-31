import { PermissionsPrecondition } from '#lib/structures/preconditions/PermissionsPrecondition'
import { isModerator } from '#utils/functions/permissions'
import type { GuildMember, Message } from 'discord.js'
import type { CommandInteraction, ContextMenuCommandInteraction } from 'discord.js'

export class UserPrecondition extends PermissionsPrecondition {
	public override async messageRun(_: Message) {
		// no-op
		return this.error({ message: 'This should never happen, something went wrong!' })
	}
	public async handle(message: CommandInteraction | ContextMenuCommandInteraction): PermissionsPrecondition.AsyncResult {
		return isModerator(message.member as GuildMember) ? this.ok() : this.error({ message: 'Only moderators can use this command!' })
	}
}
