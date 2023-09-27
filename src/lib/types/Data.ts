import type { Timestamp } from "#lib/structures/classes/Timestamp"
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

export type WarnActionData = BaseWarnActionData & {
    severity: warnSeverityNum
    duration: Timestamp
}

export interface TimeoutActionData extends BaseModActionData {
    action: 'timeout'
    duration: Timestamp
}

export type ModActionData = (Partial<TimeoutActionData> | Partial<WarnActionData>) & BaseModActionData

export type WarnAction = Exclude<modAction, 'warn' | 'warn_remove' | 'unban'>

export type WarnActionObject = {
    action: WarnAction,
    severity: number,
    expiration?: number
}