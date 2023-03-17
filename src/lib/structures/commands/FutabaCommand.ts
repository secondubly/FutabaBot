import { PermissionLevels } from '#lib/types/Enum'
import { OWNERS } from '#root/config'
import { PieceContext, PreconditionContainerArray } from '@sapphire/framework'
import { Subcommand } from '@sapphire/plugin-subcommands'
export abstract class FutabaCommand extends Subcommand {
	public readonly permissionLevel: PermissionLevels

	public constructor(context: PieceContext, options: FutabaCommand.Options) {
		super(context, { cooldownDelay: 10000, cooldownLimit: 2, cooldownFilteredUsers: OWNERS, ...options })
		this.permissionLevel = options.permissionLevel ?? PermissionLevels.Everyone
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
	export type Options = Subcommand.Options & {
		permissionLevel?: number
		requiredMember?: boolean
	}
}
