import { ModerationCommand } from '#lib/moderation'
import { ApplyOptions } from '@sapphire/decorators'
import type { Args, Command } from '@sapphire/framework'
import { ApplicationCommandType, EmbedBuilder, GuildMember } from 'discord.js'
import type { Message, User } from 'discord.js'
import { isNullOrUndefinedOrEmpty } from '@sapphire/utilities'
import { isStageChannel, isTextChannel } from '@sapphire/discord.js-utilities'
import { parseMembers } from '#utils/functions'

@ApplyOptions<ModerationCommand.Options>({
	aliases: ['um'],
	description: 'Allow user to speak and type in the server once more.',
	requiredMember: true
})
export class UserCommand extends ModerationCommand {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) => option.setName('users').setDescription('The users to unmute').setRequired(true))
				.addStringOption((option) => option.setName('reason').setDescription('Reason to mute the user(s)').setRequired(false))
		)

		registry.registerContextMenuCommand({
			name: this.name,
			type: ApplicationCommandType.User
		})
	}

	public async messageRun(message: Message, args: Args) {
		const members = await args.repeat('member')
		const reason = args.finished ? 'No reason provided.' : await args.rest('string')

		const mutedUsers = this.unmuteUserFromMessage(message, members, reason)
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const members = await parseMembers(interaction)
		return this.unmuteUserFromInteraction(interaction, members)
	}

	public async contextMenuRun(interaction: Command.ContextMenuCommandInteraction<'cached'>) {
		if (!interaction.isUserContextMenuCommand() || !interaction.targetMember) {
			return
		}
		const success = this.unmuteUserFromInteraction(interaction, [interaction.targetMember])
	}

	private async unmuteUserFromMessage(message: Message, memberArgs: GuildMember[], reason?: string) {
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
			const unmutePromises = []

			const muteRole: string | undefined = await this.container.settings.readSettings(guild.id, 'MUTE_ROLE')
			if (!muteRole) {
				console.warn(`Unmute command run in guild ${guild.id} but the mute role has not been set up.`)
				message.reply({ content: 'Mute role not found, please run the setup command first.' })
				return undefined
			}

			for (const member of members) {
				if (!member.roles.cache.has(muteRole)) {
					continue
				}
				unmutePromises.push(member.roles.remove(muteRole))
			}

			const unmuteResults = await Promise.allSettled(unmutePromises).catch((err) => {
				console.log('Some promises failed to resolve')
				console.error(err)
				throw err
			})

			const fulfilledResponses: (string | GuildMember | User)[] = []
			unmuteResults.forEach((result) => {
				if (result.status === 'fulfilled') {
					fulfilledResponses.push(result.value)
				}
			})

			if (isNullOrUndefinedOrEmpty(fulfilledResponses)) {
				message.reply({ content: `None of the supplied members could be unmuted.` })
				return undefined
			}

			const response = `Successfully unmuted ${fulfilledResponses.length} out of ${members.length} members.`
			message.reply({ content: response })
		}
	}

	private async unmuteUserFromInteraction(interaction: Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction, memberArgs: GuildMember[], reason?: string) {
		const members: Promise<GuildMember[]> | GuildMember[] | undefined = memberArgs
		const channel = interaction.channel
		if (!isTextChannel(channel) || isStageChannel(channel)) {
			return
		}
		if (isNullOrUndefinedOrEmpty(members)) {
			const errorEmbed = new EmbedBuilder()
				.setColor(0x800000)
				.setDescription(`${interaction.member}, you provided invalid input, please check your input and try again.`)
			channel.send({ embeds: [errorEmbed] })
			return
		}
		const guild = interaction.guild
		if (!guild) {
			throw Error('There was no guild object, something isn’t right.')
		} else {
			const unmutePromises = []
			// TODO: set MUTE_ROLE to constant
			const muteRole: string | undefined = await this.container.settings.readSettings(guild.id, 'MUTE_ROLE')
			if (!muteRole) {
				console.warn(`Unmute command run in guild ${guild.id} but the mute role has not been set up.`)
				interaction.reply({ content: 'Mute role not found, please run the setup command first.' })
				return undefined
			}

			for (const member of members) {
				if (!member.roles.cache.has(muteRole)) {
					continue
				}
				unmutePromises.push(member.roles.remove(muteRole))
			}

			const unmuteResults = await Promise.allSettled(unmutePromises).catch((err) => {
				console.log('Some promises failed to resolve')
				console.error(err)
				throw err
			})

			const fulfilledResponses: (string | GuildMember | User)[] = []
			unmuteResults.forEach((result) => {
				if (result.status === 'fulfilled') {
					fulfilledResponses.push(result.value)
				}
			})

			if (isNullOrUndefinedOrEmpty(fulfilledResponses)) {
				interaction.reply({ content: `None of the supplied members could be unmuted.` })
				return undefined
			}

			const response = `Successfully unmuted ${fulfilledResponses.length} out of ${members.length} members.`
			interaction.reply({ content: response, ephemeral: true })
		}
	}
}
