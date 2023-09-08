import { Collection, Guild } from "discord.js";
import { Warn } from "#lib/moderation/structures/Warn";
import { container } from "@sapphire/framework";
import { PrismaClient } from "@prisma/client";
import { warn } from "console";

export class WarningManager {
    
    public readonly cache: WeakMap<Guild, Collection<string, Warn>> = new WeakMap()
    private readonly db: PrismaClient = container.db
    /**
     * Find a warning by the warn ID.
     * @param guild the server to search the warning for
     * @param warnID the unique warn ID
     * @returns 
     */
    async get(guild: Guild, warnID: string): Promise<Warn | undefined> {
        if(this.cache.has(guild)) {
            let warn = this.cache.get(guild)?.get(warnID)
            if (!warn) {
                const result = await this.db.warn.findUnique({
                    where: {
                        id: warnID
                    }
                })

                if (!result) {
                    console.warn(`No warning found with the given ID.`)
                    return undefined
                }

                const moderator = container.client.guilds.resolve(guild).members.cache.get(result.mod) ?? undefined
                const member = container.client.guilds.resolve(guild).members.cache.get(result.targetId) ?? undefined
                warn = new Warn(result.guildId, result.id, result.severity, result.expiration.toDateString(), member, moderator, result.reason ?? undefined)
            }

            return warn
        }

        console.warn(`No warns found for guild: ${guild}`)
        return undefined
    }

    async add(guild: Guild, warning: Warn): Promise<boolean> {
        // TODO: check to make sure we haven't hit the warn limit - if so we need to return an error.
        // TODO: make sure that all fields are required!
        const now = Date.now()
        // check to make sure there is an existing record for this guild
        const found = await this.db.guildWarns.findUnique({
            where: {
                id: guild.id
            }
        })

        if (!found) {
            // we need to create a default record for this guild
            await this.db.guildWarns.create({
                data: {
                    id: guild.id,
                    warns: {}
                }
            })
        }
        
        const result = await this.db.warn.create({
            data: {
                id: warning.uuid,
                targetId: warning.member!.toString() ?? '-1',
                guildId: warning.guildID,
                date: new Date().toISOString(),
                expiration: warning.expiration!,
                mod: warning.mod?.toString() ?? '-1',
                reason: warning.reason,
                severity: warning.severity,
            }
        })
        
        // add to cache
        if (result) {
            const guildWarnings = this.cache.get(guild) ?? new Collection<string, Warn>()
            guildWarnings.set(result.id, warning)
        }

        return result ? true : false
    }
}
 