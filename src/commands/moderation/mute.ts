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

	public async messageRun(message: Message, args: Args) {
		const members = await args.repeat('member')
		const reason = args.finished ? 'No reason provided.' : await args.rest('string')

		const mutedUsers = this.muteUserFromMessage(message, members, reason)
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.muteUser(interaction)
	}

	public async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
		return this.muteUser(interaction)
	}

	private async muteUserFromMessage(message: Message, memberArgs: GuildMember[], reason?: string) {
		const members: Promise<GuildMember[]> | GuildMember[] | undefined = memberArgs
		const channel = message.channel
		if (!isTextChannel(channel) || isStageChannel(channel)) {
			return
		}

		if (isNullOrUndefinedOrEmpty(members)) {
			const errorEmbed = new EmbedBuilder()
				.setColor(0x800000)
				.setDescription(`${message.member}, you provided invalid input, please check your input and try again.`)

			channel.send({ embeds: [errorEmbed] })
			return
		}

		const guild = message.guild

		if (!guild) {
			throw Error('There was no guild object, something isn’t right.')
		} else {
			const mutePromises = []

			const muteRole = this.container.settings.readSettings(guild.id, 'mute_role')
			if (!muteRole) {
				// create mute role if it does not exist
			}
			for (const member of members) {
				mutePromises.push(member.roles.add())
			}
		}
	}
}
