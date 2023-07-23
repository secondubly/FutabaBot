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

	// Chat Input (slash) command
	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.banUserFromInteraction(interaction)
	}

	// Context Menu command
	public async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
		return this.banUserFromInteraction(interaction)
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
