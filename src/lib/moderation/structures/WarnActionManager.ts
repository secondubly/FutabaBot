import { WarnActionObject } from "#lib/types/Data"
import { PrismaClient, WarnAction } from "@prisma/client"
import { container } from "@sapphire/framework"
import { isNullishOrEmpty } from "@sapphire/utilities"
import { Guild } from "discord.js"



export class WarnActionManager {

    public readonly cache: WeakMap<Guild, WarnActionObject[]> = new WeakMap()
    private readonly db: PrismaClient = container.db

    constructor(guilds: Guild[], warnActions: WarnAction[]) {

        // setup empty cache for each guild
        for(const guild of guilds) {
            this.cache.set(guild, [])
        }
        
        for(const action of warnActions) {
            const actionGuildId = action.guildId
            const matchingGuild = guilds.find((guild) => guild.id === actionGuildId)
            if(matchingGuild) {
                const guildActions = this.cache.get(matchingGuild)
                const warnAction = { action: action.action, severity: action.severity, expiration: action.expiration } as WarnActionObject
                this.cache.set(matchingGuild, [...guildActions!, warnAction])
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
        const guildWarns = await this.db.guildWarns.upsert({
            where: {
                id: guild.id
            },
            update: {},
            create: {
                id: guild.id
            }
        })

        const result = await this.db.warnAction.upsert({
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

        if (result) {
            // update cache
            const warnAction = result as WarnActionObject
            this.cache.get(guild)?.push(warnAction)
        }

        return result
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
            // default to -1 if there is no cache for this guild
            const foundIndex = this.cache.get(guild)?.findIndex((action) => action.severity === severity) ?? -1
            if(foundIndex === -1) {
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
