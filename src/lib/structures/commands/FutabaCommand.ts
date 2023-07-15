import { PermissionLevels } from '#lib/types/Enum'
import { OWNERS } from '#root/config'
import { PreconditionContainerArray } from '@sapphire/framework'
import { ApplicationCommandType } from 'discord.js'
import { Command } from '@sapphire/framework'

export abstract class FutabaCommand extends Command {
	public readonly permissionLevel: PermissionLevels
	public readonly description: string

	public constructor(context: Command.Context, options: FutabaCommand.Options) {
		super(context, { cooldownDelay: 10000, cooldownLimit: 2, cooldownFilteredUsers: OWNERS, ...options })

		this.permissionLevel = options.permissionLevel ?? PermissionLevels.Everyone
		this.description = options.description
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

	public override registerApplicationCommands(registry: Command.Registry) {
		// Register Chat Input command
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description
		})

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
}

export namespace FutabaCommand {
	// Options for FutabaCommands
	export type Options = Command.Options & {
		description: string
		detailedDescription?: string
		permissionLevel?: number
		requiredMember?: boolean
		preconditions?: ['GuildOnly'] // TODO: remove on production-ready
	}
}