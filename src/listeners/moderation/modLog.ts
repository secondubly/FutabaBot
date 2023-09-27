import { BaseModActionData, ModActionData, WarnActionData } from "#lib/types/Data"
import { isTextChannel } from "@sapphire/discord.js-utilities"
import { Listener } from "@sapphire/framework"
import { isNullOrUndefined } from "@sapphire/utilities"
import { PermissionFlagsBits } from "discord.js"
import { Guild, EmbedBuilder, GuildBasedChannel, TextBasedChannel } from "discord.js"
import { ApplyOptions } from "@sapphire/decorators"
import { FutabaEvents } from "#lib/types/Events"
import { FutabaSettings, Severity } from "#lib/constants"
import { createModLog } from "#lib/util/functions/createDescription"

@ApplyOptions<Listener.Options>({
    event: FutabaEvents.ModAction
})
export class UserListener extends Listener {
    public override run(data: BaseModActionData) {
        return this.sendModLog(data)
    }

    private async sendModLog(data: ModActionData) {
        const desc = createModLog({
            member: data.target,
            action: data.action,
            reason: data.reason,
            duration: data.duration,
            warnId: (data as WarnActionData).warnId
        })

        const channelId = await this.container.settings.readSettings(data.moderator.guild.id, FutabaSettings.ModLogs) as string
        const embed = new EmbedBuilder()
            .setColor(Severity[data.action])
            .setAuthor({
                name: data.moderator.user.tag,
                iconURL: data.moderator.user.displayAvatarURL({ forceStatic: false })
            })
            .setDescription(desc)
            .setTimestamp()
        
        this.sendLogMsg(data.moderator.guild, channelId, embed)
    }

    private isValidChannel(guild: Guild, channel: GuildBasedChannel | null): boolean {        
        const me = guild.members.me!
        return !isNullOrUndefined(channel) && isTextChannel(channel) && channel.permissionsFor(me).has(PermissionFlagsBits.SendMessages)
    }

    public async sendLogMsg(guild: Guild, channel: string, embed: EmbedBuilder) {
        const modLogChannel = await guild.channels.fetch(channel)

        if (this.isValidChannel(guild, modLogChannel)) {
            const sent = await (modLogChannel as TextBasedChannel).send({ embeds: [embed] })

            const newEmbed = new EmbedBuilder()
                .setColor(embed.data.color!)
                .setAuthor(embed.data.author!)
                .setDescription(embed.data.description!)
                .setFooter({ text: `ID: ${sent.id}`})
                .setTimestamp()

            await sent.edit({
                embeds: [newEmbed]
            })

            return sent
        }

        return null
    }
}