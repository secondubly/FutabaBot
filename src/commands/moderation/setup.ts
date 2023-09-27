import { Color, FutabaSettings } from "#lib/constants";
import { FutabaCommand } from "#lib/structures/commands/FutabaCommand";
import { PermissionLevels } from "#lib/types/Enum";
import { mins, sec } from "#lib/util/functions/duration";
import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder, 
    Message, 
    PermissionFlagsBits,
    PermissionsBitField,
    type APIRole, 
    Collection, 
    Role, 
    TextChannel, 
    MessageComponentInteraction, 
    RoleSelectMenuBuilder, 
    ChannelSelectMenuBuilder, 
    ChannelType, 
    OverwriteType, 
    OverwriteResolvable,
    Channel} from "discord.js";

@ApplyOptions<FutabaCommand.Options>({
    description: 'Set up moderation-related tools for Futaba.',
    cooldownDelay: sec(60),
    cooldownLimit: 2,
    permissionLevel: PermissionLevels.Administrator
})
export class UserCommand extends FutabaCommand {
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder //
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        )
    }


    public override async chatInputRun(interaction: FutabaCommand.ChatInputCommandInteraction) {
        let step = 0;
        let msg: Message = (await interaction.reply({
            embeds: [this.start()],
            fetchReply: true,
            components: [this.startButtons()]
        }))

        const collector = msg.createMessageComponentCollector({ time: mins(3) })

        let modRoles: Collection<string, Role | APIRole>, adminRoles: Collection<string, Role | APIRole>
        let modLogChannel: TextChannel | undefined

        collector.on('collect', async (res) => {
            if(res.user.id !== interaction.user.id) {
                await res.followUp({
                    content: `Hey, you're not the right person... <:futabastare:1155903230082027630>`
                })
            }

            switch(res.customId) {
                case 'not-ready':
                        await res.update({
                            content: `No problem! Whenever you're ready just rerun \`\\setup\`!`,
                            embeds: [],
                            components: []
                        })
                        break
                case 'start':
                    collector.resetTimer()
                    step = 1
                    await this.step1(res, msg, step)
                    break
                case 'mod_roles':
                    step = 2
                    collector.resetTimer()
                    if(!res.isRoleSelectMenu()) {
                        break
                    }
                    modRoles = res.roles
                    msg = await this.step2(res, msg, step)
                    break
                case 'admin_roles':
                    step = 3
                    collector.resetTimer()
                    if (!res.isRoleSelectMenu()) {
                        break
                    }
                    adminRoles = res.roles
                    const match = adminRoles.some((r) => modRoles.has(r.id))
                    if (match) {
                        await res.reply({
                            content: `Moderator roles and Administrator roles cannot be the same!`,
                            ephemeral: true
                        })
                        break
                    }
                    msg = await this.step3(res, msg, step)
                    break
                case 'retry_modlog':
                    collector.resetTimer()
                    modLogChannel = undefined
                    msg = await this.step3(res, msg, step) // rerun step 3
                    break
                // @ts-expect-error (ignore the fall-through here, it's for simplicity)
                case 'modlog_channel':
                    if (!res.isChannelSelectMenu()) {
                        break
                    }
                    modLogChannel = res.channels.first() as TextChannel
                case 'confirm_modlog':
                    step = 4
                    const isPrivate = modLogChannel!.permissionsFor(interaction.guild.roles.everyone).has(PermissionFlagsBits.ViewChannel)
                    const edit = await modLogChannel!.edit({
                        permissionOverwrites: permissions(!isPrivate)
                    }).catch((async () => {
                        await res.channel!.send(
                            `I am unable to edit the permissions of ${modLogChannel}. Please grant me admin permissions or click on “Make a new modlog.”`
                        )
                        return null
                    }))

                    if (edit) {
                        collector.stop('Moderation setup complete')
                    } else {
                        step = 3
                        collector.resetTimer()
                        modLogChannel = undefined
                        msg = await this.step3(res, msg, step)
                    }
                    break
                case 'make_modlog':
                    const hasPerms = interaction.guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels)
                    if (!hasPerms) {
                        await res.followUp({
                            content: `I don't have the permissions to create channels!\nPlease give me the \`Manage Channels\` permission.`,
                            ephemeral: true
                        })
                        return
                    }
                
                    collector.resetTimer()
                    modLogChannel = undefined
                    step = 4
                    msg = await this.step4(res, msg, step)
                    break
                
                case 'public_modlog':
                case 'private_modlog':
                    modLogChannel = await makeModLogChannel(res.customId === 'private_modlog').catch(async () => {
                        collector.stop()
                        await res.followUp({
                            content: 
                            `I couldn't create the moderation log channel due to insufficient permissions!\nPlease try again after granting ` +
                            `\`Manage Channels\` ([)To create the channel), \`Manage Roles\` ([)To configure channel permissions), \`Embed Links and Send Messages\` ([)To send logs to channel) permissions to me!\n` +
                            `**Note:** I need a role other than \`@everyone\` with the mentioned permissions!`,
                            ephemeral: true
                        })
                        return undefined
                    })
                    collector.stop('Moderation setup complete')
                    step = 5
                    break
            }
        })
        
        collector.on('end', async(_, reason) => {
            if (reason === 'not-ready') {
                return;
            }

            if (reason === 'Moderation setup complete') {
                // add data to cache
                this.container.settings.updateSetting(interaction.guildId, FutabaSettings.ModLogs, modLogChannel?.id)
                this.container.settings.updateSetting(interaction.guildId, 'admin_roles', adminRoles.map((a) => a.id))
                this.container.settings.updateSetting(interaction.guildId, 'mod_roles', modRoles.map((m) => m.id))

                const results = new EmbedBuilder()
                    .setColor(Color.Admin)
                    .setTitle('Overview')
                    .setDescription('Here is a quick overview of your setup.')
                    .setFields([
                        {
                            name: 'Moderator Roles',
                            value: modRoles.map((r) => r).join(', '),
                            inline: true
                        },
                        {
                            name: 'Admin',
                            value: modRoles.map((r) => r).join(', ') || 'None',
                            inline: true
                        },
                        {
                            name: 'Moderation Logs Channel',
                            value: modLogChannel ? `${modLogChannel}` : 'None'
                        }
                    ])
                    .setTimestamp()
                    .setAuthor({
                        name: interaction.user.globalName ?? interaction.user.username,
                        iconURL: interaction.user.displayAvatarURL({ forceStatic: false })
                    })
                    
                await msg.edit({
                    content: `Setup complete!`,
                    embeds: [results],
                    components: []
                })
                return
            }

            await msg.edit({
                content: `Setup failed due to inactivity`,
                embeds: [],
                components: []
            })
        })

        function permissions(isPrivate: boolean): OverwriteResolvable[] {
            let permissionOvewrites: OverwriteResolvable[] = []
            
            if (isPrivate) {
                permissionOvewrites = [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel], 
                        type: OverwriteType.Role
                    },
                    {
                        id: interaction.client.user.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel, 
                            PermissionsBitField.Flags.SendMessages, 
                            PermissionsBitField.Flags.EmbedLinks,
                            PermissionsBitField.Flags.ManageChannels,
                            PermissionsBitField.Flags.ManageRoles
                        ],
                        type: OverwriteType.Member
                    }
                ]

                const memberPermissions = (id: string, mod: boolean): OverwriteResolvable => {
                    return {
                        id,
                        allow: [PermissionsBitField.Flags.ViewChannel],
                        deny: mod ? [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ManageRoles] : [],
                        type: OverwriteType.Role
                    }
                }

                for (const mod of modRoles.keys()) {
                    permissionOvewrites.push(memberPermissions(mod, true))
                }

                for (const admin of adminRoles.keys()) {
                    permissionOvewrites.push(memberPermissions(admin, false))
                }
            } else {
                permissionOvewrites = [
                    {
                        id: interaction.guild.id,
                        allow: [PermissionsBitField.Flags.ViewChannel], 
                        deny: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ManageRoles, PermissionsBitField.Flags.SendMessages],
                        type: OverwriteType.Role
                    },
                    {
                        id: interaction.client.user.id,
                        allow: [
                            PermissionsBitField.Flags.SendMessages, 
                            PermissionsBitField.Flags.EmbedLinks,
                            PermissionsBitField.Flags.ManageChannels,
                            PermissionsBitField.Flags.ManageRoles
                        ],
                        type: OverwriteType.Member
                    }
                ]
            }

            return permissionOvewrites
        }

        async function makeModLogChannel(isPrivate: boolean): Promise<TextChannel> {
            const modLog = await interaction.guild?.channels.create({
                name: 'mod-logs',
                type: ChannelType.GuildText,
                topic: `Moderation logs for ${interaction.guild?.name}`,
                permissionOverwrites: permissions(isPrivate)
            })

            return modLog
        }
    }


    private start() {
        return new EmbedBuilder()
            .setColor(Color.Admin)
            .setTitle('Futaba Moderation Tools Setup')
            .setDescription('This is the setup wizard for Futaba’s moderation tools.')
            .setThumbnail(this.container.client.user?.displayAvatarURL() ?? '')
    }

    /**
     * Select moderator roles
     * @param interaction 
     * @param prevMessage 
     * @returns 
     */
    private step1(interaction: MessageComponentInteraction, prevMessage: Message, _stage: number): Promise<Message> {
        const embed = new EmbedBuilder(prevMessage.embeds[0].data).setFields([
            {
                name: `What are the moderator roles for this server? (Min: 1, Max: 3)`,
                value: `Only the **selected** roles will be considered moderators.`
            }
        ])

        const rolesMenu = new RoleSelectMenuBuilder()
            .setCustomId('mod_roles')
            .setPlaceholder('Select moderator roles:')
            .setMinValues(1)
            .setMaxValues(3)

        const row = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(rolesMenu)

        return interaction.update({
            embeds: [embed],
            components: [row],
            fetchReply: true
        }) as Promise<Message>
    }

    private step2(interaction: MessageComponentInteraction, prevMessage: Message, _step: number): Promise<Message> {
        const embed = new EmbedBuilder(prevMessage.embeds[0].data).setFields([
            {
                name: `What are the admin roles for this server? (Min: 0, Max: 2)`,
                value: `Only the **selected** roles will be considered admins.\n` +
                `**Important**: Moderation roles and Admin roles __cannot__ be the same.`
            }
        ])

        const rolesMenu = new RoleSelectMenuBuilder()
            .setCustomId('admin_roles')
            .setPlaceholder('Select administrator roles:')
            .setMinValues(0)
            .setMaxValues(2)

        return interaction.update({
            embeds: [embed],
            components: [new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(rolesMenu)],
            fetchReply: true
        }) as Promise<Message>
    }

    private async step3(interaction: MessageComponentInteraction, prevMessage: Message, _step: number): Promise<Message> {
        const embed = new EmbedBuilder(prevMessage.embeds[0].data).setFields([
            {
                name: `Where should moderation logs be sent?`,
                value:
                `If you **don't have** a channel, you can tell me to create one!\n` +
                `If you **don't want** to have a mod log channel press confirm!`
            }
        ])

        const channelMenu = new ChannelSelectMenuBuilder()
            .setCustomId('modlog_channel')
            .setPlaceholder('Select Moderation logs channel:')
            .setMinValues(0)
            .setMaxValues(1)
            .setChannelTypes(ChannelType.GuildText)
        
        const channelMenuRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelMenu)

        const retry = new ButtonBuilder()
            .setCustomId('retry_modlog')
            .setLabel('Retry')
            .setStyle(ButtonStyle.Secondary)
        
        const create = new ButtonBuilder()
            .setCustomId('make_modlog')
            .setLabel('Make a new mod log channel')
            .setStyle(ButtonStyle.Primary)
        
        const confirm = new ButtonBuilder()
            .setCustomId('confirm_modlog')
            .setLabel('Confirm')
            .setStyle(ButtonStyle.Success)

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(retry, create, confirm)

        return interaction.update({
            embeds: [embed],
            components: [channelMenuRow, row],
            fetchReply: true
        }) as Promise<Message>
    }

    private async step4(interaction: MessageComponentInteraction, prevMessage: Message, _step: number): Promise<Message> {
        const embed = new EmbedBuilder(prevMessage.embeds[0].data).setFields([
            {
                name: `Who should be able to see the mod log channel?`,
                value:
                    `If the channel is __private__, only the moderators will be able to see it.\n` +
                    `If the channel is __public__, everyone will be able to see it.\n` +
                    `Please press the appropriate button\n` +
                    `> Note: I need \`Manage Channels\` and \`Manage Roles\` permissions to configure permissions ` +
                    `of the mod log channel on the @everyone role!\n` +
                    `> It is required that I should have a role other than @everyone!\n` +
                    `> Once created successfully, feel free to tune the permissions of the mod log channel`
            }
        ])

        const privateModLog = new ButtonBuilder()
            .setCustomId('private_modlog')
            .setLabel('Private')
            .setStyle(ButtonStyle.Primary)
        
        const publicModLog = new ButtonBuilder()
            .setCustomId('public_modlog')
            .setLabel('Public')
            .setStyle(ButtonStyle.Primary)

        return interaction.update({
            embeds: [embed],
            components: [new ActionRowBuilder<ButtonBuilder>().addComponents(privateModLog, publicModLog)],
            fetchReply: true
        }) as Promise<Message>
    }
    private startButtons(): ActionRowBuilder<ButtonBuilder> {
        const cancel = new ButtonBuilder()
            .setCustomId('not-ready')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:futabashrug:1155897058830594199>')
        
        const confirm = new ButtonBuilder()
            .setCustomId('start')
            .setLabel('Continue')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:oracle:1155897057714917558>')

        return new ActionRowBuilder<ButtonBuilder>().addComponents(cancel, confirm)
    }
    
}