/*
Author: secondubly
softban.ts (c) 2023
Desc: Softbans a user from your server (Softbanning is banning, then unbanning a user.)
Created:  2023-07-23T18:55:22.425Z
Modified: !date!
*/

import { Emojis } from '#lib/constants'
import { ModerationCommand } from '#lib/moderation'
import type { FutabaCommand } from '#lib/structures'
import { runAllChecks } from '#lib/util/discord/discord'
import { ApplyOptions } from '@sapphire/decorators'
import type { Command } from '@sapphire/framework'
import type { APIApplicationCommandOptionChoice, GuildMember, Message, MessageContextMenuCommandInteraction } from 'discord.js'

@ApplyOptions<ModerationCommand.Options>({
	description: 'Quickly bans and unbans a user. Acts as a message purge.',
	requiredClientPermissions: ['BanMembers']
})
export class UserCommand extends ModerationCommand {
	// TODO: make this a constant probably
	private readonly daysChoices: APIApplicationCommandOptionChoice<Days>[] = [
		{ name: '1 Day', value: 1 },
		{ name: '2 Days', value: 2 },
		{ name: '3 Days', value: 3 },
		{ name: '4 Days', value: 4 },
		{ name: '5 Days', value: 5 },
		{ name: '6 Days', value: 6 },
		{ name: '7 Days', value: 7 }
	]

	private DAYS_TO_SECONDS = 86400
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addUserOption((option) =>
					option //
						.setName('user')
						.setDescription('The member to soft ban.')
						.setRequired(true)
				)
				.addStringOption((option) =>
					option //
						.setName('reason')
						.setDescription('The reason for the soft ban.')
						.setRequired(false)
				)
				.addIntegerOption((option) =>
					option //
						.setName('days')
						.setDescription('The days of messages to delete (not a temp ban) (default: 1 day)')
						.setRequired(false)
						.setChoices(...this.daysChoices)
				)
				.addBooleanOption((option) =>
					option //
						.setName('dm')
						.setDescription('Send a DM to the timed out user (default: false)')
						.setRequired(false)
				),
				{
					idHints: ['1145143251993645162'],
					guildIds: ['703326411326226463'] // TODO: add env value for this later
				}
		)
	}

	public override async chatInputRun(interaction: FutabaCommand.ChatInputCommandInteraction) {
		await interaction.deferReply({ fetchReply: true })
		const member = interaction.options.getMember('user')

		if (!member) {
			return interaction.editReply({
				content: `${Emojis.Cross} Please specify a valid member that is in this server.`
			})
		}

		const reason = interaction.options.getString('reason') ?? undefined
		const daysToDelete = interaction.options.getInteger('days') ?? 1
		const dm = interaction.options.getBoolean('dm') ?? false

		return this.softBanUser(interaction, member, daysToDelete, reason, dm)
	}

	private async softBanUser(
		interaction: FutabaCommand.ChatInputCommandInteraction | FutabaCommand.ContextMenuCommandInteraction,
		member: GuildMember,
		daysToDelete: number,
		reason: string | undefined,
		dm: boolean
	): Promise<Message> {
		if (interaction.isChatInputCommand()) {
			const { content, result } = runAllChecks(interaction.member, member, 'soft ban')
			if (!result) {
				return interaction.editReply(content)
			}
		} else if (interaction.isUserContextMenuCommand()) {
			const { content, result } = runAllChecks(interaction.targetMember, interaction.member, 'soft ban')
			if (!result) {
				return interaction.editReply(content)
			}
		} else {
			const messageInteraction = interaction as MessageContextMenuCommandInteraction<'cached'>
			const { content, result } = runAllChecks(messageInteraction.member, member, 'soft ban')

			if (!result) {
				return interaction.editReply(content)
			}
		}

		let response = `${Emojis.Confirm} ${member} has been soft banned ${reason ? `for the following reason: ${reason}` : ''}`

		await member.ban({ deleteMessageSeconds: daysToDelete * this.DAYS_TO_SECONDS, reason })

		await interaction.guild.members.unban(member.id, reason)

		if (dm) {
			await member
				.send({
					content: `You have been soft banned from ${interaction.guild.name}\n${reason ? `Reason: ${reason}` : ''}`
				})
				.catch(() => {
					response += `\n\n> ${Emojis.Cross} Couldn't DM member!`
					console.warn(`Couldn’t DM member ${member.id} in server ${interaction.guild.id}`)
				})
		}

		return interaction.editReply(response)
	}
}

type Days = 1 | 2 | 3 | 4 | 5 | 6 | 7
