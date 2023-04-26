import type { ChatInputCommandInteraction, ContextMenuCommandInteraction } from 'discord.js'
import type { GuildMember } from 'discord.js'
import { isNullishOrEmpty } from '@sapphire/utilities'

export async function parseMembers(interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction): Promise<GuildMember[]> {
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
		const membersToParse = (interaction as ChatInputCommandInteraction).options.getString('users')?.split(/[\s,]+/)

		if (isNullishOrEmpty(membersToParse)) {
			return members // return early
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
