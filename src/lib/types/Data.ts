import type { Timestamp } from "#lib/structures"
import type { GuildMember, User } from "discord.js"

export interface BaseModActionData {
    moderator: GuildMember
    target: GuildMember | User
    reason?: string
    action: modAction
}

export type modAction = 'warn' | 'kick' | 'ban' | 'unban' | 'softban' | 'timeout' | 'warn_remove'

export interface BaseWarnActionData extends BaseModActionData {
    warnId: string;
}

type warnSeverityNum = 1 | 2 | 3 | 4 | 5;

export type warnActionData = BaseWarnActionData & {
    severity: warnSeverityNum
    duration: Timestamp
}

export interface TimeoutActionData extends BaseModActionData {
    action: 'timeout'
    duration: Timestamp
}

export type ModActionData = (Partial<TimeoutActionData> | Partial<warnActionData>) & BaseModActionData

export type warnAction = Exclude<modAction, 'warn' | 'warn_remove' | 'unban'>