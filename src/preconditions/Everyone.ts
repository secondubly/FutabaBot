import { PermissionsPrecondition } from '#lib/structures/preconditions/PermissionsPrecondition'
import { ApplyOptions } from '@sapphire/decorators'

@ApplyOptions<PermissionsPrecondition.Options>({ guildOnly: false })
export class UserPermissionsPrecondition extends PermissionsPrecondition {
	public override async messageRun() {
		// no-op
		return this.error({ message: 'This should never happen, something went wrong!' })
	}

	public handle(): PermissionsPrecondition.Result {
		return this.ok()
	}
}
