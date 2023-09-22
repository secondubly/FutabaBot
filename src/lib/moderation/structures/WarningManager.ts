import { Collection, Guild, GuildMember } from "discord.js"
import { Warn } from "#lib/moderation/structures/Warn"
import { container } from "@sapphire/framework"
import { PrismaClient } from "@prisma/client";
import { handlePrismaError } from "../../database/utils"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"
import { WarnStatus } from "#lib/constants";
import { isNullishOrEmpty } from "@sapphire/utilities";

export class WarningManager {
    
    public readonly cache: WeakMap<Guild, Collection<string, Warn>> = new WeakMap()
    private readonly db: PrismaClient = container.db

    constructor(guilds: Guild[], warnings: Warn[]) {
        for (const warn of warnings) {
            const warnGuildId = warn.guildID
            const matchingGuild = guilds.find((guild) => guild.id === warnGuildId)
            if(matchingGuild) {
                if(this.cache.has(matchingGuild)) {
                    const guildWarns = this.cache.get(matchingGuild)
                    this.cache.set(matchingGuild, guildWarns!.set(warn.uuid, warn))
                } else {
                    const warnCollection = new Collection<string, Warn>()
                    warnCollection.set(warn.uuid, warn)
                    this.cache.set(matchingGuild, warnCollection)
                }
            }
        }
    }

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

