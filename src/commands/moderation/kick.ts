import { ApplyOptions } from '@sapphire/decorators'
import type { Args, Command } from '@sapphire/framework'
import { ApplicationCommandType, EmbedBuilder, Message } from 'discord.js'
import type { GuildMember, User } from 'discord.js'
import { isNullOrUndefinedOrEmpty } from '@sapphire/utilities'
import { isStageChannel, isTextChannel } from '@sapphire/discord.js-utilities'
import { ModerationCommand } from '#lib/moderation'
import { parseMembers } from '#utils/functions'

@ApplyOptions<ModerationCommand.Options>({
	description: 'Kicks a user from the sever with an optional reason',
	requiredClientPermissions: ['KickMembers'],
	aliases: ['k'],
	typing: true
})
export class UserCommand extends ModerationCommand {
	public override registerApplicationCommands(registry: Command.Registry) {
		// Register Chat Input command
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) => option.setName('users').setDescription('the users to kick').setRequired(true))
				.addStringOption((option) => option.setName('reason').setDescription('Reason to kick the user(s)').setRequired(false))
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
		return this.kickUser(interaction)
	}

	// Context Menu command
	public async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
		return this.kickUser(interaction)
	}

	private async kickUser(interaction: Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction, memberArgs?: GuildMember[]) {
		// if we have an args value, then parse as many members as possible
		const members: Promise<GuildMember[]> | GuildMember[] | undefined =
			interaction instanceof Message ? memberArgs : await parseMembers(interaction)
		if (isNullOrUndefinedOrEmpty(members)) {
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
				kickPromises.push(guild.members.kick(member))
			}

			const kickResults = await Promise.allSettled(kickPromises).catch((err) => {
				console.error(err)
				console.log('some promises failed to resolve')
				throw err
			})

			const fulfilledResponses: (string | GuildMember | User)[] = []
			kickResults.forEach((result) => {
				if (result.status === 'fulfilled') {
					fulfilledResponses.push(result.value)
				}
			})

			if (isNullOrUndefinedOrEmpty(fulfilledResponses)) {
				interaction.reply({ content: `None of the supplied members could be banned.` })
				return
			}

			const response = `Successfully kicked ${fulfilledResponses.length} out of ${members.length} members.`
			interaction.reply({ content: response, ephemeral: true })

			return
		}
	}
}
