import '#lib/setup'
import { FutabaClient } from '#lib/FutabaClient'
import { container } from '@sapphire/framework'
import { PrismaClient } from '@prisma/client'
import { PrismaClientInitializationError } from '@prisma/client/runtime/library'
import { handlePrismaInitializationError } from '#lib/database/utils'

const client = new FutabaClient()

const main = async () => {
	try {
		client.logger.info('Connecting to database')
		container.db = new PrismaClient({ errorFormat: 'pretty' })
		await container.db.$connect() // connect to DB implicitly
		client.logger.info('Database connection successful')

		client.logger.info('Logging in')
		await client.login()
		client.logger.info('logged in')
	} catch (error) {
		client.logger.fatal(error)
		if (error instanceof PrismaClientInitializationError) {
			console.error(handlePrismaInitializationError(error))
		}
		client.destroy()
		process.exit(1)
	}
}

main()