                const moderator = await container.client.guilds.resolve(guild).members.fetch(result.mod)
                const member = await container.client.guilds.resolve(guild).members.fetch(result.targetId)
                warn = new Warn(result.guildId, result.id, result.severity, result.expiration, member, moderator, result.reason, result.status, result.date)
            }

            return warn
        }

        console.warn(`No warns found for guild: ${guild}`)
        return undefined
    }

    /**
     * Add warning to a guild
     * @param guild guild to add warning to
     * @param warning warning object to add
     * @returns whether or not adding the warning was successful
     */
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

        let result
        try {
            result = await this.db.warn.create({
                data: {
                    id: warning.uuid,
                    targetId: warning.member.id,
                    guildId: warning.guildID,
                    date: new Date().toISOString(),
                    expiration: warning.expiration!,
                    mod: warning.mod.id,
                    reason: warning.reason,
                    severity: warning.severity,
                }
            })
            
            // add to cache
            if (result) {
                if (!this.cache.has(guild)) {
                    // if the cache hasn't been made for this guild yet, create one
                    this.cache.set(guild, new Collection<string, Warn>)
                }
                const guildWarnings = this.cache.get(guild) ?? new Collection<string, Warn>()
                guildWarnings.set(result.id, warning)
            }
        } catch(e) {
            if (e instanceof PrismaClientKnownRequestError) {
                throw handlePrismaError(e)
            }
        }

        return result ? true : false
    }

    /**
     * Remove a warning from a guild's warning list
     * @param guild guild to remove warning from
     * @param warningID ID of warning to remove
     * @returns Removed warning object.
     */
    async remove(guild: Guild, warningID: string, target: GuildMember): Promise<Warn | null> {
        // check for cached warn data
        const cacheExists = this.cache.has(guild)
        let warn: Warn | undefined
        if(!cacheExists) {
            // get ALL cache data from db, if any exists
            const guildWarnings = await this.getGuildWarnings(guild)

            warn = guildWarnings.get(warningID)
            if(!warn) {
                // warning doesn't exist!
                console.warn(`Warning with ID ${warningID} doesn't exist on server ${guild}`)
                return null
            }
        } else {
            if(!this.cache.get(guild)?.has(warningID)) {
                // check the database for the warn instead
                const result = await this.db.warn.findUnique({
                    where: {
                        id: warningID
                    }
                })

                if (!result) {
                    console.warn(`Warning with ID ${warningID} doesn't exist on server ${guild}`)
                    return null
                }

                const member = guild.members.cache.get(result.targetId) ?? await guild.members.fetch(result.targetId)
                const mod = guild.members.cache.get(result.mod) ?? await guild.members.fetch(result.mod)
                
                warn = new Warn(guild.id, result.id, result.severity, result.expiration, member, mod, result.reason, WarnStatus.Inactive, result.date)
            } else {
                warn = this.cache.get(guild)!.get(warningID)!
            }

        }

        if (warn.member?.id !== target.id) {
            console.warn(`Warning ${warningID} does not correspond to given member ${target} (Guild: ${guild})`)
            return null
        }
        
        warn.updateStatus(WarnStatus.Inactive)

        try {
            // update DB in the background
            this.writeWarnData({ id: warn.uuid, status: warn.getStatus() })
        } catch(e) {
            if (e instanceof PrismaClientKnownRequestError) {
                throw handlePrismaError(e)
            }
        }

        return warn
    }

    /**
     * 
     * @param guild guild to use for warning retrieval
     * @param member member to get warnings for
     * @param forceUpdate whether or not to forcibly check the database
     * @param getAllWarns whether or not to get inactive warns
     * @returns 
     */
    async getMemberWarnings(guild: Guild, member: GuildMember, forceUpdate: boolean = false, getAllWarns: boolean = false): Promise<Warn[]> {
        if (!this.cache.has(guild)) {
            // cache-miss, hit the db
            const guildWarnings = await this.getGuildWarnings(guild)
            if(isNullishOrEmpty(guildWarnings)) {
                this.cache.set(guild, guildWarnings)
                return []
            }

            const memberWarnings = guildWarnings.filter((warn) => getAllWarns ? warn.member?.id === member.id : warn.member?.id === member.id && warn.getStatus() === WarnStatus.Active)
            return isNullishOrEmpty(memberWarnings) ? [] : [...memberWarnings.values()]
        }

        if (forceUpdate) {
            // forcibly check the database to get the latest data for this member
            try {
                const memberWarnings = await this.db.warn.findMany({
                    where: { targetId: member.id }
                })

                let result: Warn[]
                if (memberWarnings.length > 0) {
                    for(const warn of memberWarnings) {
                        const moderator = container.client.guilds.resolve(guild).members.cache.get(warn.mod) ?? await container.client.guilds.resolve(guild).members.fetch(warn.mod)
                        let warning = new Warn(warn.guildId, warn.id, warn.severity, warn.expiration, member, moderator, warn.reason, warn.status, warn.date)
                        
                        this.cache.get(guild)?.set(warning.uuid, warning)
                    }

                    const cacheWarnings = this.cache.get(guild)?.filter((warn) => warn.member?.id === member.id).values()
                    result = cacheWarnings ? [...cacheWarnings] : []
                } else {
                    // no warnings exist for the user, we can return an empty array
                     result = []
                }
                return result
            } catch(err) {
                if (err instanceof PrismaClientKnownRequestError) {
                    throw handlePrismaError(err)
                } else {
                    throw err
                }
            }
        } else {
            const memberWarnings = this.cache.get(guild)?.filter((warn) => getAllWarns ? warn.member?.id === member.id : warn.member?.id === member.id && warn.getStatus() === WarnStatus.Active)
            return isNullishOrEmpty(memberWarnings) ? [] : [...memberWarnings.values()]
        }
    }

    public async getGuildWarnings(guild: Guild): Promise<Collection<string, Warn>> {
        const result = await this.db.guildWarns.findUnique({
            select: {
                warns: true
            },
            where: {
                id: guild.id
            }
        })

        if (!result || result.warns.length === 0) {
            console.warn(`No warning data exists for this server (Guild: ${guild})`)
            // TODO: return empty collection or null?
            return new Collection<string, Warn>()
        }

        const guildWarnList: Collection<string, Warn> = new Collection()
        for(const warn of result.warns) {
            const target = guild.members.cache.get(warn.targetId) ?? await guild.members.fetch(warn.targetId)
            const mod = guild.members.cache.get(warn.mod) ?? await guild.members.fetch(warn.mod)

            const warnObj = new Warn(guild.id, warn.id, warn.severity, warn.expiration, target, mod, warn.reason, warn.status, warn.date)
            guildWarnList.set(warnObj.uuid, warnObj)
        }

        this.cache.set(guild, guildWarnList)
        return guildWarnList
    }

    /**
     * Update database with current warn information
     * @param updateData updated warn object data
     */
    private async writeWarnData(updateData: WarnUpdateData) {
        await this.db.warn.update({
            where: {
                id: updateData.id
            }, 
            data: {
                guildId: updateData.guildID,
                expiration: updateData.expiration,
                targetId: updateData.target?.toString() || undefined,
                mod: updateData.mod?.toString() || undefined,
                reason: updateData.reason,
                severity: updateData.severity,
                status: updateData.status,

            }
        })
    }
}

type WarnUpdateData = {
	id?: string,
	guildID?: string,
	severity?: number,
	expiration?: string,
	target?: GuildMember,
	mod?: GuildMember,
	reason?: string,
	status?: string
}
