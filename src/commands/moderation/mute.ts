import { ModerationCommand } from '#lib/moderation'
import { ApplyOptions } from '@sapphire/decorators'
import type { Args, Command } from '@sapphire/framework'
import { ApplicationCommandType, EmbedBuilder, GuildMember } from 'discord.js'
import type { Message, User } from 'discord.js'
import { isNullOrUndefinedOrEmpty } from '@sapphire/utilities'
import { isStageChannel, isTextChannel } from '@sapphire/discord.js-utilities'
import { parseMembers } from '#utils/functions'

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

		registry.registerContextMenuCommand({
			name: this.name,
			type: ApplicationCommandType.User
		})
	}

	public async messageRun(message: Message, args: Args) {
		const members = await args.repeat('member')
		const reason = args.finished ? 'No reason provided.' : await args.rest('string')

		this.muteUserFromMessage(message, members, reason)
		return
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const members = await parseMembers(interaction)
		this.muteUserFromInteraction(interaction, members)
		return
	}

	public async contextMenuRun(interaction: Command.ContextMenuCommandInteraction<'cached'>) {
		if (!interaction.isUserContextMenuCommand() || !interaction.targetMember) {
			return
		}
		this.muteUserFromInteraction(interaction, [interaction.targetMember])
		return
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

			const muteRole: string | undefined = await this.container.settings.readSettings(guild.id, 'MUTE_ROLE')
			if (!muteRole) {
				console.warn(`Mute command run in guild ${guild.id} but the mute role has not been set up.`)
				message.reply({ content: 'Mute role not found, please run the setup command first.' })
				return
			}

			// TODO: we should probably loop over this and remove items that are invalid, just to be safe
			for (const member of members) {
				if (member.roles.cache.has(muteRole)) {
					continue
				}

				mutePromises.push(member.roles.add(muteRole))
			}

			const muteResults = await Promise.allSettled(mutePromises).catch((err) => {
				console.log('Some promises failed to resolve')
				console.error(err)
				throw err
			})

			const fulfilledResponses: (string | GuildMember | User)[] = []
			muteResults.forEach((result) => {
				if (result.status === 'fulfilled') {
					fulfilledResponses.push(result.value)
				}
			})

			if (isNullOrUndefinedOrEmpty(fulfilledResponses)) {
				message.reply({ content: `None of the supplied members could be muted.` })
				return undefined
			}

			const response = `Successfully muted ${fulfilledResponses.length} out of ${members.length} members.`
			message.reply({ content: response })
		}
	}

	private async muteUserFromInteraction(interaction: Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction, memberArgs: GuildMember[], reason?: string) {
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
			const mutePromises = []
			// TODO: set MUTE_ROLE to constant
			const muteRole: string| undefined = await this.container.settings.readSettings(guild.id, 'MUTE_ROLE')
			if (!muteRole) {
				console.warn(`Mute command run in guild ${guild.id} but the mute role has not been set up.`)
				interaction.reply({ content: 'Mute role not found, please run the setup command first.' })
				return undefined
			}

			for (const member of members) {
				if (member.roles.cache.has(muteRole)) {
					continue
				}

				mutePromises.push(member.roles.add(muteRole))
			}

			const muteResults = await Promise.allSettled(mutePromises).catch((err) => {
				console.log('Some promises failed to resolve')
				console.error(err)
				throw err
			})

			const fulfilledResponses: (string | GuildMember | User)[] = []
			muteResults.forEach((result) => {
				if (result.status === 'fulfilled') {
					fulfilledResponses.push(result.value)
				}
			})

			if (isNullOrUndefinedOrEmpty(fulfilledResponses)) {
				interaction.reply({ content: `None of the supplied members could be muted.` })
				return undefined
			}

			const response = `Successfully muted ${fulfilledResponses.length} out of ${members.length} members.`
			interaction.reply({ content: response, ephemeral: true })
		}
	}
}
