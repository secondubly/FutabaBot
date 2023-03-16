import type { GuildMember } from 'discord.js'

export function isModerator(member: GuildMember) {
	// TODO: perform check for moderator role as well
	return isGuildOwner(member)
}

export function isGuildOwner(member: GuildMember) {
	return member.id === member.guild.ownerId
}
