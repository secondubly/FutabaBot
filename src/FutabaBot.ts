import './lib/setup'
import { FutabaClient } from '#lib/FutabaClient'

const client = new FutabaClient()

const main = async () => {
	try {
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
