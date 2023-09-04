import { ModerationCommand } from '#lib/moderation/structures/ModerationCommand'
import { ApplyOptions } from '@sapphire/decorators'
import type { Command } from '@sapphire/framework'
import type { User, APIApplicationCommandOptionChoice, Message } from 'discord.js'
import { ApplicationCommandType, MessageContextMenuCommandInteraction } from 'discord.js'
import type { FutabaCommand } from '#lib/structures/commands/FutabaCommand'
import { runAllChecks } from '#lib/util/discord/discord'
import { Confirmation } from '#lib/structures/classes/Confirmation'
import { Emojis } from '#lib/constants'
import { getGuildIds } from '#lib/util/utils'

@ApplyOptions<ModerationCommand.Options>({
	aliases: ['b'],
	description: 'Ban users with an optional reason',
	requiredClientPermissions: ['BanMembers'],
	typing: true
})
export class UserCommand extends ModerationCommand {
	private DAYS_TO_SECONDS = 86400
	private readonly rangeChoices: APIApplicationCommandOptionChoice<Range>[] = [
		// TODO: clean this up
		{ name: '1 Day', value: 1 },
		{ name: '2 Days', value: 2 },
		{ name: '3 Days', value: 3 },
		{ name: '4 Days', value: 4 },
		{ name: '5 Days', value: 5 },
		{ name: '6 Days', value: 6 },
		{ name: '7 Days', value: 7 }
	]

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addUserOption((option) => option.setName('user').setDescription('the user to ban').setRequired(true))
				.addStringOption((option) => option.setName('reason').setDescription('Reason to ban the user(s)').setRequired(false))
				.addIntegerOption((option) =>
					option
						.setName('range')
						.setDescription('The time range of user’s message history to delete. (default: 0)')
						.setRequired(false)
						.setChoices(...this.rangeChoices)
				),
				{ guildIds: getGuildIds() }
			)

		// Register Context Menu command available from any user
		registry.registerContextMenuCommand({
			name: this.name,
			type: ApplicationCommandType.User
		},
		{ guildIds: getGuildIds() })
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: FutabaCommand.ChatInputCommandInteraction) {
		const user = interaction.options.getUser('user', true)
		const reason = interaction.options.getString('reason') ?? undefined
		const range = interaction.options.getInteger('days') ?? 0
		const dm = interaction.options.getBoolean('dm') ?? false

		const { content, result } = runAllChecks(interaction.member, user, 'ban')
		if (!result) {
			return interaction.reply({ content, ephemeral: true })
		}

		const confirm = new Confirmation({
			content: `Are you sure you want to ban ${user}? ${reason ? `\nReason: ${reason}` : ''}`,
			onConfirm: async () => {
				await this.banUser(interaction, user, reason, range, dm)
			},
			onCancel: ({ i }) => {
				return i.editReply({
					content: `${Emojis.Cross} Close call, stopped the ban hammer at the last moment!`
				})
			}
		})
		return confirm.run(interaction)
	}

	// Context Menu command
	public async contextMenuRun(interaction: FutabaCommand.ContextMenuCommandInteraction) {
		const user = interaction.isContextMenuCommand()
			? interaction.user
			: (interaction as MessageContextMenuCommandInteraction<'cached'>).targetMessage.author
		const reason = undefined
		const range = 0

		await this.banUser(interaction, user, reason, range)
		// return this.banUser(interaction)
	}

	private async banUser(
		interaction: FutabaCommand.ChatInputCommandInteraction | FutabaCommand.ContextMenuCommandInteraction,
		user: User,
		reason: string | undefined,
		range: number,
		dm = false
	): Promise<Message> {
		let response = `${Emojis.Confirm} ${user} has been [banned](https://tenor.com/view/11035060) ${
			reason ? `for the following reason: __${reason}__` : ''
		}`

		if (dm) {
			await user
				.send({
					content: `You have been banned from ${interaction.guild.name}\n${reason ? `Reason: ${reason}` : ''}`
				})
				.catch(() => (response += `\n\n> ${Emojis.Cross} Couldn't DM user!`))
		}

		await interaction.guild.bans.create(user, { deleteMessageSeconds: range * this.DAYS_TO_SECONDS, reason })

		return interaction.editReply(response)
	}
}

type Range = 1 | 2 | 3 | 4 | 5 | 6 | 7
