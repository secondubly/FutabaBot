import '#lib/setup'
import { FutabaClient } from '#lib/FutabaClient'
import { container } from '@sapphire/framework'
import { PrismaClient } from '@prisma/client'
import { SettingsManager } from '#lib/database/SettingsManager'

const client = new FutabaClient()

const main = async () => {
	try {
		client.logger.info('Connecting to database')
		container.db = new PrismaClient()
		client.logger.info('Database connection successful')
		container.settings = new SettingsManager()
		client.logger.info('Settings manager initialized')
		client.logger.info('Logging in')
		await client.login()
		client.logger.info('logged in')
	} catch (error) {
		client.logger.fatal(error)
		client.destroy()
		process.exit(1)
	}
}

main()
