import type { GuildMember } from 'discord.js'

export function isModerator(member: GuildMember) {
	// TODO: perform check for moderator role as well
	return isGuildOwner(member)
}

export function isGuildOwner(member: GuildMember) {
	return member.id === member.guild.ownerId
}

export function isAdmin(member: GuildMember): boolean {
	return member.permissions.has('Administrator') || member.permissions.has('ManageGuild')
}