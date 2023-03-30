import { ModerationCommand } from '#lib/moderation'
import { ApplyOptions } from '@sapphire/decorators'
import type { Args, Command } from '@sapphire/framework'
import type { GuildMember, Message } from 'discord.js'

@ApplyOptions<ModerationCommand.Options>({
	aliases: ['m'],
	description: 'Prevent a user from chatting in text channels and speaking in voice channels',
	requiredMember: true
})
export class UserCommand extends ModerationCommand {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) => option.setName('users').setDescription('The users to mute').setRequired(true))
				.addStringOption((option) => option.setName('reason').setDescription('Reason to mute the user(s)').setRequired(false))
		)
	}

	// Message Command
	public async messageRun(message: Message, args: Args) {
		const members = args.repeat('member')
		const reason = args.finished ? 'No reason provided.' : args.rest('string')

		return this.muteUser(members, reason)
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.muteUser(interaction)
	}

	// Context Menu command
	public async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
		return this.muteUser(interaction)
	}

	private async muteUser(
		interactionOrMessage: Message | Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction,
		memberArgs?: GuildMember[],
		reason?: string
	) {}
}
