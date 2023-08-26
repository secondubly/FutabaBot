// import { Emojis, WarnSeverity } from '#lib/constants'
// import { runAllChecks } from '#lib/util/discord/discord'
// import { ApplyOptions } from '@sapphire/decorators'
// import { isGuildMember } from '@sapphire/discord.js-utilities'
// import { Duration } from '@sapphire/duration'
// import type { Command } from '@sapphire/framework'
// import { Subcommand } from '@sapphire/plugin-subcommands'
// import type { APIApplicationCommandOptionChoice } from 'discord.js'

// @ApplyOptions<Subcommand.Options>({
// 	description: 'Manage warnings for a user',
// 	typing: true,
// 	requiredClientPermissions: ['ModerateMembers'],
// 	requiredUserPermissions: ['ModerateMembers'],
// 	cooldownDelay: 5000,
// 	cooldownLimit: 3,
// 	subcommands: [
// 		{
// 			name: 'add',
// 			chatInputRun: 'chatInputAdd'
// 		}
// 		// {
// 		// 	name: 'remove',
// 		// 	chatInputRun: 'chatInputRemove'
// 		// },
// 		// {
// 		// 	name: 'list',
// 		// 	chatInputRun: 'chatInputList'
// 		// },
// 		// {
// 		// 	name: 'list_all',
// 		// 	chatInputRun: 'listAll'
// 		// },
// 		// {
// 		// 	name: 'action',
// 		// 	type: 'group',
// 		// 	entries: [
// 		// 		{ name: 'create', chatInputRun: 'chatInputActionCreate' },
// 		// 		{ name: 'remove', chatInputRun: 'chatInputActionRemove' },
// 		// 		{ name: 'list', chatInputRun: 'chatInputActionList' }
// 		// 	]
// 		// }
// 	]
// })
// export class UserCommand extends Subcommand {
// 	private readonly severityChoices: APIApplicationCommandOptionChoice<warnSeverityNum>[] = [
// 		{ name: '1 | 1 day', value: 1 },
// 		{ name: '2 | 3 days', value: 2 },
// 		{ name: '3 | 1 week', value: 3 },
// 		{ name: '4 | 2 weeks', value: 4 },
// 		{ name: '5 | 4 weeks', value: 5 }
// 	]

// 	public override registerApplicationCommands(registry: Command.Registry) {
// 		registry.registerChatInputCommand((builder) => {
// 			builder
// 				.setName(this.name)
// 				.setDescription(this.description)
// 				.addSubcommand((command) =>
// 					command
// 						.setName('add')
// 						.setDescription('Warn a member')
// 						.addUserOption((option) =>
// 							option //
// 								.setName('target')
// 								.setDescription('The member to warn')
// 								.setRequired(true)
// 						)
// 						.addStringOption((option) =>
// 							option //
// 								.setName('reason')
// 								.setDescription('The reason for the warning')
// 								.setRequired(true)
// 						)
// 						.addBooleanOption((option) =>
// 							option //
// 								.setName('delete_messages')
// 								.setDescription('Should I delete the member’s messages? (default: false)')
// 								.setRequired(false)
// 						)
// 						.addStringOption((option) =>
// 							option //
// 								.setName('expiration')
// 								.setDescription('How long should the warning last? (default: 1 day)')
// 								.setRequired(false)
// 						)
// 						.addIntegerOption((option) =>
// 							option
// 								.setName('severity')
// 								.setDescription('Severity of the warning')
// 								.setRequired(false)
// 								.addChoices(...this.severityChoices)
// 						)
// 						.addBooleanOption((option) =>
// 							option
// 								.setName('silent')
// 								.setDescription('Should I inform the target? If set to true, no warning will be sent! (Default: false)')
// 								.setRequired(false)
// 						)
// 				)
// 		})
// 	}

// 	public async chatInputAdd(interaction: Subcommand.ChatInputCommandInteraction) {
// 		const member = interaction.options.getMember('target')
// 		const reason = interaction.options.getString('reason', true)

// 		if (!interaction.guild) return
// 		if (!isGuildMember(interaction.member)) {
// 			throw Error
// 		}
// 		if (!member || !isGuildMember(member)) {
// 			return interaction.reply({
// 				content: `${Emojis.Cross} You must specify a valid member that is in this server!`,
// 				ephemeral: true
// 			})
// 		}

// 		const { content: response, result } = runAllChecks(interaction.member, member, 'warn')
// 		if (!result || member.user.bot) {
// 			return interaction.reply({
// 				content: response || `${Emojis.Cross} Bots were not meant to be warned!`,
// 				ephemeral: true
// 			})
// 		}

// 		const deleteMsgs = interaction.options.getBoolean('delete_messages') ?? false
// 		const severity = (interaction.options.getInteger('severity') ?? 1) as warnSeverityNum
// 		const expires = interaction.options.getString('expiration') ?? expirationFromSeverity[severity]
// 		const silent = interaction.options.getBoolean('silent') ?? false

// 		if (isNaN(new Duration(expires).offset)) {
// 			return interaction.reply({
// 				content: `${Emojis.Cross} Invalid duration! Valid examples: \`1 week\`, \`1h\`, \`10 days\`, \`5 hours\``,
// 				ephemeral: true
// 			})
// 		}

// 		const expirationDuration = new Date(Date.now() + new Duration(expires).offset)
// 		// TODO: make class variable?
// 		const oneMonthLater = Date.now() + new Duration('28 days').offset
// 		if (expirationDuration.getTime() > oneMonthLater) {
// 			return interaction.reply({
// 				content: `${Emojis.Cross} Expiration cannot be more than 28 days`,
// 				ephemeral: true
// 			})
// 		}

// 		const underOneHour = Date.now() + new Duration('1 hour').offset
// 		if (expirationDuration.getTime() < underOneHour) {
// 			return interaction.reply({
// 				content: `${Emojis.Cross} Expiration cannot be less than 1 hour. Please use a longer duration.`,
// 				ephemeral: true
// 			})
// 		}
// 	}
// }

// const expirationFromSeverity = {
// 	1: WarnSeverity.One,
// 	2: WarnSeverity.Two,
// 	3: WarnSeverity.Three,
// 	4: WarnSeverity.Four,
// 	5: WarnSeverity.Five
// }

// type warnSeverityNum = 1 | 2 | 3 | 4 | 5
