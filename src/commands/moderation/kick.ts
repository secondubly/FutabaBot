import { ApplyOptions } from '@sapphire/decorators'
import type { Args, Command } from '@sapphire/framework'
import { EmbedBuilder, Message } from 'discord.js'
import type { GuildMember, User } from 'discord.js'
import { isNullishOrEmpty, isNullOrUndefinedOrEmpty } from '@sapphire/utilities'
import { isStageChannel, isTextChannel } from '@sapphire/discord.js-utilities'
import { ModerationComand } from '#lib/moderation'

@ApplyOptions<ModerationComand.Options>({
	description: 'Kicks a user from the sever with an optional reason',
	requiredClientPermissions: ['KickMembers'],
	aliases: ['k'],
	typing: true
})
export class UserCommand extends ModerationComand {
	// Message command
	public async messageRun(message: Message, args: Args) {
		const members = await args.repeat('member')
		return this.kickUser(message, members)
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.kickUser(interaction)
	}

	// Context Menu command
	public async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
		return this.kickUser(interaction)
	}

	private async kickUser(
		interactionOrMessage: Message | Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction,
		memberArgs?: GuildMember[]
	) {
		// if we have an args value, then parse as many members as possible
		const members: Promise<GuildMember[]> | GuildMember[] | undefined =
			interactionOrMessage instanceof Message ? memberArgs : await this.parseMembers(interactionOrMessage)
		if (isNullOrUndefinedOrEmpty(members)) {
			// TODO: spit back an error message
			if (interactionOrMessage instanceof Message) {
				// if this was a message command, we want to send back an embed response with an error
				const channel = interactionOrMessage.channel

				if (!isTextChannel(channel) || isStageChannel(channel)) {
					return
				}

				const errorEmbed = new EmbedBuilder()
					.setColor(0x800000)
					.setDescription(`${interactionOrMessage.member}, You provided invalid input, please check your input and try again.`)

				channel.send({ embeds: [errorEmbed] })
			} else {
				// TODO: generic error response
				interactionOrMessage.reply({ content: 'You provided invalid input, please check your input and try again.', ephemeral: true })
			}
			return
		}

		const guild = interactionOrMessage.guild
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
				// none of the users could be kicked, let the author know!
				if (interactionOrMessage instanceof Message) {
					const channel = interactionOrMessage.channel

					if (!isTextChannel(channel) || isStageChannel(channel)) {
						return
					}

					const errorEmbed = new EmbedBuilder()
						.setColor(0x800000) // TODO: set this color as a constant
						.setDescription(`${interactionOrMessage.member}, None of the supplied members could be banned.`)

					channel.send({ embeds: [errorEmbed] })
				}
			}

			const response = `Successfully kicked ${fulfilledResponses.length} of ${members.length} members.`
			if (interactionOrMessage instanceof Message) {
				// if this was a message command, we want to send back an embed response with an error
				const channel = interactionOrMessage.channel

				if (!isTextChannel(channel) || isStageChannel(channel)) {
					return
				}

				const successEmbed = new EmbedBuilder().setColor(0x800000).setDescription(response)

				channel.send({ embeds: [successEmbed] })
			} else {
				// TODO: generic error response
				interactionOrMessage.reply({ content: response, ephemeral: true })
			}

			return
		}
	}

	private async parseMembers(interaction: Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction): Promise<GuildMember[]> {
		const members: GuildMember[] = []
		if (interaction.isUserContextMenuCommand()) {
			const targetGuildMember = interaction.targetMember as GuildMember
			if (targetGuildMember && targetGuildMember.kickable) {
				members.push(targetGuildMember)
			}
		} else if (interaction.isMessageContextMenuCommand()) {
			if (interaction.targetMessage.member && interaction.targetMessage.member.kickable) {
				members.push(interaction.targetMessage.member)
			}
		} else {
			// is a slash command
			const membersToParse = (interaction as Command.ChatInputCommandInteraction).options.getString('members')?.split(/[\s,]+/)

			if (isNullishOrEmpty(membersToParse)) {
				throw Error('No users provided.')
			}

			const guild = interaction.guild

			if (!guild) {
				// if this was not sent in a guild then throw an error
				throw Error('There was no guild object, something isn’t right.')
			}

			// I originally was using a forEach loop here, see an explanation here on why that's a terrible idea
			// REF: https://stackoverflow.com/a/37576787
			for (const memberID of membersToParse) {
				const strippedMemberID = memberID.replace(/\D/g, '')
				if (isNullishOrEmpty(strippedMemberID)) {
					continue
				}

				const member = await guild.members.fetch(strippedMemberID).catch((err) => {
					console.error(err)
					throw err
				})

				if (member) {
					members.push(member)
				}
			}
		}
		return members
	}
}
