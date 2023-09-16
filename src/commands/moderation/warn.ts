import { Color, Emojis, WarnSeverity } from '#lib/constants'
import { Warn } from '#lib/moderation/structures/Warn'
import { Timestamp } from '#lib/structures/classes/Timestamp'
import { FutabaCommand } from '#lib/structures/commands/FutabaCommand'
import { warnActionData } from '#lib/types/Data'
import { runAllChecks } from '#lib/util/discord/discord'
import { mins } from '#lib/util/functions/duration'
import { getGuildIds } from '#lib/util/utils'
import { ApplyOptions } from '@sapphire/decorators'
import { isGuildMember } from '@sapphire/discord.js-utilities'
import { Duration } from '@sapphire/duration'
import { Subcommand } from '@sapphire/plugin-subcommands'
import { PermissionFlagsBits, type APIApplicationCommandOptionChoice, GuildTextBasedChannel, Collection, GuildMember } from 'discord.js'
import { randomUUID } from 'node:crypto'
import { cutText, isNullishOrEmpty } from '@sapphire/utilities'

@ApplyOptions<Subcommand.Options>({
	description: 'Manage warnings for a user',
	typing: true,
	requiredClientPermissions: ['ModerateMembers'],
	requiredUserPermissions: ['ModerateMembers'],
	cooldownDelay: 5000,
	cooldownLimit: 3,
	subcommands: [
		{
			name: 'add',
			chatInputRun: 'chatInputAdd'
		},
		{
			name: 'remove',
			chatInputRun: 'chatInputRemove'
		},
		{
			name: 'list',
			chatInputRun: 'chatInputList'
		},
		{
			name: 'list_all',
			chatInputRun: 'listAll'
		},
		{
			name: 'action',
			type: 'group',
			entries: [
				{ name: 'create', chatInputRun: 'chatInputActionCreate' },
				{ name: 'remove', chatInputRun: 'chatInputActionRemove' },
				{ name: 'list', chatInputRun: 'chatInputActionList' }
			]
		}
	]
})

