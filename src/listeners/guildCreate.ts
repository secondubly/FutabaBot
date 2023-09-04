import { Timestamp } from "#lib/structures/classes/Timestamp";
import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import type { Guild } from "discord.js";

@ApplyOptions<Listener.Options>({
    event: Events.GuildCreate
})
export class UserEvent extends Listener {
    public override async run(guild: Guild) {
        console.log(`Joined guild ${guild.id}`)
        // if guild is blacklisted, then insta-leave
        // TODO: build out

        // Get Guild Info
        const botCount = guild.members.cache.filter((member) => member.user.bot).size
        const userCount = guild.members.cache.filter((member) => !member.user.bot).size
        const serverCreatedTimestamp = new Timestamp(guild.createdTimestamp)
        const owner = await this.container.client.users.fetch(guild.ownerId)
        const me = guild.members.me ?? (await guild.members.fetch(this.container.client.user!.id))

        let permissions = me.permissions.toArray()
        if (permissions.includes('Administrator')) {
            permissions = ['Administrator']
        }

        this.container.settings.createDefaultSettings(guild.id)

        const description = `
        Guild name: ${guild.name} (${guild.id})
        Created On: ${serverCreatedTimestamp.getLongDateTime()} (${serverCreatedTimestamp.getRelativeTime()})
        Owner: ${owner} (ID: ${owner.id} // Tag ${owner.tag})
        Total Members: ${guild.memberCount}
        Bots: ${botCount}
        Users: ${userCount}
        Channel Count: ${guild.channels.cache.size}
        Role Count: ${guild.roles.cache.size}
        Partnered: ${guild.partnered} | Verified: ${ guild.verified}
        Permissions: ${permissions.map((p) => `\`${p}\``).join('|') || 'No key permissions'}
        `

        console.info(description)
    }
}