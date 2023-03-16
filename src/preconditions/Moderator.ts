// import { isModerator } from '#utils/functions'
// import { AllFlowsPrecondition } from '@sapphire/framework'
// import type { Message, CommandInteraction, ContextMenuCommandInteraction, GuildMember } from 'discord.js'

// export class UserPrecondition extends AllFlowsPrecondition {
// 	public override async messageRun(message: Message) {
// 		// for Message Commands
// 		return this.checkModerator(message.member!)
// 	}

// 	public override async chatInputRun(interaction: CommandInteraction) {
// 		// for Slash Commands
// 		return this.checkModerator(interaction.member)
// 	}

// 	public override async contextMenuRun(interaction: ContextMenuCommandInteraction) {
// 		// for Context Menu Command
// 		if (interaction.isMessageContextMenuCommand()) {
// 			return this.checkModerator(interaction.member)
// 		}
// 		return this.checkModerator(interaction.user)
// 	}

// 	private async checkModerator(user: GuildMember) {
// 		return isModerator(user) ? this.ok() : this.error({ message: 'Only the bot owner can use this command!' })
// 	}
// }
