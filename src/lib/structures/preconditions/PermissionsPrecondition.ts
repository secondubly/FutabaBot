import { AllFlowsPrecondition } from '@sapphire/framework'
import type { AsyncPreconditionResult, PieceContext, PreconditionResult } from '@sapphire/framework'
import type { ChatInputCommandInteraction, ContextMenuCommandInteraction } from 'discord.js'
import type { Command } from '@sapphire/framework'
export abstract class PermissionsPrecondition extends AllFlowsPrecondition {
	private readonly guildOnly: boolean

	public constructor(context: PieceContext, options: PermissionsPrecondition.Options = {}) {
		super(context, options)
		this.guildOnly = options.guildOnly ?? true
	}

	public abstract handle(
		interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction,
		command: Command,
		context: PermissionsPrecondition.Context
	): PermissionsPrecondition.Result

	public chatInputRun(
		interaction: ChatInputCommandInteraction,
		command: Command,
		context: AllFlowsPrecondition.Context
	): PermissionsPrecondition.Result {
		return this.handle(interaction, command, context)
	}

	public contextMenuRun(
		interaction: ContextMenuCommandInteraction,
		command: Command,
		context: AllFlowsPrecondition.Context
	): AllFlowsPrecondition.Result {
		return this.handle(interaction, command, context)
	}
}

export namespace PermissionsPrecondition {
	export type Context = AllFlowsPrecondition.Context
	export type Result = PreconditionResult
	export type AsyncResult = AsyncPreconditionResult
	export interface Options extends AllFlowsPrecondition.Options {
		guildOnly?: boolean
	}
}
