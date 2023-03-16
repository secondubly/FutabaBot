import { AllFlowsPrecondition } from '@sapphire/framework'
import type { Message, CommandInteraction, ContextMenuCommandInteraction } from 'discord.js'
import { OWNERS } from '#root/config'

export class UserPrecondition extends AllFlowsPrecondition {
	public override async messageRun(message: Message) {
		// for Message Commands
		return this.checkOwner(message.author.id)
	}

	public override async chatInputRun(interaction: CommandInteraction) {
		// for Slash Commands
		return this.checkOwner(interaction.user.id)
	}

	public override async contextMenuRun(interaction: ContextMenuCommandInteraction) {
		// for Context Menu Command
		return this.checkOwner(interaction.user.id)
	}

	private async checkOwner(userId: string) {
		return OWNERS.includes(userId) ? this.ok() : this.error({ message: 'Only the bot owner can use this command!' })
	}
}
