import { AllFlowsPrecondition, PreconditionResult, PieceContext, AsyncPreconditionResult } from '@sapphire/framework'
import type { ChatInputCommandInteraction, ContextMenuCommandInteraction, Message } from 'discord.js'
import { Identifiers } from '@sapphire/framework'
import type { Command } from '@sapphire/framework'
import type { GuildMessage } from '#lib/types'
export abstract class PermissionsPrecondition extends AllFlowsPrecondition {
	private readonly guildOnly: boolean

	public constructor(context: PieceContext, options: PermissionsPrecondition.Options = {}) {
		super(context, options)
		this.guildOnly = options.guildOnly ?? true
	}

	public async run(message: GuildMessage, command: Command, context: AllFlowsPrecondition.Context): PermissionsPrecondition.AsyncResult {
		if (message.guild === null || message.member === null) {
			return this.guildOnly ? this.error({ identifier: Identifiers.PreconditionGuildOnly }) : this.ok()
		}

		// run the specific precondition's logic
		return this.handle(message, command, context)
	}

	public abstract handle(
		messageOrInteraction: GuildMessage | ChatInputCommandInteraction | ContextMenuCommandInteraction,
		command: Command,
		context: PermissionsPrecondition.Context
	): PermissionsPrecondition.Result

	public override messageRun(message: Message, command: Command, context: AllFlowsPrecondition.Context) {
		return this.handle(message as GuildMessage, command, context)
	}

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
