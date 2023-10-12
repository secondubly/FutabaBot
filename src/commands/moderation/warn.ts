import { Color, Emojis, FutabaSettings, WarnSeverity, WarnStatus } from '#lib/constants'
import { Warn } from '#lib/moderation/structures/Warn'
import { Timestamp } from '#lib/structures/classes/Timestamp'
import { FutabaCommand } from '#lib/structures/commands/FutabaCommand'
import { WarnAction, WarnActionData } from '#lib/types/Data'
import { runAllChecks } from '#lib/util/discord/discord'
import { mins } from '#lib/util/functions/duration'
import { getGuildIds } from '#lib/util/utils'
import { ApplyOptions } from '@sapphire/decorators'
import { PaginatedMessageEmbedFields, isGuildMember } from '@sapphire/discord.js-utilities'
import { Duration, DurationFormatter } from '@sapphire/duration'
import { Subcommand } from '@sapphire/plugin-subcommands'
import { PermissionFlagsBits, type APIApplicationCommandOptionChoice, GuildTextBasedChannel, Collection, GuildMember, EmbedBuilder } from 'discord.js'
import { randomUUID } from 'node:crypto'
import { cutText, isNullishOrEmpty } from '@sapphire/utilities'
import { ButtonPaginated } from '#lib/structures/classes/ButtonPaginated'
import { groupBy } from '#lib/utils'
import { handlePrismaRequestError } from '#lib/database/utils'
import { WarnAction as WarnActionPayload } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { FutabaEvents } from '#lib/types/Events'

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
			chatInputRun: 'chatInputListAll'
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

	private readonly warnActions: APIApplicationCommandOptionChoice<WarnAction>[] = [
		{ name: 'Kick', value: 'kick' },
		{ name: 'Ban', value: 'ban' },
		{ name: 'Softban', value: 'softban' },
		{ name: 'Timeout', value: 'timeout' }
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
				.addSubcommand((command) =>
					command
						.setName('list')
						.setDescription('List warns for a member')
						.addUserOption((option) =>
							option
								.setName('target')
								.setDescription('The member to list warns for')
								.setRequired(true)
						)
						.addBooleanOption((command) =>
							command
								.setName('warn_filter')
								.setDescription('Show inactive warns as well? (Default: false)')
								.setRequired(false)
						)
				)
				.addSubcommand((command) =>
					command
						.setName('list_all')
						.setDescription('Lists all warns of all members.')
						.addBooleanOption((command) =>
						command
							.setName('warn_filter')
							.setDescription('Show inactive warns as well? (Default: false)')
							.setRequired(false)
						)
				)
				.addSubcommandGroup((group) =>
					group
						.setName('action')
						.setDescription('Perform automated actions based on warns')
						.addSubcommand((command) =>
							command
								.setName('create')
								.setDescription('Create a new automated action.')
								.addStringOption((option) =>
									option //
										.setName('action')
										.setDescription('The action to perform')
										.setRequired(true)
										.setChoices(...this.warnActions)
								)
								.addIntegerOption((option) =>
									option //
										.setName('severity')
										.setDescription('The severity at which the action should be triggered [1 - 250]')
										.setMinValue(1)
										.setMaxValue(250)
										.setRequired(true)
							)
							.addStringOption((option) =>
								option //
									.setName('duration')
									.setDescription('The duration of the action (only for Timeout)')
									.setRequired(false)
									
							)
						)
						.addSubcommand((builder) =>
							builder //
								.setName('remove')
								.setDescription('Remove an automated action')
								.addIntegerOption((option) =>
									option //
										.setName('severity')
										.setDescription('The severity trigger of the action')
										.setMinValue(1)
										.setMaxValue(250)
										.setAutocomplete(true)
										.setRequired(true)
								)
						)
						.addSubcommand((builder) =>
							builder //
								.setName('list')
								.setDescription('List all automated actions')
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

	public async chatInputList(interaction: FutabaCommand.ChatInputCommandInteraction) {
		return this.list(interaction)
	}

	public async chatInputListAll(interaction: FutabaCommand.ChatInputCommandInteraction) {
		return this.listAll(interaction)
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
		const warn = new Warn(interaction.guild.id, warnId, severity, expirationDate, member, moderator, reason)

		const success = await this.container.warns.add(interaction.guild, warn)

		if (!success) {
			return interaction.reply({
				content: `${Emojis.SweatSmile} Something went wrong! Please try your request again.`
			})
		}

		let userWarnings: Warn[] = []
		try {
			userWarnings = await this.container.warns.getMemberWarnings(interaction.guild, member)
		} catch(err) {
			if (err instanceof PrismaClientKnownRequestError) {
				console.error(handlePrismaRequestError(err))
				return interaction.reply({
					content: `${Emojis.SweatSmile} Something went wrong! Please try your request again.`
				})
			} else {
				throw err
			}
		}

		const totalSeverity = userWarnings.reduce((acc: number, warn: Warn) => acc + warn.severity, 0) ?? severity
		const totalWarns = userWarnings.length
		const actions = await this.container.actions.getActions(interaction.guild)


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

		const data: WarnActionData = {
			warnId: warn.uuid,
			target: member,
			moderator,
			duration: new Timestamp(expirationDate.getTime()),
			reason,
			severity,
			action: 'warn'
		}

		
		if (await this.container.settings.hasSetting(interaction.guild.id, FutabaSettings.ModLogs)) {
			this.container.client.emit(FutabaEvents.ModAction, data)
		}

		if(!isNullishOrEmpty(actions)) {
			this.container.client.emit('warnAction', member, totalSeverity, actions)
		}


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

		let totalMemberWarns: number = 0
		try {
			const totalWarns = await this.container.warns.getMemberWarnings(interaction.guild, member)
			totalMemberWarns = totalWarns.length
		} catch(err) {
			if (err instanceof PrismaClientKnownRequestError) {
				console.error(handlePrismaRequestError(err))
				return interaction.reply({
					content: `${Emojis.SweatSmile} Something went wrong! Please try your request again.`
				})
			} else {
				throw err
			}
		}

		
		const response = `${member} had their warning removed.\n*They now have ${totalMemberWarns === 1 ? `${totalMemberWarns} warning` : `${totalMemberWarns} warnings`}.*`

		return interaction.reply({ content: response, ephemeral: true})
	}

	private async list(interaction: FutabaCommand.ChatInputCommandInteraction) {
		const member = interaction.options.getMember('target')
		const listAll = interaction.options.getBoolean('warn_filter') ?? false

		if (!member || !isGuildMember(member)) {
			return interaction.reply({
			content: `${Emojis.Cross} You must specify a valid member that is in this server!`,
				ephemeral: true
			});
		}
		
		let memberWarns: Warn[] = []
		try {
			memberWarns = await this.container.warns.getMemberWarnings(interaction.guild, member, undefined, listAll)
		} catch (err) {
			if (err instanceof PrismaClientKnownRequestError) {
				console.error(handlePrismaRequestError(err))
				return interaction.reply({
					content: `${Emojis.SweatSmile} Something went wrong! Please try your request again.`
				})
			} else {
				throw err
			}
		}

		if(isNullishOrEmpty(memberWarns)) {
			return interaction.reply({
				content: `${member} has no warnings.`,
				ephemeral: true
			})
		}

		const warnCount = memberWarns.length
		const embeds = await Promise.all(
			memberWarns.map(async (warn: Warn) => {
				const mod = await this.container.client.users.fetch(warn.mod!)
				const expiration = new Timestamp(warn.expiration.getTime())
				const createDate = new Timestamp(warn.created.getTime())

				return {
					name: `Warn ID: ${warn.uuid}`,
					value:
						`> Reason: ${warn.reason}\n> Given on ${createDate.getShortDateTime()} (${createDate.getRelativeTime()})` +
						`\n> Severity: \`${warn.severity}\`` +
						`\n> Expires ${expiration.getRelativeTime()} (${expiration.getShortDateTime()})` +
						`\n> Moderator: ${mod} (\`${mod.id}\`)`,
					inline: false
				}
			})
		)

		const template = new EmbedBuilder()
			.setTitle(`${member.user.tag}`)
			.setColor(Color.Moderation)
			.setDescription(`${member} has ${warnCount} ${warnCount === 1 ? `warning` : `warnings`}`)
			.setFooter({ text: `Active warnings of ${member.displayName}`})
			.setTimestamp()
			.setThumbnail(member.displayAvatarURL({ forceStatic: true }))


			const paginatedMessageFields = new PaginatedMessageEmbedFields()
				.setTemplate(template)
				.setItems(embeds)
				.setItemsPerPage(2)
				.make()
		
		return paginatedMessageFields.run(interaction).catch(() => null)

	}

	private async listAll(interaction: FutabaCommand.ChatInputCommandInteraction) {
		const listAll = interaction.options.getBoolean('warn_filter') ?? false
		const guildWarns = await this.container.warns.getGuildWarnings(interaction.guild)
		if (guildWarns.size === 0) {
			return interaction.reply({
				content: `${interaction.guild} has no warnings.`,
				ephemeral: true
			})
		}

		let filteredWarns = listAll ? guildWarns : guildWarns.filter((w: Warn) => w.getStatus() === WarnStatus.Active)
		let groupedWarns = groupBy([...filteredWarns.values()], 'member') as Map<GuildMember, Warn[]>
		const paginatedEmbed = new ButtonPaginated()

		for (const [member, warn] of groupedWarns) {
			const target = await this.container.client.users.fetch(member.user.id)
			
			const embed = new EmbedBuilder()
				.setColor('Random')
				.setTitle('Server Infractions')
				.setAuthor({name: target.tag })
				.setDescription(this.generateDescription(warn))
				.setFooter({ text: `Requested by ${interaction.user.username}`})
				.setTimestamp()
				.setThumbnail(target.displayAvatarURL({ forceStatic: true }))
			
				paginatedEmbed.addPageEmbed(embed)
		}

		return paginatedEmbed.run(interaction)
	}

	public async chatInputActionCreate(interaction: FutabaCommand.ChatInputCommandInteraction) {
		const action = interaction.options.getString('action', true) as WarnAction
		const severity = interaction.options.getInteger('severity', true)
		let time = interaction.options.getString('duration')
		await interaction.deferReply()

		let content = `\nAction will be applied to any user who crosses the ${severity} severity threshold in warnings.`

		if(action === 'timeout' && !time) {
			return interaction.editReply(`Please provide a valid timeout duration!`)
		}
		
		let duration: number | undefined

		if (action === 'timeout' && time) { // the && time prevents typescript from complaining further down
			if (!isNaN(Number(time))) {
				time += 's'
			}

			duration = new Duration(time).offset

			if (isNaN(duration)) {
				return interaction.editReply(`${Emojis.Cross} Invalid duration! Valid examples: \`1 week\`, \`1h\`, \`10 days\`, \`5 hours\``)
			}

			const MAX_TIMEOUT_DURATION = new Duration('28d').offset;

			if (duration > MAX_TIMEOUT_DURATION) {
				return interaction.editReply(`${Emojis.Cross} You cannot time out a member for more than 28 days!`)
			}
		}

		const result = await this.container.actions.add({action, severity, expiration: duration}, interaction.guild)

		if (result === undefined) {
			return interaction.editReply({
				content: `You have 10 actions already! There is a limit of 10 actions\nRemove actions in order to create a new one!`
			})
		}

		if (result === null) {
			return interaction.editReply({
				content: `${Emojis.Cross} An action already exists for severity ${severity}`
			})
		}

		if (time && action !== 'timeout') {
			content += `\n\n> Note: The duration will be ignored since the action is not a timeout.`
		}


		const timeoutContent = time && action === 'timeout' ? `\n\n with a duration of __${new DurationFormatter().format(duration!)}__`: '.'

		return interaction.editReply({
			content: `${Emojis.Confirm} Successfully added a ${action} action${timeoutContent}\n${content}`
		});
	}

	public async chatInputActionRemove(interaction: FutabaCommand.ChatInputCommandInteraction) {
		const severity = interaction.options.getInteger('severity', true)

		let removed: WarnActionPayload | null | undefined = null
		try {
			removed = await this.container.actions.remove(interaction.guild, severity)
		} catch(e) {
			if (e instanceof PrismaClientKnownRequestError) {
				if(e.code === 'P2025') {
					removed = undefined
				}
                console.error(handlePrismaRequestError(e))
            }
		}

		if (!removed) {
			return interaction.reply({
				content: 'No action found for this severity',
				ephemeral: true
			});
		}

		return interaction.reply({ content: `${Emojis.Confirm} Successfully removed the ${removed.action} action for ${removed.severity} severity` })
	}

	public async chatInputActionList(interaction: FutabaCommand.ChatInputCommandInteraction) {
		const guildActions = await this.container.actions.getActions(interaction.guild)

		if (guildActions.length === 0) {
			return interaction.reply({
				content: `${interaction.guild} has no automated actions.`,
				ephemeral: true
			})
		}

		const template = new EmbedBuilder()
			.setTitle('Warn Actions')
			.setColor(Color.Moderation)
			.setDescription('Actions that will be applied to users who cross the given severity threshold in warnings')
			.setFooter({ text: interaction.guild.name })
			.setTimestamp()
			.setThumbnail(interaction.guild.iconURL())

		const embedFields = guildActions.map((action) => {
			return {
				name: `Severity: ${action.severity}`,
				value: `> Action: ${action.action as WarnAction} ${action.expiration ? `[${new DurationFormatter().format(action.expiration)}]` : ''}`,
				inline: false
			}
		})
		
		const paginatedMessageFields = new PaginatedMessageEmbedFields()
			.setTemplate(template)
			.setItems(embedFields)
			.setItemsPerPage(2)
			.make()

		return paginatedMessageFields.run(interaction).catch(() => null)
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

			let memberWarnings: Warn[] = []
			try {
				memberWarnings = await this.container.warns.getMemberWarnings(interaction.guild!, member)
			} catch (err) {
				if (err instanceof PrismaClientKnownRequestError) {
					console.error(handlePrismaRequestError(err))
					return this.noAutoCompleteResults(interaction, 'warning')
				} else {
					throw err
				}
			}

			if(isNullishOrEmpty(memberWarnings)) {
				return this.noAutoCompleteResults(interaction, 'warning')
			}

			const warnIds = memberWarnings.map((warn: Warn) => warn.uuid)
			if(isNullishOrEmpty(warnIds)) {
				// shouldn't ever fire honestly
				return this.noAutoCompleteResults(interaction, 'warning')
			}

			const choices: APIApplicationCommandOptionChoice[] = []
			for(const warnId of warnIds) {
				const matchingWarn = memberWarnings.find((m: Warn) => m.uuid === warnId)

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

	private generateDescription(warn: Warn[]): string {
		return warn.map((w) => {
			const givenDate = new Timestamp(w.created.getTime()).getShortDate()
			return `\` - \` Date: ${givenDate} \`|\` Reason: ${w.reason}`
		})
		.join('\n')
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