import { SettingsManager } from '#lib/database/SettingsManager'
import { Warn } from '#lib/moderation/structures/Warn'
import { WarnActionManager } from '#lib/moderation/structures/WarnActionManager'
import { WarningManager } from '#lib/moderation/structures/WarningManager'
import { WarnAction } from '@prisma/client'
import { ApplyOptions } from '@sapphire/decorators'
import { Listener, Store } from '@sapphire/framework'
import { blue, gray, green, magenta, magentaBright, white, yellow } from 'colorette'

const dev = process.env.NODE_ENV !== 'production'

@ApplyOptions<Listener.Options>({ once: true })
export class UserEvent extends Listener {
	private readonly style = dev ? yellow : blue

	public run() {
		this.printBanner()
		this.printStoreDebugInformation()
		this.managerSetup()
	}

	private printBanner() {
		const success = green('+')

		const llc = dev ? magentaBright : white
		const blc = dev ? magenta : blue

		const line01 = llc('')
		const line02 = llc('')
		const line03 = llc('')

		// Offset Pad
		const pad = ' '.repeat(7)

		console.log(
			String.raw`
${line01} ${pad}${blc('1.0.0')}
${line02} ${pad}[${success}] Gateway
${line03}${dev ? ` ${pad}${blc('<')}${llc('/')}${blc('>')} ${llc('DEVELOPMENT MODE')}` : ''}
		`.trim()
		)
	}

	private printStoreDebugInformation() {
		const { client, logger } = this.container
		const stores = [...client.stores.values()]
		const last = stores.pop()!

		for (const store of stores) logger.info(this.styleStore(store, false))
		logger.info(this.styleStore(last, true))
	}

	// eslint-disable-next-line  @typescript-eslint/no-explicit-any
	private styleStore(store: Store<any>, last: boolean) {
		return gray(`${last ? '└─' : '├─'} Loaded ${this.style(store.size.toString().padEnd(3, ' '))} ${store.name}.`)
	}

	
	private async settingsSetup() {
		const { client } = this.container
		const guildIDs = Array.from(client.guilds.cache.keys())
		const guildSettings = await this.container.db.settings.findMany({
			where: { guild: { in: guildIDs } }
		})

		this.container.settings = new SettingsManager(guildIDs, guildSettings)
	}

	private async managerSetup() {
		try {
			await this.settingsSetup()
			console.info('Settings manager initialized')
			await this.warningManagerSetup()
			console.info('Warning manager initialized')
			await this.warnActionManagerSetup()
			console.info('Warn action manager initialized')
		} catch (err) {
			console.error(err)
		}
	}

	private async warningManagerSetup() {
		const { client } = this.container
		const guilds = client.guilds.cache.values()

		const guildIDs = [...client.guilds.cache.keys()]
		let result = await this.container.db.guildWarns.findMany({
            select: {
                warns: true
            },
            where: { 
                id: { in: guildIDs }
            }
        })

		const warns: Warn[] = []
		for (const warn of result[0].warns) {
			const { client } = this.container
			const guild = await client.guilds.fetch(warn.guildId)
			const target = await guild.members.fetch(warn.targetId)
			const mod = await guild.members.fetch(warn.mod)
			warns.push(new Warn(warn.guildId, warn.id, warn.severity, warn.expiration, target, mod, warn.reason, warn.status, warn.date))
		}
		this.container.warns = new WarningManager([...guilds], warns)
	}

	private async warnActionManagerSetup() {
		const { client } = this.container
		const guilds = client.guilds.cache.values()

		const guildIDs = [...client.guilds.cache.keys()]

		let result = await this.container.db.guildWarns.findMany({
			select: { actions: true },
			where: { id: { in: guildIDs } }
		})

		const warnActions: WarnAction[] = result[0].actions
		this.container.actions = new WarnActionManager([...guilds], warnActions)
	}
}
