import { ModerationCommand } from '#lib/moderation'
import { ApplyOptions } from '@sapphire/decorators'
import type { Args, Command } from '@sapphire/framework'
import { isNullOrUndefinedOrEmpty } from '@sapphire/utilities'
import { isTextChannel, isStageChannel } from '@sapphire/discord.js-utilities'
import type { GuildMember, User } from 'discord.js'
import { Message, EmbedBuilder, ApplicationCommandType } from 'discord.js'
import { parseMembers } from '#utils/functions'

@ApplyOptions<ModerationCommand.Options>({
	aliases: ['b'],
	description: 'Ban users with an optional reason',
	requiredClientPermissions: ['BanMembers'],
	typing: true
})
export class UserCommand extends ModerationCommand {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) => option.setName('users').setDescription('the users to ban').setRequired(true))
				.addStringOption((option) => option.setName('reason').setDescription('Reason to ban the user(s)').setRequired(false))
		)

		// Register Context Menu command available from any message
		registry.registerContextMenuCommand({
			name: this.name,
			type: ApplicationCommandType.Message
		})

		// Register Context Menu command available from any user
		registry.registerContextMenuCommand({
			name: this.name,
			type: ApplicationCommandType.User
		})
	}
	// Message command
	public async messageRun(message: Message, args: Args) {
		const members = await args.repeat('member')
		return this.banUserFromMessage(message, members)
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.banUserFromInteraction(interaction)
	}

	// Context Menu command
	public async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
		return this.banUserFromInteraction(interaction)
	}

	private async banUserFromMessage(message: Message, members: GuildMember[]) {
		const channel = message.channel
		if (!isTextChannel(channel) || isStageChannel(channel)) {
			return
		}

		if (isNullOrUndefinedOrEmpty(members)) {
			const errorEmbed = new EmbedBuilder()
				.setColor(0x800000)
				.setDescription(`${message.member}, You provided invalid input, please check your input and try again.`)

			channel.send({ embeds: [errorEmbed] })
			return
		}

		if (!message.guild) {
			throw Error('There was no guild object, something isn’t right.')
		}

		const guild = message.guild
		const banPromises: Promise<string | User | GuildMember>[] = []

		for (const member of members) {
			banPromises.push(guild.members.ban(member))
		}

		const banResults = await Promise.allSettled(banPromises).catch((err) => {
			console.error(err)
			console.log('some promises failed to resolve')
			throw err
		})

		const fulfilledResponses: (string | GuildMember | User)[] = []
		banResults.forEach((result) => {
			if (result.status === 'fulfilled') {
				fulfilledResponses.push(result.value)
			}
		})

		if (isNullOrUndefinedOrEmpty(fulfilledResponses)) {
			const errorEmbed = new EmbedBuilder()
				.setColor(0x800000) // TODO: set this color as a constant
				.setDescription(`${message.member}, None of the supplied members could be banned.`)
			channel.send({ embeds: [errorEmbed] })
			return
		}

		const response = `Successfully kicked ${fulfilledResponses.length} out of ${members.length} members.`
		channel.send(response)
		return
	}

	private async banUserFromInteraction(interaction: Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction) {
		const members = await parseMembers(interaction)

		if (isNullOrUndefinedOrEmpty(members)) {
			// TODO: generic error response
			interaction.reply({ content: 'You provided invalid input, please check your input and try again.', ephemeral: true })
			return
		}

		const guild = interaction.guild
		if (!guild) {
			// TODO something went wrong, return early
			throw Error('There was no guild object, something isn’t right.')
		} else {
			// TODO: Do some request batching here - maybe 10 at a time?
			const kickPromises: Promise<string | User | GuildMember>[] = []
			for (const member of members) {
				kickPromises.push(guild.members.ban(member))
			}

			const banResults = await Promise.allSettled(kickPromises).catch((err) => {
				console.error(err)
				console.log('some promises failed to resolve')
				throw err
			})

			const fulfilledResponses: (string | GuildMember | User)[] = []
			banResults.forEach((result) => {
				if (result.status === 'fulfilled') {
					fulfilledResponses.push(result.value)
				}
			})

			if (isNullOrUndefinedOrEmpty(fulfilledResponses)) {
				// none of the users could be kicked, let the author know!
				const response = 'None of the supplied authors could be banned.'
				interaction.reply({ content: response, ephemeral: true })
				return
			}

			const response = `Successfully kicked ${fulfilledResponses.length} out of ${members.length} members.`
			interaction.reply({ content: response, ephemeral: true })
			return
		}
	}
}
