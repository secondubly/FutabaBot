import { ModerationCommand } from '#lib/moderation'
import { ApplyOptions } from '@sapphire/decorators'
import type { Command } from '@sapphire/framework'
import type { User, InteractionResponse } from 'discord.js'
import { ApplicationCommandType, MessageContextMenuCommandInteraction } from 'discord.js'
import type { FutabaCommand } from '#lib/structures'
import { Emojis } from '#lib/constants'

@ApplyOptions<ModerationCommand.Options>({
	description: 'Unbans users with an optional reason',
	requiredClientPermissions: ['BanMembers'],
	typing: true
})

// TODO: test this command
export class UserCommand extends ModerationCommand {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) => option.setName('user').setDescription('the user to unban').setRequired(true))
				.addStringOption((option) => option.setName('reason').setDescription('Reason to unban the user').setRequired(false)),
				{
					guildIds: [''] // TODO: add env value for this later
				}
		)

		// Register Context Menu command available from any message
		registry.registerContextMenuCommand({
			name: this.name,
			type: ApplicationCommandType.Message
		},
		{
			guildIds: [''] // TODO: add env value for this later
		})
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: FutabaCommand.ChatInputCommandInteraction) {
		const user = interaction.options.getUser('user', true)
		const reason = interaction.options.getString('reason') ?? undefined

		return this.unbanUser(interaction, user, reason)
	}

	// Context Menu command
	public async contextMenuRun(interaction: FutabaCommand.ContextMenuCommandInteraction) {
		const user = interaction.isContextMenuCommand()
			? interaction.user
			: (interaction as MessageContextMenuCommandInteraction<'cached'>).targetMessage.author
		const reason = undefined

		return this.unbanUser(interaction, user, reason)
	}

	private async unbanUser(
		interaction: FutabaCommand.ChatInputCommandInteraction | FutabaCommand.ContextMenuCommandInteraction,
		user: User,
		reason: string | undefined
	): Promise<InteractionResponse> {
		const banned = await interaction.guild.bans.fetch(user.id).catch(() => null)

		if (!banned) {
			return interaction.reply({
				content: `${Emojis.Cross} ${user} is not banned!`,
				ephemeral: true
			})
		}

		const response = `${Emojis.Confirm} ${user} has been unbanned ${reason ? `for the following reason: ${reason}` : ''}`
		await interaction.guild.bans.remove(user, reason)

		return interaction.reply({ content: response })
	}
}

type Range = 1 | 2 | 3 | 4 | 5 | 6 | 7
