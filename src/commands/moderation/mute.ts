import { ModerationCommand } from '#lib/moderation'
import { ApplyOptions } from '@sapphire/decorators'
import type { Args, Command } from '@sapphire/framework'
import { EmbedBuilder, GuildMember } from 'discord.js'
import { Message } from 'discord.js'
import { parseMembers } from '#utils/functions'
import { isNullOrUndefinedOrEmpty } from '@sapphire/utilities'
import { isStageChannel, isTextChannel } from '@sapphire/discord.js-utilities'

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
		const members = await args.repeat('member')
		const reason = args.finished ? 'No reason provided.' : await args.rest('string')

		const mutedUsers = this.muteUser(message, members, reason)
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
	) {
		const members: Promise<GuildMember[]> | GuildMember[] | undefined =
			interactionOrMessage instanceof Message ? memberArgs : await parseMembers(interactionOrMessage)

		if (isNullOrUndefinedOrEmpty(members)) {
			if (interactionOrMessage instanceof Message) {
				const channel = interactionOrMessage.channel

				if (!isTextChannel(channel) || isStageChannel(channel)) {
					return
				}

				const errorEmbed = new EmbedBuilder()
					.setColor(0x800000)
					.setDescription(`${interactionOrMessage.member}, you provided invalid input, please check your input and try again.`)

				channel.send({ embeds: [errorEmbed] })
			} else {
				interactionOrMessage.reply({ content: 'You provided invalid input, please check your input and try again.', ephemeral: true })
			}

			return
		}

		const guild = interactionOrMessage.guild

		if (!guild) {
			throw Error('There was no guild object, something isn’t right.')
		} else {
			const mutePromises = []

			const muteRole = container
			for (const member of members) {
				mutePromises.push(member.roles.add())
			}
		}
	}
}