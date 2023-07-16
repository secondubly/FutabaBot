import { FutabaCommand } from '#lib/structures'
import { PermissionLevels } from '#lib/types/Enum'
import type { PieceContext } from '@sapphire/framework'

export abstract class ModerationCommand<T = unknown> extends FutabaCommand {
	// Whether a member is required or not
	public requiredMember: boolean

	protected constructor(context: PieceContext, options: ModerationCommand.Options) {
		super(context, {
			cooldownDelay: 5000,
			permissionLevel: PermissionLevels.Moderator,
			...options
		})

		this.requiredMember = options.requiredMember ?? false
	}
}

export namespace ModerationCommand {
	export interface Options extends FutabaCommand.Options {
		requiredMember?: boolean
	}
}
