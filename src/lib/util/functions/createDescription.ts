import { Timestamp } from "#lib/structures/classes/Timestamp";
import { GuildMember, User } from "discord.js";

export function createModLog({
    member,
    action,
    reason,
    duration,
    warnId
}: {
    member: GuildMember | User,
    action: string,
    reason?: string,
    duration?: Timestamp,
    warnId?: string
}): string {
    let description = `**Target**: ${member instanceof GuildMember ? member.user.tag : member.tag} (\`${member.id}\`)`
    description += `\nAction: ${action}`
    description += `\nReason: ${reason ?? 'None'}`
    if (duration) {
        description += `\nExpires: ${duration.getShortDate()} (${duration.getRelativeTime()})`
    }

    if (warnId) {
        description += `\nWarn Id: \`${warnId}\``
    }

    return description
}