import { ModerationCommand } from '#lib/moderation'
import { ApplyOptions } from '@sapphire/decorators'
import type { Args, Command } from '@sapphire/framework'
import { isNullishOrEmpty } from '@sapphire/utilities'
import type { GuildMember } from 'discord.js'
import { Message } from 'discord.js'

@ApplyOptions<ModerationCommand.Options>({
	aliases: ['b'],
	description: 'Ban users with an optional reason',
	requiredClientPermissions: ['BanMembers'],
	typing: true
})
export class UserCommand extends ModerationCommand {
	// Message command
	public async messageRun(message: Message, args: Args) {
		const members = await args.repeat('member')
		return this.banUser(message, members)
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.banUser(interaction)
	}

	// Context Menu command
	public async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
		return this.banUser(interaction)
	}

	private async banUser(
		interactionOrMessage: Message | Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction,
		memberArgs?: GuildMember[]
	) {
		const members: Promise<GuildMember[]> | GuildMember[] | undefined =
			interactionOrMessage instanceof Message ? memberArgs : await this.parseMembers(interactionOrMessage)
	}

	private async parseMembers(interaction: Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction): Promise<GuildMember[]> {
		const members: GuildMember[] = []
		if (interaction.isUserContextMenuCommand()) {
			const targetGuildMember = interaction.targetMember as GuildMember
			if (targetGuildMember && targetGuildMember.bannable) {
				members.push(targetGuildMember)
			}
		} else if (interaction.isMessageContextMenuCommand()) {
			if (interaction.targetMessage.member && interaction.targetMessage.member.bannable) {
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
