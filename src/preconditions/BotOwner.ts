import { AllFlowsPrecondition } from '@sapphire/framework'
import type { PreconditionResult } from '@sapphire/framework'
import type { Message, CommandInteraction, ContextMenuCommandInteraction } from 'discord.js'
import { OWNERS } from '#root/config'

export class UserPrecondition extends AllFlowsPrecondition {
	public override async messageRun() {
		// no-op, shouldn't ever be executed
		return this.error({ message: 'This should never happen, something went wrong!' })
	}

	public override async chatInputRun(interaction: CommandInteraction) {
		// for Slash Commands
		return this.checkOwner(interaction.user.id)
	}

	public override async contextMenuRun(interaction: ContextMenuCommandInteraction) {
		// for Context Menu Command
		return this.checkOwner(interaction.user.id)
	}

	private async checkOwner(userId: string): Promise<PreconditionResult> {
		return OWNERS.includes(userId) ? this.ok() : this.error({ message: 'Only the bot owner can use this command!' })
	}
}
