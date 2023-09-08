import '#lib/setup'
import { FutabaClient } from '#lib/FutabaClient'
import { container } from '@sapphire/framework'
import { PrismaClient } from '@prisma/client'
import { SettingsManager } from '#lib/database/SettingsManager'
import { WarningManager } from '#lib/database/WarningManager'

const client = new FutabaClient()

const main = async () => {
	try {
		client.logger.info('Connecting to database')
		container.db = new PrismaClient()
		client.logger.info('Database connection successful')
		client.logger.info('Initializing...')
		container.settings = new SettingsManager()
		container.warns = new WarningManager()
		client.logger.info('Initialization successful')

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
