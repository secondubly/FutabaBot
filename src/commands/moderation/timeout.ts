/*
Author: secondubly (hello@secondubly.tv)
timeout.ts (c) 2023
Desc: Send a user into timeout for misbehaving
Created:  2023-07-16T14:11:34.307Z
Modified: !date!
*/

import { ModerationCommand } from "#lib/moderation";
import { Timestamp, type FutabaCommand } from "#lib/structures";
import { ApplyOptions } from "@sapphire/decorators";
import type { Command } from "@sapphire/framework";
import { ApplicationCommandType } from "discord.js";
import { Emojis } from "#lib/constants";
import { runAllChecks } from "#lib/util/discord/discord";
import { Duration, DurationFormatter } from "@sapphire/duration"
import type { TimeoutActionData } from "#lib/types/Data";
@ApplyOptions<ModerationCommand.Options>({
    description: 'Send a user into timeout for misbehaving with optional duration.',
    requiredClientPermissions: ['ModerateMembers'],
    typing: true
})

export class UserCommand extends ModerationCommand {
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) => 
        builder
            .setName(this.name)
            .setDescription(this.description)
            .addUserOption((option) => 
                option
                    .setName('user')
                    .setDescription('Member to timeout')
                    .setRequired(true))
            .addStringOption((option) =>
                option
                    .setName('duration')
                    .setDescription('The duration of the timeout (defaults: 60 secs)')
                    .setRequired(false))
            .addBooleanOption((option) =>
                option
                    .setName('DM')
                    .setDescription('Send a DM to the timed out user (default: false)')
                    .setRequired(false))
        )

		// Register Context Menu command available from any message
		registry.registerContextMenuCommand({
			name: this.name,
			type: ApplicationCommandType.Message
		})

		// Register Context Menu command available from any user
		registry.registerContextMenuCommand({
			name: this.name,
			type: ApplicationCommandType.User
		})
    }

    public override async chatInputRun(interaction: FutabaCommand.ChatInputCommandInteraction) {
        await interaction.deferReply({ fetchReply: true });
        const member = interaction.options.getMember('user')
        const dm = interaction.options.getBoolean('dm') ?? false

        if (!member) {
            return interaction.editReply({
                content: `${Emojis.Cross} Please specify a valid member that is in this server.`
            })
        }

        // verify that member is timeout-able
        const { content, result } = runAllChecks(interaction.member, member, 'timeout')
        if (!result || member.user.bot) {
            return interaction.editReply({
                content: content || `${Emojis.Cross} I can’t time out another bot!`
            })
        }

        let time = interaction.options.getString('duration') || '60'
        if (!isNaN(Number(time))) {
            time += 's'
        }

        const duration = new Duration(time).offset
        if (isNaN(duration)) {
            return interaction.editReply({
                content: `${Emojis.Cross} Invalid duration. Valid examples: \`1d\`, \`1h\`, \`1m\`, \`1s\``
            })
        }

        const MAX_TIMEOUT_DURATION = new Duration('28d').offset

        if (duration > MAX_TIMEOUT_DURATION) {
            return interaction.editReply({
                content: `${Emojis.Cross} Max timeout duration is 28 days.` 
            })
        }

        const formatter = new DurationFormatter()
        let response = `${Emojis.Confirm} ${member} has been timed out for ${formatter.format(duration)}`

        const reason = interaction.options.getString('reason') ?? undefined
        await member.timeout(duration, reason)

        if (dm) {
            await member.send({
                content: `You have been timed out for ${formatter.format(duration)}.\nServer: ${interaction.guild.name}`
            }).catch(() => {
                response += `\n\n ${Emojis.Cross} Couldn't DM the guild member.`
                console.warn(`Couldn't DM member ${member.id} in server ${interaction.guild.id}`)
            })
        }

        return interaction.editReply(response)
    }
}