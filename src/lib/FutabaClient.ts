import { Enumerable } from '@sapphire/decorators'
import { SapphireClient, container } from '@sapphire/framework'
import { CLIENT_OPTIONS } from '#root/config'

export class FutabaClient extends SapphireClient {
	@Enumerable(false)
	public dev = process.env.NODE_ENV !== 'production'

	public constructor() {
		super(CLIENT_OPTIONS)
	}

	public async login(token?: string) {
		const loginResponse = await super.login(token)
		return loginResponse
	}

	public async destroy() {
		container.db.$disconnect
		return super.destroy()
	}
}