export class UserCommand extends Subcommand {
	private readonly severityChoices: APIApplicationCommandOptionChoice<warnSeverityNum>[] = [
		{ name: '1 | 1 day', value: 1 },
		{ name: '2 | 3 days', value: 2 },
		{ name: '3 | 1 week', value: 3 },
		{ name: '4 | 2 weeks', value: 4 },
		{ name: '5 | 4 weeks', value: 5 }
	]

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand((command) =>
					command
						.setName('add')
						.setDescription('Warn a member')
						.addUserOption((option) =>
							option //
								.setName('target')
								.setDescription('The member to warn')
								.setRequired(true)
						)
						.addStringOption((option) =>
							option //
								.setName('reason')
								.setDescription('The reason for the warning')
								.setRequired(true)
						)
						.addBooleanOption((option) =>
							option //
								.setName('delete_messages')
								.setDescription('Should I delete the member’s messages? (default: false)')
								.setRequired(false)
						)
						.addStringOption((option) =>
							option //
								.setName('expiration')
								.setDescription('How long should the warning last? (default: 1 day)')
								.setRequired(false)
						)
						.addIntegerOption((option) =>
							option //
								.setName('severity')
								.setDescription('Severity of the warning')
								.setRequired(false)
								.addChoices(...this.severityChoices)
						)
						.addBooleanOption((option) =>
							option //
								.setName('silent')
								.setDescription('Should I inform the target? If set to true, no warning will be sent! (Default: false)')
								.setRequired(false)
						)
				)
				.addSubcommand((command) =>
				command
					.setName('remove')
					.setDescription('Remove warning from a member.')
					.addUserOption((option) =>
						option
							.setName('target')
							.setDescription('The member to remove a warning from.')
							.setRequired(true)
					)
					.addStringOption((option) =>
						option
							.setName('warn_id')
							.setDescription('ID of the warning to remove.')
							.setRequired(true)
							.setAutocomplete(true)
					)
					.addStringOption((option) =>
						option
							.setName('reason')
							.setDescription('The reason for the removal')
							.setRequired(false)
					)
				)
		},
		{ guildIds: getGuildIds() })
	}

	public async chatInputAdd(interaction: FutabaCommand.ChatInputCommandInteraction) {
		return this.add(interaction)
	}

	public async chatInputRemove(interaction: FutabaCommand.ChatInputCommandInteraction) {
		return this.remove(interaction)
	} 

    private async add(interaction: FutabaCommand.ChatInputCommandInteraction) {
        const member = interaction.options.getMember('target')
		const reason = interaction.options.getString('reason', true)

        if (!interaction.channel || !interaction.guild) {
            return
        }

		if (!member || !isGuildMember(member)) {
			return interaction.reply({
				content: `${Emojis.Cross} You must specify a valid member that is in this server!`,
				ephemeral: true
			});
		}

		let { content: response, result } = runAllChecks(interaction.member, member, 'warn')
		if (!result || member.user.bot) {
			return interaction.reply({
				content: response || `${Emojis.Cross} Bots cannot be warned!`,
				ephemeral: true
			})
		}

		const deleteMsgs = interaction.options.getBoolean('delete_messages') ?? false
		const severity = (interaction.options.getInteger('severity') ?? 1) as warnSeverityNum
		const expiration = interaction.options.getString('expiration') ?? expirationFromSeverity[severity]
		const silent = interaction.options.getBoolean('silent') ?? false

		// validate duration
		if (isNaN(new Duration(expiration).offset)) {
			return interaction.reply({
				content: `${Emojis.Cross} Invalid duration! Valid examples: \`1 week\`, \`1h\`, \`10 days\`, \`5 hours\``,
				ephemeral: true
			})
		}

		const expirationDate = new Date(Date.now() + new Duration(expiration).offset)
		const ONE_MONTH_LATER = Date.now() + new Duration('28 days').offset
		if (expirationDate.getTime() > ONE_MONTH_LATER) {
			return interaction.reply({
				content: `${Emojis.Cross} Expiration  length cannot be more than 28 days.`,
				ephemeral: true
			});
		}
		
		const ONE_HOUR = Date.now() + new Duration('1 hour').offset
		if (expirationDate.getTime() < ONE_HOUR) {
			return interaction.reply({
				content: `${Emojis.Cross} Expiration cannot be less than 1 hour. Please use a longer duration.`,
				ephemeral: true
			})
		}

		const warnId = randomUUID()
		const moderator = interaction.member
		const warn = new Warn(interaction.guild.id, warnId, severity, expirationDate.toISOString(), member, moderator, reason)

		const success = await this.container.warns.add(interaction.guild, warn)

		if (!success) {
			return interaction.reply({
				content: `${Emojis.SweatSmile} Something went wrong! Please try your request again.`
			})
		}

		const userWarnings = await this.container.warns.getMemberWarnings(interaction.guild, member)
		const totalSeverity = userWarnings.reduce((acc, warn) => acc + warn.severity, 0) ?? severity
		const totalWarns = userWarnings.length
		const actions = await this.container.warns.getActions(interaction.guild)


		if(userWarnings.length === 0) {
			return interaction.reply({
				content: `${Emojis.SweatSmile} Something went wrong! Please try your request again.`
			})
		}

		response = `${member} has been warned for __${reason}__\nWarn ID: \`${warnId}\`\n*They now have ${totalWarns === 1 ? `${totalWarns} warning` : `${totalWarns} warnings`}*`
		if (!silent) {
			await member
				.send({
					content: `You have been warned in ${member.guild.name} for __${reason}__\n`
				}).catch(() => {
					response += `\n\n> ${Emojis.Cross} Couldn't DM member`
				})
		}

		await interaction.reply({ content: response, ephemeral: true })

		const data: warnActionData = {
			warnId: warn.uuid,
			target: member,
			moderator,
			duration: new Timestamp(expirationDate.getTime()),
			reason,
			severity,
			action: 'warn'
		}

		
		// TODO: log WarnActionData to a moderator logs channel

		if(deleteMsgs) {
			if (!interaction.guild.members.me?.permissions.has(PermissionFlagsBits.ManageMessages)) {
				return interaction.followUp({
					content: `${Emojis.SweatSmile} I don't have the \`Manage Messages\` permission, so I couldn't delete any messages.`,
					ephemeral: true
				})
			}
			const textChannels = interaction.guild.channels.cache.filter((c) => {
				c.isTextBased() && c.permissionsFor(interaction.guild.members.me!).has(PermissionFlagsBits.ManageMessages)
			}) as Collection<string, GuildTextBasedChannel>

			for (const channel of textChannels.values()) {
				const messages = await channel.messages.fetch({ limit: 15 }).catch(() => null)
				if (!messages) continue;
				for(const message of messages.filter((m) => m.author.id === member.id).values()) {
					if (!message) continue;
					if(message.deletable && (message.editedTimestamp ?? message.createdTimestamp) > Date.now() - mins(15)) {
						await message.delete().catch(() => null);
					}
				}

			}
		}
		
		return interaction.channel.send({
			embeds: [
				{
					description: `${member} has been warned.`,
					color: Color.Moderation
				}
			]
		})
    }

	private async remove(interaction: FutabaCommand.ChatInputCommandInteraction) {
		const member = interaction.options.getMember('target')
		const warnId = interaction.options.getString('warn_id', true)
		const reason = interaction.options.getString('string') ?? 'No reason provided.'

		if (!member) {
			return interaction.reply({
				content: `${Emojis.Cross} You must specify a valid member that is in this server!`,
				ephemeral: true
			});
		}

		const warn = await this.container.warns.remove(interaction.guild, warnId, member)
		if (!warn) {
			return interaction.reply({
				content:
					`That warning does not exist on ${member}\n` +
					`Possible reasons: \n` +
					`\` - \` The warning ID is incorrect\n` +
					`\` - \` The member has not been warned`
			});
		}

		const totalWarns = (await this.container.warns.getMemberWarnings(interaction.guild, member)).length

		
		const response = `${member} had their warning removed.\n*They now have ${totalWarns === 1 ? `${totalWarns} warning` : `${totalWarns} warnings`}.*`

		return interaction.reply({ content: response, ephemeral: true})
	}

	public override async autocompleteRun(interaction: FutabaCommand.AutoComplete) {
		const focus = interaction.options.getFocused(true)

		if(focus.name === 'warn_id') {
			const id = interaction.options.get('target')?.value as string
			if (!id) {
				return this.noAutoCompleteResults(interaction, 'warning')
			}

			const member = (await interaction.guild?.members.fetch(id).catch(() => null)) as GuildMember
			if (!member) {
				return this.noAutoCompleteResults(interaction, 'warning')
			}

			const memberWarnings = await this.container.warns.getMemberWarnings(interaction.guild!, member)
			if(isNullishOrEmpty(memberWarnings)) {
				return this.noAutoCompleteResults(interaction, 'warning')
			}

			const warnIds = memberWarnings.map((warn) => warn.uuid)
			if(isNullishOrEmpty(warnIds)) {
				// shouldn't ever fire honestly
				return this.noAutoCompleteResults(interaction, 'warning')
			}

			const choices: APIApplicationCommandOptionChoice[] = []
			for(const warnId of warnIds) {
				const matchingWarn = memberWarnings.find((m) => m.uuid === warnId)

				if (!matchingWarn) {
					continue
				}

				const modId = matchingWarn.mod?.id ?? this.container.client.user?.id
				if (!modId) {
					continue
				}

				const mod = await this.container.client.users.fetch(modId)
				const name = cutText(`${matchingWarn.uuid} | Mod: ${mod.tag} | Reason: ${matchingWarn.reason ?? 'N/A'}`, 100);

				choices.push({
					name,
					value: matchingWarn.uuid
				})
			}

			const filteredChoices = choices.filter((choice) => choice.name.toLowerCase().includes((focus.value as string).toLowerCase())).slice(0,24)

			return interaction.respond(filteredChoices)
		}
	}

	private noAutoCompleteResults(interaction: FutabaCommand.AutoComplete, autocompleteParam: string) {
		return interaction.respond([
			{
				name: `No ${autocompleteParam}s found`,
				value: ''
			}
		])
	}
}

const expirationFromSeverity = {
	1: WarnSeverity.One,
	2: WarnSeverity.Two,
	3: WarnSeverity.Three,
	4: WarnSeverity.Four,
	5: WarnSeverity.Five
}

type warnSeverityNum = 1 | 2 | 3 | 4 | 5