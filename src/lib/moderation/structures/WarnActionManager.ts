import { WarnActionObject } from "#lib/types/Data"
import { PrismaClient, WarnAction } from "@prisma/client"
import { container } from "@sapphire/framework"
import { isNullishOrEmpty } from "@sapphire/utilities"
import { Guild } from "discord.js"



export class WarnActionManager {

    public readonly cache: WeakMap<Guild, WarnActionObject[]> = new WeakMap()
    private readonly db: PrismaClient = container.db

    constructor(guilds: Guild[], warnActions: WarnAction[]) {
        for(const action of warnActions) {
            const actionGuildId = action.guildId
            const matchingGuild = guilds.find((guild) => guild.id === actionGuildId)
            if(matchingGuild) {
                if(this.cache.has(matchingGuild)) {
                    const guildActions = this.cache.get(matchingGuild)

                    const warnAction = { action: action.action, severity: action.severity, expiration: action.expiration } as WarnActionObject
                    this.cache.set(matchingGuild, guildActions!.concat(warnAction))
                } else {
                    const warnActions = []
                    const warnAction = { action: action.action, severity: action.severity, expiration: action.expiration } as WarnActionObject
                    warnActions.push(warnAction)
                    this.cache.set(matchingGuild, warnActions)
                }
            }
        }
    }

    public async add(action: WarnActionObject, guild: Guild): Promise<WarnAction | undefined | null> {
        const existingActions = this.cache.get(guild) ?? []
        if (existingActions.length >= 10) {
            console.warn(`Attempted to add a warn action to guild ${guild}, but they have reached the warn action limit.`)
            return undefined // TODO: should we return an empty object instead?
        }

        const found = existingActions.findIndex((e) => e.severity === action.severity)
        if (found !== -1) {
            console.warn(`Attempted to add a warn action to guild ${guild}, but an action for that severity already exists.`)
            return null // return null if the action and severity already exist
        }

        // this will create a guild warns record iff it doesn't exist
        await this.db.guildWarns.upsert({
            where: {
                id: guild.id
            },
            update: {},
            create: {
                id: guild.id
            }
        })

        return this.db.warnAction.upsert({
            create: {
                action: action.action,
                severity: action.severity,
                expiration: action.expiration,
                guildId: guild.id
            },
            update: {},
            where: {
                guild_severity_unique: {
                    guildId: guild.id,
                    severity: action.severity
                }
            },
        })
    }

    public async remove(guild: Guild, severity: number): Promise<WarnAction> {
        const result = await this.db.warnAction.delete({
            where: {
                guild_severity_unique: {
                    guildId: guild.id,
                    severity
                }
            }
        })

        // update the cache
        if (result) {
            const foundIndex = this.cache.get(guild)?.findIndex((action) => action.severity === severity)
            if(!foundIndex || foundIndex === -1) {
                console.warn(`Warn object with severity ${severity} for guild ${guild} not cached`)
            } else {
                this.cache.get(guild)?.splice(foundIndex, 1)
            }
        }

        return result
    }

    async getActions(guild: Guild): Promise<WarnActionObject[]> {
        if (this.cache.has(guild)) {
            const guildActions = this.cache.get(guild)
            return isNullishOrEmpty(guildActions) ? [] : guildActions?.sort((a, b) => a.severity - b.severity)
        }
        
        // cache miss, check db
        const result = await this.db.guildWarns.findUnique({
            select: { actions: true },
            where: { id: guild.id }
        })
        
        const updatedActions = result?.actions.map((action) => action as WarnActionObject) ?? []
        return updatedActions.sort((a, b) => a.severity - b.severity)
    }
}
