import { PermissionLevels } from '#lib/types/Enum'
import { OWNERS } from '#root/config'
import { PreconditionContainerArray } from '@sapphire/framework'
import { PermissionFlagsBits, 
	PermissionsBitField, 
	ChatInputCommandInteraction as ChatInputInteraction,
	ContextMenuCommandInteraction as CTXMenuCommandInteraction,
	UserContextMenuCommandInteraction as UserCTXMenuCommandInteraction,
	MessageContextMenuCommandInteraction as MessageCTXCommandInteraction, 
	AutocompleteInteraction} from 'discord.js'
import { Command } from '@sapphire/framework'

export abstract class FutabaCommand extends Command {
	/**
	 * Whether the command can be disabled.
	 */
	public readonly guarded?: boolean;
	/**
	 * Whether the command is hidden from everyone.
	 */
	public readonly hidden?: boolean;
	/**
	 * The permission level required to run the command.
	 */
	public readonly permissionLevel?: PermissionLevels;

	public constructor(context: Command.Context, options: FutabaCommand.Options) {
		const permissions = new PermissionsBitField(options.requiredClientPermissions).add(
			PermissionFlagsBits.SendMessages,
			PermissionFlagsBits.EmbedLinks,
			PermissionFlagsBits.ViewChannel
		)
		super(context, {
			cooldownDelay: 10000,
			cooldownLimit: 2,
			cooldownFilteredUsers: OWNERS,
			requiredClientPermissions: permissions,
			generateDashLessAliases: true,
			...options
		});

		(this.guarded = options.guarded ?? false),
		(this.hidden = options.hidden ?? false),
		(this.permissionLevel = options.permissionLevel ?? PermissionLevels.Everyone)
	}

	protected parseConstructorPreConditions(options: FutabaCommand.Options) {
		super.parseConstructorPreConditions(options)
		this.parseConstructorPreConditionsPermissionLevel(options)
	}

	protected parseConstructorPreConditionsPermissionLevel(options: FutabaCommand.Options) {
		if (options.permissionLevel === PermissionLevels.BotOwner) {
			this.preconditions.append('BotOwner')
			return
		}

		const container = new PreconditionContainerArray(['BotOwner'], this.preconditions)
		switch (options.permissionLevel ?? PermissionLevels.Everyone) {
			case PermissionLevels.Everyone:
				container.append('Everyone')
				break
			case PermissionLevels.Moderator:
				container.append
				break
			case PermissionLevels.Administrator:
				container.append('Administrator')
				break
			case PermissionLevels.ServerOwner:
				container.append('ServerOwner')
				break
			default:
				throw new Error(`Command[${this.name}]: permissionLevel specified was an invalid permission level: ${options.permissionLevel}`)
		}

		this.preconditions.append(container)
	}
}

export namespace FutabaCommand {
	// Options for FutabaCommands
	export type Options = Command.Options & {
		/* permission level required to run the command */
		permissionLevel?: number
		/* Whetehr the command can be disabled */
		guarded?: boolean
		/* Whether the command is hidden for everyone */
		hidden?: boolean
		/* command preconditions */
		preconditions?: ['GuildOnly'] // TODO: remove on production-ready
	}

	export type ChatInputCommandInteraction = ChatInputInteraction<'cached'>
	export type ContextMenuCommandInteraction = CTXMenuCommandInteraction<'cached'>;
	export type UserContextMenuCommandInteraction = UserCTXMenuCommandInteraction<'cached'>;
	export type MessageContextMenuCommandInteraction = MessageCTXCommandInteraction<'cached'>;
	export type AutoComplete = AutocompleteInteraction;
}