import { ApplyOptions } from '@sapphire/decorators'
import { isStageChannel, isTextChannel } from '@sapphire/discord.js-utilities'
import type { Message, MessageContextMenuCommandInteraction, Role } from 'discord.js'
import { FutabaCommand } from '#lib/structures'
import type { Args, Command, ContextMenuCommand } from '@sapphire/framework'
// import { ApplicationCommandType } from 'discord.js'

@ApplyOptions<FutabaCommand.Options>({
	aliases: ['smr'],
	description: 'Sets mute role for the server'
})
export class UserCommand extends FutabaCommand {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addRoleOption((option) => option.setName('role').setDescription('Role to set as mute role for server').setRequired(true))
		)
	}

	// Message command
	public async messageRun(message: Message, args: Args) {
		const role = await args.pick('role').catch(() => {
			message.channel.send('Please check your input and try again.')
			return null
		})

		if (!role) {
			return
		}

		return this.setMuteRole(role)
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const role = interaction.options.getRole('role', true)
		if (!role) {
		}
		// return this.setMuteRole(role)
	}

	// Context Menu command
	public async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
		if (interaction.isUserContextMenuCommand()) {
			return
		}

		const messageInteraction = interaction as MessageContextMenuCommandInteraction
		const role = messageInteraction.targetMessage
	}

	private async setMuteRole(muteRole: Role) {}
}
