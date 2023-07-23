import { PermissionsPrecondition } from '#lib/structures'
import { ApplyOptions } from '@sapphire/decorators'
import type { Message } from 'discord.js'

@ApplyOptions<PermissionsPrecondition.Options>({ guildOnly: false })
export class UserPermissionsPrecondition extends PermissionsPrecondition {
	public override async messageRun(_: Message) {
		// no-op
		return this.error({ message: 'This should never happen, something went wrong!' })
	}

	public handle(): PermissionsPrecondition.Result {
		return this.ok()
	}
}
